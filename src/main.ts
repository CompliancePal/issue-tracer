import * as core from '@actions/core'
import * as github from '@actions/github'
import {issuesHandler} from './actions/issues'
// import {IssuesOpenedEvent} from '@octokit/webhooks-definitions/schema'
// import {Issue} from './domain/Issue'
// import {IssuesRepo} from './repo/Issues'

const ghToken = process.env.GITHUB_TOKEN

async function run(): Promise<void> {
  if (ghToken === undefined) {
    core.setFailed(`GITHUB_TOKEN not provided`)
    return
  }

  try {
    switch (github.context.eventName) {
      case 'issues':
        await issuesHandler()
        break
      default:
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
