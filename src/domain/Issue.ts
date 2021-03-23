// import * as core from '@actions/core'
import {
  IssuesOpenedEvent,
  Issue as GitHubIssue
} from '@octokit/webhooks-definitions/schema'
import {Entity} from './Entity'
import {IssuesRepo} from '../repo/Issues'
import {PullRequest} from './PullRequest'
import {BodyIssueRels, RelsRepo} from '../repo/BodyIssueRels'
import {Subtask} from './Subtask'

export interface Reference {
  owner: string
  repo: string
  issue_number: number
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

  /**
   * Creates an issue from a reference extracted from the issue body or from another backend
   */
  static fromReference({
    id,
    owner,
    repo,
    title,
    state
  }: {
    id: string
    title: string
    state: 'open' | 'closed' | undefined
    repo: string
    owner: string
  }): Issue {
    return new Issue(
      ({
        number: parseInt(id),
        id: parseInt(id),
        state,
        body: '',
        labels: [],
        title
      } as unknown) as GitHubIssue,
      owner,
      repo
    )
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

  /**
   *
   * @param issue issue to be added as subtask
   * @param updateBody triggers issue body update
   */
  addSubtask(issue: Issue, updateBody = true): void {
    const subtask = Subtask.create({
      id: issue.number.toString(),
      title: issue.title,
      closed: issue.closed,
      owner: issue.owner,
      repo: issue.repo,
      crossReference: this.isCrossReference(issue)
    })

    this.addSubtaskInternal(subtask)

    if (updateBody) {
      this.updateRelationships()
    }
  }

  //TODO: investigate how to create a subtask smarter for internal use
  private addSubtaskInternal(subtask: Subtask): void {
    // const id = this.isCrossReference(subtask)
    //   ? `${subtask.owner}/${subtask.repo}#${subtask.id}`
    //   : subtask.id.startsWith('#')
    //   ? subtask.id
    //   : `#${subtask.id}`

    // core.debug(`${subtask.toString()} - ${subtask.id}`)
    // core.debug(subtask.id)

    // if (!(subtask instanceof Subtask)) throw new Error()

    this.subtasks.set(subtask.toString(), subtask)
  }

  setResolvedBy(pullRequest: PullRequest): Issue {
    this.resolvedBy = pullRequest

    this.updateRelationships()

    return this
  }

  private updateRelationships(): void {
    this.relsBackend.save(this)
  }

  protected detectsRelationships(): void {
    this.relsBackend.load(this)
  }
}
