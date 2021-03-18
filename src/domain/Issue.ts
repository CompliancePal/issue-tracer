import {
  IssuesOpenedEvent,
  Issue as GitHubIssue
} from '@octokit/webhooks-definitions/schema'
import unified from 'unified'
import markdown from 'remark-parse'
import frontmatter from 'remark-frontmatter'
import stringify from 'remark-stringify'
import gfm from 'remark-gfm'
import YAML from 'yaml'
import visit from 'unist-util-visit'
// import filter from 'unist-util-filter'
import {Parent} from 'unist'
import {Entity} from './Entity'
import {Section} from './Section'
import {styleMarkdownOutput} from '../plugins/unified'

export interface IPartOf {
  owner: string
  repo: string
  issue_number: number
}

export interface Subtask {
  id: string
  title: string
  closed: boolean
  removed: boolean
  repo: string
  owner: string
}

const subtaskToString = (
  subtask: Subtask,
  isCrossReference: boolean
): string => {
  const reference = isCrossReference ? `${subtask.owner}/${subtask.repo}` : ''
  return `${reference}#${subtask.id}`
}

export class Issue extends Entity<GitHubIssue> {
  static fromEventPayload(event: IssuesOpenedEvent): Issue {
    const owner = event.repository.owner.login
    const repo = event.repository.name
    return new Issue(event.issue, owner, repo)
  }

  static fromApiPayload(
    payload: GitHubIssue,
    owner: string,
    repo: string
  ): Issue {
    return new Issue(payload, owner, repo)
  }

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

  readonly partOf?: IPartOf
  readonly owner: string
  readonly repo: string
  subtasks: Map<string, Subtask>

  protected constructor(issue: GitHubIssue, owner: string, repo: string) {
    super(issue)

    this.props = issue
    this.owner = owner
    this.repo = repo
    this.partOf = this.detectsPartOf()
    this.subtasks = this.detectsSubIssues()
  }

  get body(): string {
    return this.props.body
  }

  set body(content: string) {
    this.props.body = content
  }

  get labels(): string[] {
    return Array.from(this.props.labels || []).map(label => label.name)
  }

  get id(): number {
    return this.props.id
  }

  get number(): number {
    return this.props.number
  }

  get closed(): boolean {
    return this.props.state === 'closed'
  }

  get title(): string {
    return this.props.title
  }

  hasParent(): boolean {
    return this.partOf !== undefined
  }

  equals(issue: Issue): boolean {
    return (
      this.number === issue.number &&
      this.owner === issue.owner &&
      this.repo === issue.repo
    )
  }

  /**
   * Is cross reference when the owner or the repo name are different
   */
  isCrossReference(issue: Issue | Subtask): boolean {
    return this.owner !== issue.owner || this.repo !== issue.repo
  }

  addSubtask(subtask: Subtask): void {
    // FIXME: add cross reference
    const id = subtask.id.startsWith('#') ? subtask.id : `#${subtask.id}`

    this.subtasks.set(id, subtask)

    //TODO: remove the section form the existing body

    // const tree = processor.parse(this.body) as Parent

    const stringifier = unified()
      .use(markdown)
      .use(gfm)
      .use(styleMarkdownOutput, {
        comment: '<!-- Section created by CompliancePal. Do not edit -->'
      })
      .use(() => {
        return tree => {
          const section = new Section('traceability')

          const sectionContent = `## Traceability <!-- traceability -->\n<!-- Section created by CompliancePal. Do not edit -->\n\n### Related issues\n\n${Array.from(
            this.subtasks.values()
          )
            .map(
              _subtask =>
                `* [${_subtask.closed ? 'x' : ' '}] ${
                  _subtask.title
                } (${subtaskToString(
                  _subtask,
                  this.isCrossReference(_subtask)
                )})`
            )
            .join('\n')}\n`

          const processor = unified().use(markdown).use(gfm)

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

          if (!section.found) return tree

          const before = (tree as Parent).children.filter(
            (node, index) => index < (section.start || 0)
          )

          const after = (tree as Parent).children.filter(
            (node, index) =>
              index >= (section.end || (tree as Parent).children.length)
          )

          const sectionTree = processor.parse(sectionContent) as Parent

          const result = processor.parse('') as Parent

          result.children = before.concat(sectionTree.children).concat(after)

          return result
        }
      })
      .use(stringify)

    const sectionBody = stringifier.processSync(this.body)

    // console.log(stringifier.data().toMarkdownExtensions)

    this.body = sectionBody.contents as string
  }

  protected detectsPartOf(): IPartOf | undefined {
    let partOf: IPartOf | undefined

    unified()
      .use(markdown)
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
      .use(() => {
        return tree => {
          visit(tree, 'yaml', node => {
            const patched = (node.value as string).replace(
              /partOf: (#[0-9]*)/,
              'partOf: "$1"'
            )

            node.data = YAML.parse(patched)
          })
        }
      })
      .use(() => {
        return tree => {
          visit(tree, 'yaml', node => {
            if (node.data && node.data.partOf) {
              partOf = Issue.parsePartOf(
                node.data.partOf as string,
                this.owner,
                this.repo
              )
            }
          })
        }
      })
      .use(stringify)
      .processSync(this.props.body)

    return partOf
  }

  protected detectsSubIssues(): Map<string, Subtask> {
    const subtasks = new Map<string, Subtask>()

    unified()
      .use(markdown)
      .use(gfm)
      .use(stringify)
      .use(() => {
        return tree => {
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

                        const parsed = Issue.parsePartOf(
                          raw,
                          this.owner,
                          this.repo
                        )

                        if (parsed) {
                          const {issue_number, owner, repo} = parsed

                          subtasks.set(raw, {
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
      })
      .processSync(this.props.body)

    return subtasks
  }
}
