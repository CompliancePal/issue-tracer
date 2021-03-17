import {IPartOf, Issue} from './Issue'

describe('Issue', () => {
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
