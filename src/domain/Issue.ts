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

interface IPartOf {
  user: string
  repo: string
  id: string
}

export class Issue extends Entity<GitHubIssue> {
  readonly partOf?: IPartOf

  protected constructor(issue: GitHubIssue) {
    super(issue)

    this.props = issue
    this.partOf = this.detectsPartOf()
  }

  get labels(): string[] {
    return Array.from(this.props.labels || []).map(label => label.name)
  }

  get id(): number {
    return this.props.id
  }

  hasParent(): boolean {
    return this.partOf !== undefined
  }

  static fromEventPayload(event: IssuesOpenedEvent): Issue {
    return new Issue(event.issue)
  }

  static fromApiPayload(payload: GitHubIssue): Issue {
    return new Issue(payload)
  }

  static parsePartOf(raw: string): IPartOf | undefined {
    const re = /^(([-\w]+)\/([-\w]+))?#([0-9]+)$/
    const res = raw.match(re)

    return res
      ? {
          user: res[2],
          repo: res[3],
          id: res[4]
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
              partOf = Issue.parsePartOf(node.data.partOf as string)
            }
          })
        }
      })
      .use(stringify)
      .processSync(this.props.body)

    return partOf
  }
}
