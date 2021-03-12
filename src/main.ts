import * as core from '@actions/core'
import * as github from '@actions/github'
import {IssuesOpenedEvent} from '@octokit/webhooks-definitions/schema'
import {Issue} from './domain/Issue'
import {IssuesRepo} from './repo/Issues'

async function run(): Promise<void> {
  try {
    let issue, repo, relatedIssue
    switch (github.context.payload.action) {
      case 'edited':
      case 'opened':
        issue = Issue.fromEventPayload(
          github.context.payload as IssuesOpenedEvent
        )

        if (issue.partOf === undefined) {
          return
        }

        // TODO: get the related issue using the repo
        repo = new IssuesRepo(core.getInput('repo-token'))

        relatedIssue = await repo.get(issue.partOf)

        if (relatedIssue === undefined) {
          core.setFailed(`Action could not find the related issue `)
          return
        }

        relatedIssue.body = `${relatedIssue.body}\n\nupdated`

        // TODO: update the related issues section with this issue
        await repo.save(relatedIssue)

        core.setOutput('partOf', issue.partOf)
        break
      case 'closed':
      default:
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
