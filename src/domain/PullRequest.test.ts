import {defineFeature, loadFeature} from 'jest-cucumber'
import {PullRequest} from './PullRequest'

import {PullRequest as GitHubPullRequest} from '@octokit/webhooks-definitions/schema'

const features = loadFeature('features/PullRequest.feature')

defineFeature(features, test => {
  test.only('Finds feature files in repository', ({given, when, then}) => {
    given('feature files', () => {})

    when('opening pull_request', async () => {
      const pr = new PullRequest({} as GitHubPullRequest, 'owner', 'repo')

      await pr.findFeatures()
    })

    then('files available', () => {})
  })
})
