import {IssuesOpenedEvent} from '@octokit/webhooks-definitions/schema'
import {IPartOf, Issue} from './Issue'
import openEventPayload from '../payloads/opened.json'

describe('Issue', () => {
  describe('instance', () => {
    it('finds partsOf with local reference', () => {
      const event = {...openEventPayload} as IssuesOpenedEvent
      event.issue.body = `# Title\n\n---\nsome: else\npartOf: #123\nkey: value\n---\n`

      const issue = Issue.fromEventPayload(event)

      expect(issue.partOf).toBeTruthy()
      expect(issue.hasParent()).toBeTruthy()
    })

    it('finds partsOf with remote reference', () => {
      const event = {...openEventPayload} as IssuesOpenedEvent
      event.issue.body = `# Title\n\n---\nsome: else\npartOf: u/r#123\nkey: value\n---\n`

      const issue = Issue.fromEventPayload(event)

      expect(issue.partOf).toBeTruthy()
      expect(issue.hasParent()).toBeTruthy()
    })
  })

  describe('[static] parsePartOf', () => {
    it('finds local reference', () => {
      expect(Issue.parsePartOf('#123')).toEqual({
        issue_number: '123'
      } as IPartOf)
    })

    it('finds remote reference', () => {
      expect(Issue.parsePartOf('u-x/r#123')).toEqual({
        owner: 'u-x',
        repo: 'r',
        issue_number: '123'
      } as IPartOf)
    })

    it('does not find invalid ', () => {
      expect(Issue.parsePartOf('abc#123')).toEqual(undefined)
    })
  })
})
