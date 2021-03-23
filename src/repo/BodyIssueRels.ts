// import * as core from '@actions/core'
import unified, {Processor} from 'unified'
import markdown from 'remark-parse'
import frontmatter from 'remark-frontmatter'
import gfm from 'remark-gfm'
import visit from 'unist-util-visit'
import {Parent, Node} from 'unist'
import YAML from 'yaml'
import {Issue} from '../domain/Issue'
import {Section} from '../domain/Section'

export interface IPartOf {
  owner: string
  repo: string
  issue_number: number
}

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
  ): IPartOf | undefined {
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

  protected processor: Processor

  constructor() {
    this.processor = unified()
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
  }

  load(issue: Issue): void {
    const tree = this.processor.parse(issue.body)

    this.findsPartOf(issue, tree)
    this.findsSubtasks(issue, tree)
  }

  save(issue: Issue): void {
    issue
  }

  protected findsPartOf(issue: Issue, tree: Node): void {
    visit(tree, 'yaml', node => {
      // core.debug(JSON.stringify(node))
      const patched = (node.value as string).replace(
        /partOf: (#[0-9]*)/,
        'partOf: "$1"'
      )

      node.data = YAML.parse(patched)

      if (node.data && node.data.partOf) {
        issue.partOf = BodyIssueRels.parsePartOf(
          node.data.partOf as string,
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
