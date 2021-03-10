import * as core from '@actions/core'
import * as github from '@actions/github'
import {IssuesOpenedEvent} from '@octokit/webhooks-definitions/schema'
import {Issue} from './domain/Issue'

async function run(): Promise<void> {
  try {
    let issue
    switch (github.context.payload.action) {
      case 'edited':
      case 'opened':
        issue = Issue.fromEventPayload(
          github.context.payload as IssuesOpenedEvent
        )

        if (issue.partOf === undefined) {
          return
        }

        // TODO: get the partOf issue

        core.setOutput('partOf', issue.partOf)
        break
      default:
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
