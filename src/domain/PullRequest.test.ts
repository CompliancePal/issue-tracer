import {defineFeature, loadFeature, parseFeature} from 'jest-cucumber'
import {PullRequestEvent} from '@octokit/webhooks-definitions/schema'
import mock from 'mock-fs'
import {PullRequest} from './PullRequest'
import {scenarioNameTemplate} from '../utils/test'

import pullRequestEvent from '../payloads/pr.json'

const features = loadFeature('features/PullRequest.feature', {
  scenarioNameTemplate
})

const getPREvent = (body: string): PullRequestEvent => {
  const pr = {...(pullRequestEvent as PullRequestEvent)}
  pr.pull_request.body = body

  return pr
}

defineFeature(features, test => {
  let event: PullRequestEvent
  let pullRequest: PullRequest
  let featureString: string

  afterEach(() => {
    mock.restore()
  })

  test.only('Finds requirements to be resolved', ({given, when, then, and}) => {
    given('PR body', docString => {
      event = getPREvent(docString)
    })

    and('features', docString => {
      featureString = docString

      mock({
        features: {
          'fake.feature': featureString
        }
      })
    })

    when('Creating the instance', async () => {
      pullRequest = await PullRequest.fromEventPayload(event)
    })

    then('finds the requirement', docString => {
      expect(pullRequest.resolvesRequirement).toEqual(parseInt(docString))
    })

    and('issue features', async () => {
      const feature = parseFeature(featureString)
      const testCases = pullRequest.testCases

      expect(testCases).toHaveLength(1)
      expect(testCases[0].feature).toEqual(feature.title)
      expect(testCases[0].title).toEqual(feature.scenarios[0].title)
      expect(testCases[0].filename).toEqual('features/fake.feature')
      expect(testCases[0].lineNumber).toEqual(feature.scenarios[0].lineNumber)
    })
  })
})
