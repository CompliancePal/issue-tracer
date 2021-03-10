import * as core from '@actions/core'
import * as github from '@actions/github'
import {IssuesOpenedEvent} from '@octokit/webhooks-definitions/schema'
import {Issue} from './domain/Issue'

async function run(): Promise<void> {
  try {
    const issue = Issue.fromEventPayload(
      github.context.payload as IssuesOpenedEvent
    )

    core.setOutput('partOf', issue.partOf)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
