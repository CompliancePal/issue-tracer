import {
  IssuesOpenedEvent,
  Issue as GitHubIssue
} from '@octokit/webhooks-definitions/schema'
import unified from 'unified'
import markdown from 'remark-parse'
import stringify from 'remark-stringify'
import gfm from 'remark-gfm'
import visit from 'unist-util-visit'
import {Parent} from 'unist'
import {Entity} from './Entity'
import {Section} from './Section'
import {styleMarkdownOutput} from '../plugins/unified'
import {IssuesRepo} from '../repo/Issues'
import {PullRequest} from './PullRequest'
import {SectionExporter} from './exporters/SectionExporter'
import {BodyIssueRels, RelsRepo} from '../repo/BodyIssueRels'

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
  toString(): string
}

const subtaskToString = (
  subtask: Subtask,
  isCrossReference: boolean
): string => {
  const reference = isCrossReference ? `${subtask.owner}/${subtask.repo}` : ''
  return `${reference}#${subtask.id}`
}

export class Issue extends Entity<GitHubIssue> {
  static fromEventPayload({
    issue,
    repository: {
      name: repo,
      owner: {login: owner}
    }
  }: IssuesOpenedEvent): Issue {
    const result = new Issue(issue, owner, repo)

    return result
  }

  static fromApiPayload(
    payload: GitHubIssue,
    owner: string,
    repo: string
  ): Issue {
    const result = new Issue(payload, owner, repo)

    return result
  }

  readonly owner: string
  readonly repo: string
  partOf?: IPartOf
  subtasks: Map<string, Subtask>
  resolvedBy?: PullRequest

  protected constructor(issue: GitHubIssue, owner: string, repo: string) {
    super(issue)

    this.props = issue
    this.owner = owner
    this.repo = repo
    // this.partOf = this.detectsPartOf()
    this.subtasks = new Map<string, Subtask>()

    const rels = new BodyIssueRels()
    this.detectsRels(rels)
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

  async save(repo: IssuesRepo): Promise<void> {
    return repo.save(this)
  }

  /**
   * Is cross reference when the owner or the repo name are different
   */
  isCrossReference(issue: Issue | Subtask): boolean {
    return this.owner !== issue.owner || this.repo !== issue.repo
  }

  addSubtask(subtask: Subtask): void {
    const id = this.isCrossReference(subtask)
      ? `${subtask.owner}/${subtask.repo}#${subtask.id}`
      : subtask.id.startsWith('#')
      ? subtask.id
      : `#${subtask.id}`

    this.subtasks.set(id, subtask)

    this.updateBody()
  }

  addResolvedBy(pullRequest: PullRequest): void {
    this.resolvedBy = pullRequest

    this.updateBody()
  }

  protected updateBody(): void {
    const stringifier = unified()
      .use(markdown)
      .use(gfm)
      .use(styleMarkdownOutput, {
        comment: SectionExporter.COMMENT
      })
      .use(() => {
        return tree => {
          const section = new Section('traceability')
          const exporter = new SectionExporter(2)

          const sectionHeading = exporter.heading()

          const resolvedBySection = exporter.resolvedBy(this.resolvedBy)

          const testCasesSection =
            this.resolvedBy && exporter.testCases(this.resolvedBy)

          const subtasksSection = `### Related issues\n\n${Array.from(
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
            [
              sectionHeading,
              resolvedBySection,
              testCasesSection,
              subtasksSection
            ]
              .filter(part => part !== null)
              .join('\n')
          ) as Parent

          const result = processor.parse('') as Parent

          result.children = before.concat(sectionTree.children).concat(after)

          return result
        }
      })
      .use(stringify)

    const sectionBody = stringifier.processSync(this.body)

    this.body = (sectionBody.contents as string).trim()
  }

  protected detectsRels(rels: RelsRepo<Issue>): void {
    rels.load(this)
  }
}
