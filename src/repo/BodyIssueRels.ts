// import * as core from '@actions/core'
import unified, {Processor} from 'unified'
import markdown from 'remark-parse'
import frontmatter from 'remark-frontmatter'
import gfm from 'remark-gfm'
import stringify from 'remark-stringify'
import visit from 'unist-util-visit'
import {Parent, Node} from 'unist'
import YAML from 'yaml'
import {Issue, Reference, Subtask} from '../domain/Issue'
import {Section} from './Section'
import {SectionExporter} from './exporters/SectionExporter'
import {styleMarkdownOutput} from '../plugins/unified'

export interface RelsRepo<T> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  load(obj: T): void

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  save(obj: T): void
}

export class BodyIssueRels implements RelsRepo<Issue> {
  static parsePartOf(
    raw: string,
    owner: string,
    repo: string
  ): Reference | undefined {
    const re = /^(([-\w]+)\/([-\w]+))?#([0-9]+)$/
    const res = raw.match(re)

    return res
      ? {
          owner: res[2] ? res[2] : owner,
          repo: res[3] ? res[3] : repo,
          issue_number: parseInt(res[4])
        }
      : undefined
  }

  protected get processor(): Processor {
    return (
      unified()
        .use(markdown)
        .use(gfm)
        .use(frontmatter, [
          {
            type: 'yaml',
            marker: {
              open: '-',
              close: '-'
            },
            anywhere: true
          }
        ])
        .use(styleMarkdownOutput, {
          comment: SectionExporter.COMMENT
        })
        //TODO: investigate why we need the previous plugin
        .use(
          stringify
          // , {
          // extensions: [
          //   {
          //     bullet: '-',
          //     listItemIndent: 'one',
          //     rule: '-',
          //     join: [
          //       (first: Node, second: Node) => {
          //         // do not add space between the heading and the comment
          //         if (
          //           first.type === 'heading' &&
          //           second.type === 'html' &&
          //           second.value === SectionExporter.COMMENT
          //         ) {
          //           core.debug('handled comment')
          //           // join signature does not allow to return number
          //           return (0 as unknown) as boolean
          //         }
          //         // do not add space in frontmatter
          //         if (
          //           first.type === 'thematicBreak' &&
          //           second.type === 'paragraph'
          //         ) {
          //           // join signature does not allow to return number
          //           return (0 as unknown) as boolean
          //         }
          //         return true
          //       }
          //     ]
          //   }
          // ]
          // }
        )
    )
  }

  load(issue: Issue): void {
    const tree = this.processor.parse(issue.body)

    this.findsPartOf(issue, tree)
    this.findsSubtasks(issue, tree)
  }

  save(issue: Issue): void {
    const stringifier = this.processor.use(() => {
      return tree => {
        const section = new Section('traceability')
        const exporter = new SectionExporter(2)

        const sectionHeading = exporter.heading()

        const resolvedBySection = exporter.resolvedBy(issue.resolvedBy)

        const testCasesSection =
          issue.resolvedBy && exporter.testCases(issue.resolvedBy)

        const subtasksSection = `### Related issues\n\n${Array.from(
          issue.subtasks.values()
        )
          .map(
            _subtask =>
              `* [${_subtask.closed ? 'x' : ' '}] ${
                _subtask.title
              } (${subtaskToString(
                _subtask,
                issue.isCrossReference(_subtask)
              )})`
          )
          .join('\n')}\n`

        const processor = this.processor

        visit(tree, 'heading', (node: Parent, position: number) => {
          if (section.isStartMarker(node)) {
            section.enter(position, node.depth as number)
          } else {
            // inside section
            if (section.isInside()) {
              // end
              if (section.isEndMarker(node.depth as number)) {
                section.leave(position)
              }
            }
          }
        })

        if (section.isInside()) {
          section.leave((tree as Parent).children.length)
        }

        if (!section.found) return tree

        const before = (tree as Parent).children.filter(
          (node, index) => index < (section.start || 0)
        )

        const after = (tree as Parent).children.filter(
          (node, index) =>
            index >= (section.end || (tree as Parent).children.length)
        )

        const sectionTree = processor.parse(
          [sectionHeading, resolvedBySection, testCasesSection, subtasksSection]
            .filter(part => part !== null)
            .join('\n')
        ) as Parent

        const result = processor.parse('') as Parent

        result.children = before.concat(sectionTree.children).concat(after)

        return result
      }
    })

    const sectionBody = stringifier.processSync(issue.body)

    issue.body = (sectionBody.contents as string).trim()
  }

  protected findsPartOf(issue: Issue, tree: Node): void {
    visit(tree, 'yaml', node => {
      // core.debug(JSON.stringify(node))
      const patched = (node.value as string).replace(
        /partOf: (#[0-9]*)/,
        'partOf: "$1"'
      )

      const data = YAML.parse(patched)

      if (data && data.partOf) {
        issue.partOf = BodyIssueRels.parsePartOf(
          data.partOf as string,
          issue.owner,
          issue.repo
        )
      }
    })
  }

  protected findsSubtasks(issue: Issue, tree: Node): void {
    const section = new Section('traceability')

    visit(tree, ['heading', 'list'], (node: Parent, position: number) => {
      switch (node.type) {
        case 'heading':
          // no information
          if (section.isStartMarker(node)) {
            section.enter(position, node.depth as number)
          } else {
            // inside section
            if (section.isInside()) {
              // end
              if (section.isEndMarker(node.depth as number)) {
                section.leave(position)
              }
            }
          }
          break
        case 'list':
          if (section.isInside()) {
            visit(node, 'listItem', item => {
              visit(item, 'paragraph', p => {
                visit(p, 'text', text => {
                  const raw = (text.value as string)
                    .split('(')[1]
                    .replace(')', '')

                  const title = (text.value as string).split(' (')[0]

                  const parsed = BodyIssueRels.parsePartOf(
                    raw,
                    issue.owner,
                    issue.repo
                  )

                  if (parsed) {
                    const {issue_number, owner, repo} = parsed

                    issue.subtasks.set(raw, {
                      id: issue_number.toString(),
                      title,
                      removed: false,
                      closed: !!item.checked,
                      owner,
                      repo
                    })
                  }
                })
              })
            })
          }
      }
    })
  }
}

const subtaskToString = (
  subtask: Subtask,
  isCrossReference: boolean
): string => {
  const reference = isCrossReference ? `${subtask.owner}/${subtask.repo}` : ''
  return `${reference}#${subtask.id}`
}
