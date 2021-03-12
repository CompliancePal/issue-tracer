import * as core from '@actions/core'
import * as github from '@actions/github'
import {IssuesOpenedEvent} from '@octokit/webhooks-definitions/schema'
import {Issue} from './domain/Issue'
import {IssuesRepo} from './repo/Issues'

const ghToken = process.env.GITHUB_TOKEN

async function run(): Promise<void> {
  if (ghToken === undefined) {
    core.setFailed(`GITHUB_TOKEN not provided`)
    return
  }

  try {
    let issue, repo, relatedIssue

    switch (github.context.payload.action) {
      case 'edited':
      case 'opened':
        issue = Issue.fromEventPayload(
          github.context.payload as IssuesOpenedEvent
        )
        core.info(`Issue ${issue.number} parsed successfuly`)

        if (issue.partOf === undefined) {
          core.info('Issue is not partOf other issues')
          return
        }

        // TODO: get the related issue using the repo
        repo = new IssuesRepo(ghToken)

        relatedIssue = await repo.get(issue.partOf)

        if (relatedIssue === undefined) {
          core.setFailed(`Action could not find the related issue `)
          return
        }
        core.info(`Related issue ${relatedIssue.number} found sucessfuly`)

        relatedIssue.body = `## Traceability\n\n### Related issues\n<!-- Section created by CompliancePal. Do not edit -->\n- [${
          issue.isClosed ? 'x' : ' '
        }] ${issue.title} (#${issue.number})`

        // TODO: update the related issues section with this issue
        await repo.save(relatedIssue)
        core.info(`Related issue ${relatedIssue.number} updated sucessfuly`)

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
