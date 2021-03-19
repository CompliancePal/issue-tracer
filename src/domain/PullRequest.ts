import * as core from '@actions/core'
import * as glob from '@actions/glob'
import {PullRequest as GitHubPullRequest} from '@octokit/webhooks-definitions/schema'
import {loadFeature} from 'jest-cucumber'
import {Entity} from './Entity'

export class PullRequest extends Entity<GitHubPullRequest> {
  owner: string
  repo: string

  constructor(pr: GitHubPullRequest, owner: string, repo: string) {
    super(pr)
    this.owner = owner
    this.repo = repo
  }

  async findFeatures(): Promise<void> {
    const globber = await glob.create(['!.git', '**/*.feature'].join('\n'))

    for await (const file of globber.globGenerator()) {
      const feature = loadFeature(file)
      core.info(feature.title)
      core.info(file)
    }
  }
}
