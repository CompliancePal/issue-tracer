import {
  IssuesOpenedEvent,
  Issue as GitHubIssue
} from '@octokit/webhooks-definitions/schema'
import unified from 'unified'
import markdown from 'remark-parse'
import frontmatter from 'remark-frontmatter'
import stringify from 'remark-stringify'
import YAML from 'yaml'
import visit from 'unist-util-visit'
import {Entity} from './Entity'

export interface IPartOf {
  owner: string
  repo: string
  issue_number: number
}

export class Issue extends Entity<GitHubIssue> {
  readonly partOf?: IPartOf
  readonly owner: string
  readonly repo: string

  protected constructor(issue: GitHubIssue, owner: string, repo: string) {
    super(issue)

    this.props = issue
    this.owner = owner
    this.repo = repo
    this.partOf = this.detectsPartOf()
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

  protected detectsPartOf(): IPartOf | undefined {
    let partOf: IPartOf | undefined

    unified()
      .use(markdown)
      .use(frontmatter, [
        {
          type: 'yaml',
          marker: {
            open: '#',
            close: '#'
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
}
