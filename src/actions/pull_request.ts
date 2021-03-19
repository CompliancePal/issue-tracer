import * as core from '@actions/core'
import * as github from '@actions/github'

export const pullRequestHandler = async (): Promise<void> => {
  const ghToken = process.env.GITHUB_TOKEN

  if (ghToken === undefined) {
    core.setFailed(`GITHUB_TOKEN not provided`)
    return
  }

  switch (github.context.payload.action) {
    case 'opened':
      break
    default:
  }

  core.info(JSON.stringify(github.context.payload))
}
