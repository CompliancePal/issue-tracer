import * as github from '@actions/github'
import {Issue as GitHubIssue} from '@octokit/webhooks-definitions/schema'

import {Reference, Issue} from '../domain/Issue'

export class IssuesRepo {
  token: string

  constructor(token: string) {
    this.token = token
  }

  async get({
    owner,
    repo,
    issue_number
  }: Reference): Promise<Issue | undefined> {
    try {
      const gh = github.getOctokit(this.token)

      const response = await gh.issues.get({
        owner,
        repo,
        issue_number
      })

      return Issue.fromApiPayload(response.data as GitHubIssue, owner, repo)
    } catch (error) {
      return
    }
  }

  async save(issue: Issue): Promise<void> {
    const gh = github.getOctokit(this.token)

    await gh.issues.update({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
      body: issue.body
    })
  }
}
