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
// import {Parent} from 'unist'
import {Entity} from './Entity'

export interface IPartOf {
  owner: string
  repo: string
  issue_number: number
}

interface Subtask {
  id: string
  title: string
  closed: boolean
  removed: boolean
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

  get isClosed(): boolean {
    return this.props.state === 'closed'
  }

  get title(): string {
    return this.props.title
  }

  hasParent(): boolean {
    return this.partOf !== undefined
  }

  addSubtask(subtask: Subtask): void {
    this.subtasks.set(subtask.id, subtask)

    this.body = `## Traceability\n\n### Related issues\n<!-- Section created by CompliancePal. Do not edit -->\n\n${Array.from(
      this.subtasks.values()
    )
      .map(
        _subtask =>
          `- [${_subtask.closed ? 'x' : ' '}] ${_subtask.title} (${
            _subtask.id
          })`
      )
      .join('\n')}`
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

    // const isMyHeading = (
    //   heading: Parent,
    //   level: number,
    //   value: string
    // ): boolean => {
    //   return heading.depth === level && heading.children[0].value === value
    // }

    unified()
      .use(markdown)
      .use(gfm)
      .use(stringify)
      .use(() => {
        return tree => {
          // let h1 = 0
          // let h2 = 0

          // visit(tree, 'heading', heading => {
          //   if (isMyHeading(heading as Parent, 2, 'Traceability')) {
          //     h1++
          //   }

          //   if (
          //     h1 === 1 &&
          //     isMyHeading(heading as Parent, 3, 'Related issues')
          //   ) {
          //     h2++
          //   }
          // })

          // console.log(h1, h2)

          visit(tree, 'list', list => {
            visit(list, 'listItem', item => {
              visit(item, 'paragraph', p => {
                visit(p, 'text', text => {
                  const id = (text.value as string)
                    .split('(')[1]
                    .replace(')', '')
                  // console.log(text.value)
                  subtasks.set(id, {
                    id,
                    title: (text.value as string).split(' (')[0],
                    removed: false,
                    closed: !!item.checked
                  })
                })
              })
            })
          })
        }
      })
      .processSync(this.props.body)

    return subtasks
  }
}
