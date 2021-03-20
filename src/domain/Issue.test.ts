import {IssuesOpenedEvent} from '@octokit/webhooks-definitions/schema'
import {defineFeature, loadFeature} from 'jest-cucumber'
import openEventPayload from '../payloads/event-opened.json'
import {IPartOf, Issue, Subtask} from './Issue'
import {scenarioNameTemplate} from '../utils/test'

const instance = loadFeature('./features/Issue.instance.feature', {
  scenarioNameTemplate
})

defineFeature(instance, test => {
  let event: IssuesOpenedEvent
  let issue: Issue

  test('Subtasks in the placeholder', ({given, when, then}) => {
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

  test('Subtasks outside the placeholder', ({given, when, then}) => {
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

  test('Subtasks in body without placeholder', ({given, when, then}) => {
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

  test('Changes preserves content outside placeholder', ({
    given,
    and,
    when,
    then
  }) => {
    let subtask: Subtask

    given('event body', docString => {
      event = {
        ...openEventPayload
      } as IssuesOpenedEvent
      event.issue.body = docString
    })

    and('new subtask', docString => {
      subtask = JSON.parse(docString) as Subtask
    })

    when('subtask added', () => {
      issue = Issue.fromEventPayload(event)
      issue.addSubtask(subtask)
    })

    then('content outside placeholder is not affected', docString => {
      expect(issue.body).toEqual(docString)
    })
  })

  test('Changes added when the placeholder is at the end of document', ({
    given,
    and,
    when,
    then
  }) => {
    let subtask: Subtask

    given('body', docString => {
      event = {
        ...openEventPayload
      } as IssuesOpenedEvent
      event.issue.body = docString
    })

    and('subtask', docString => {
      subtask = JSON.parse(docString) as Subtask
    })

    when('added', () => {
      issue = Issue.fromEventPayload(event)
      issue.addSubtask(subtask)
    })

    then('body updated', docString => {
      expect(issue.body).toEqual(docString)
    })
  })

  test('Changes not added on issue without placeholder', ({
    given,
    and,
    when,
    then
  }) => {
    let subtask: Subtask

    given('Issue body without placeholder', docString => {
      event = {
        ...openEventPayload
      } as IssuesOpenedEvent
      event.issue.body = docString
    })

    and('new subtask', docString => {
      subtask = JSON.parse(docString) as Subtask
    })

    when('subtask added', () => {
      issue = Issue.fromEventPayload(event)
      issue.addSubtask(subtask)
    })

    then('body not updated', docString => {
      expect(issue.body).toEqual(docString)
    })
  })

  test('partOf with local reference', ({given, when, then}) => {
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

  test('partOf with remote reference', ({given, when, then}) => {
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

const classMethods = loadFeature('./features/Issue.class.feature', {
  scenarioNameTemplate
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
