import * as core from '@actions/core'
import * as github from '@actions/github'
import {issuesHandler} from './actions/issues'
import {pullRequestHandler} from './actions/pull_request'

const ghToken = process.env.GITHUB_TOKEN

async function run(): Promise<void> {
  if (ghToken === undefined) {
    core.setFailed(`GITHUB_TOKEN not provided`)
    return
  }

  try {
    switch (github.context.eventName) {
      case 'issues':
        await issuesHandler(ghToken)
        break
      case 'pull_request':
        await pullRequestHandler(ghToken)
        break
      default:
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
