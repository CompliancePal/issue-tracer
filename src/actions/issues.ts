import * as core from '@actions/core'
import * as github from '@actions/github'
import {IssuesOpenedEvent} from '@octokit/webhooks-definitions/schema'
import {Issue} from '../domain/Issue'
import {IssuesRepo} from '../repo/Issues'

export const issuesHandler = async (): Promise<void> => {
  const ghToken = process.env.GITHUB_TOKEN

  if (ghToken === undefined) {
    core.setFailed(`GITHUB_TOKEN not provided`)
    return
  }

  let issue, repo, relatedIssue

  switch (github.context.payload.action) {
    case 'edited':
    case 'opened':
    case 'closed':
    case 'reopened':
      issue = Issue.fromEventPayload(
        github.context.payload as IssuesOpenedEvent
      )
      core.info(`Issue ${issue.number} parsed successfuly`)

      if (issue.partOf === undefined) {
        core.info('Issue is not partOf other issues')
        return
      }

      repo = new IssuesRepo(ghToken)

      relatedIssue = await repo.get(issue.partOf)

      if (relatedIssue === undefined) {
        core.setFailed(`Action could not find the related issue `)
        return
      }
      core.info(`Related issue ${relatedIssue.number} found sucessfuly`)

      core.info(
        `Related issue ${relatedIssue.number} has ${relatedIssue.subtasks.size} subtasks`
      )

      relatedIssue.addSubtask({
        id: issue.number.toString(),
        title: issue.title,
        closed: issue.closed,
        removed: false,
        owner: issue.owner,
        repo: issue.repo
      })

      await repo.save(relatedIssue)
      core.info(`Related issue ${relatedIssue.number} updated sucessfuly`)

      core.setOutput('partOf', issue.partOf)
      break
    default:
  }
}
