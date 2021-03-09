import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const payload = JSON.stringify(github.context.payload)
    core.debug(`The event payload: ${payload}`)

    core.setOutput('payload', payload)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
