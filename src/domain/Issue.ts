import {
  IssuesOpenedEvent,
  Issue as GitHubIssue
} from '@octokit/webhooks-definitions/schema'
import {Entity} from './Entity'
import {IssuesRepo} from '../repo/Issues'
import {PullRequest} from './PullRequest'
import {BodyIssueRels, RelsRepo} from '../repo/BodyIssueRels'

export interface Reference {
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
  partOf?: Reference
  subtasks: Map<string, Subtask>
  resolvedBy?: PullRequest
  relsBackend: RelsRepo<Issue>

  protected constructor(issue: GitHubIssue, owner: string, repo: string) {
    super(issue)

    this.props = issue
    this.owner = owner
    this.repo = repo
    // this.partOf = this.detectsPartOf()
    this.subtasks = new Map<string, Subtask>()

    const rels = new BodyIssueRels()
    this.relsBackend = rels
    this.detectsRelationships()
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

    this.updateRelationships()
  }

  setResolvedBy(pullRequest: PullRequest): Issue {
    this.resolvedBy = pullRequest

    this.updateRelationships()

    return this
  }

  protected updateRelationships(): void {
    this.relsBackend.save(this)
  }

  protected detectsRelationships(): void {
    this.relsBackend.load(this)
  }
}
