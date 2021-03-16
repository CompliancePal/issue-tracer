import {IssuesOpenedEvent} from '@octokit/webhooks-definitions/schema'
import {IPartOf, Issue} from './Issue'
import openEventPayload from '../payloads/opened.json'

describe('Issue', () => {
  describe('instance', () => {
    it('finds partsOf with local reference', () => {
      const event = {...openEventPayload} as IssuesOpenedEvent
      event.issue.body = `# Title\n\n---\nsome: else\npartOf: #123\nkey: value\n---\n`

      const issue = Issue.fromEventPayload(event)

      expect(issue.partOf).toEqual({
        owner: 'CompliancePal',
        repo: 'issue-tracer',
        issue_number: 123
      } as IPartOf)
      expect(issue.hasParent()).toBeTruthy()
    })

    it('finds partsOf with remote reference', () => {
      const event = {...openEventPayload} as IssuesOpenedEvent
      event.issue.body = `# Title\n\n---\nsome: else\npartOf: u/r#123\nkey: value\n---\n`

      const issue = Issue.fromEventPayload(event)

      expect(issue.partOf).toBeTruthy()
      expect(issue.hasParent()).toBeTruthy()
    })

    it('finds subtasks', () => {
      const event = {
        ...openEventPayload,
        ...{
          issue: {
            body:
              '---\npartOf: #5\n\n---\n## Traceability\n\n### Related issues\n<!-- Section created by CompliancePal. Do not edit -->\n\n- [x] Closed title (#1)\n\n- [ ] Open title (#2)'
          }
        }
      } as IssuesOpenedEvent

      const issue = Issue.fromEventPayload(event)

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

  describe('[static] parsePartOf', () => {
    it('finds local reference', () => {
      expect(Issue.parsePartOf('#123', 'owner', 'repo')).toEqual({
        owner: 'owner',
        repo: 'repo',
        issue_number: 123
      } as IPartOf)
    })

    it('finds remote reference', () => {
      expect(Issue.parsePartOf('u-x/r#123', 'o', 'r')).toEqual({
        owner: 'u-x',
        repo: 'r',
        issue_number: 123
      } as IPartOf)
    })

    it('does not find invalid ', () => {
      expect(Issue.parsePartOf('abc#123', 'owner', 'repo')).toEqual(undefined)
    })
  })
})
