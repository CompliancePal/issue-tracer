import {IssuesOpenedEvent} from '@octokit/webhooks-definitions/schema'
import {defineFeature, loadFeature} from 'jest-cucumber'
import openEventPayload from '../payloads/opened.json'
import {IPartOf, Issue} from './Issue'

const feature = loadFeature('./src/domain/Issue.feature', {
  scenarioNameTemplate: ({scenarioTitle, scenarioTags}) =>
    `${scenarioTitle} (${scenarioTags
      .filter(tag => tag.startsWith('@issue'))
      .join('')})`
})

defineFeature(feature, test => {
  let event: IssuesOpenedEvent
  let issue: Issue

  test('Detects subtasks in the placeholder', ({given, when, then}) => {
    given('Issue body', docString => {
      event = {
        ...openEventPayload
      } as IssuesOpenedEvent

      event.issue.body = docString
    })

    when('Event triggered', () => {
      issue = Issue.fromEventPayload(event)
    })

    then('Issue detects the subtasks', () => {
      expect(issue.subtasks).toEqual(
        new Map([
          [
            '#1',
            {
              closed: true,
              id: '1',
              removed: false,
              title: 'Closed title',
              owner: 'CompliancePal',
              repo: 'issue-tracer'
            }
          ],
          [
            '#2',
            {
              closed: false,
              id: '2',
              removed: false,
              title: 'Open title',
              owner: 'CompliancePal',
              repo: 'issue-tracer'
            }
          ]
        ])
      )
    })
  })

  test('Detects partOf with local reference', ({given, when, then}) => {
    given('Issue body', docString => {
      event = {...openEventPayload} as IssuesOpenedEvent
      event.issue.body = docString
    })

    when('event triggered', () => {
      issue = Issue.fromEventPayload(event)
    })

    then('issue identifies the reference', () => {
      expect(issue.partOf).toEqual({
        owner: 'CompliancePal',
        repo: 'issue-tracer',
        issue_number: 123
      } as IPartOf)
      expect(issue.hasParent()).toBeTruthy()
    })
  })

  test('Detects partOf with remote reference', ({given, when, then}) => {
    given('Issue body', docString => {
      event = {...openEventPayload} as IssuesOpenedEvent
      event.issue.body = docString
    })

    when('event triggered', () => {
      issue = Issue.fromEventPayload(event)
    })

    then('issue identifies the reference', () => {
      expect(issue.partOf).toBeTruthy()
      expect(issue.hasParent()).toBeTruthy()
    })
  })
})
