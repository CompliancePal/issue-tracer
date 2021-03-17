import {IssuesOpenedEvent} from '@octokit/webhooks-definitions/schema'
import {defineFeature, loadFeature} from 'jest-cucumber'
import openEventPayload from '../payloads/opened.json'
import {IPartOf, Issue} from './Issue'

const instance = loadFeature('./src/domain/Issue.instance.feature', {
  scenarioNameTemplate: ({scenarioTitle, scenarioTags}) => {
    const issues = scenarioTags
      .filter(tag => tag.startsWith('@issue'))
      .map(tag => tag.replace('@issue-', '#'))

    const brackets = issues.length > 0 ? ` (${issues.join(', ')})` : ''

    return `${scenarioTitle}${brackets}`
  }
})

defineFeature(instance, test => {
  let event: IssuesOpenedEvent
  let issue: Issue

  test('Instance detects subtasks in the placeholder', ({
    given,
    when,
    then
  }) => {
    given('event body', docString => {
      event = {
        ...openEventPayload
      } as IssuesOpenedEvent

      event.issue.body = docString
    })

    when('event is triggered', () => {
      issue = Issue.fromEventPayload(event)
    })

    then('instance detects the subtasks', () => {
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

  test('Instance ignores subtasks outside the placeholder', ({
    given,
    when,
    then
  }) => {
    given('event body', docString => {
      event = {
        ...openEventPayload
      } as IssuesOpenedEvent
      event.issue.body = docString
    })

    when('event is triggered', () => {
      issue = Issue.fromEventPayload(event)
    })

    then('instance detects the subtasks', () => {
      expect(issue.subtasks.size).toEqual(0)
    })
  })

  test('Instance ignores subtasks in body without placeholder', ({
    given,
    when,
    then
  }) => {
    given('Issue body without placeholder', docString => {
      event = {
        ...openEventPayload
      } as IssuesOpenedEvent
      event.issue.body = docString
    })

    when('Event triggered', () => {
      issue = Issue.fromEventPayload(event)
    })

    then('Issue ignores', () => {
      expect(issue.subtasks.size).toEqual(0)
    })
  })

  test('Instance detects partOf with local reference', ({
    given,
    when,
    then
  }) => {
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

  test('Instance detects partOf with remote reference', ({
    given,
    when,
    then
  }) => {
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

const classMethods = loadFeature('./src/domain/Issue.class.feature', {
  // scenarioNameTemplate: ({scenarioTitle, scenarioTags}) =>
  //   `${scenarioTitle} (${scenarioTags
  //     .filter(tag => {
  //       console.log(tag)
  //       return tag.startsWith('@issue')
  //     })
  //     .join('')})`
})

defineFeature(classMethods, test => {
  test('parsePartOf with local reference', ({given, and, when, then}) => {
    let reference: string
    let owner: string
    let repo: string
    let result: IPartOf | undefined

    given('reference', (docString: string) => {
      reference = docString
    })

    and('owner', (docString: string) => {
      owner = docString
    })

    and('repo', docString => {
      repo = docString
    })

    when('parsing', () => {
      result = Issue.parsePartOf(reference, owner, repo)
    })

    then('match', docString => {
      expect(result).toEqual(JSON.parse(docString))
    })
  })

  test('parsePartOf with remote reference', ({given, and, when, then}) => {
    let reference: string
    let owner: string
    let repo: string
    let result: IPartOf | undefined

    given('reference', (docString: string) => {
      reference = docString
    })

    and('owner', (docString: string) => {
      owner = docString
    })

    and('repo', docString => {
      repo = docString
    })

    when('parsing', () => {
      result = Issue.parsePartOf(reference, owner, repo)
    })

    then('match', docString => {
      expect(result).toEqual(JSON.parse(docString))
    })
  })

  test('parsePartOf does not find invalid', ({given, and, when, then}) => {
    let reference: string
    let owner: string
    let repo: string
    let result: IPartOf | undefined

    given('reference', (docString: string) => {
      reference = docString
    })

    and('owner', (docString: string) => {
      owner = docString
    })

    and('repo', docString => {
      repo = docString
    })

    when('parsing', () => {
      result = Issue.parsePartOf(reference, owner, repo)
    })

    then('match', () => {
      expect(result).toEqual(undefined)
    })
  })
})
