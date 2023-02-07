import {defineFeature, loadFeature} from 'jest-cucumber'
import {Reference} from '../domain/Issue'
import {scenarioNameTemplate} from '../utils/test'
import {BodyIssueRels} from './BodyIssueRels'

const classMethods = loadFeature('./features/BodyIssueRels.feature', {
  scenarioNameTemplate
})

defineFeature(classMethods, test => {
  test('parsePartOf with local reference', ({given, and, when, then}) => {
    let reference: string
    let owner: string
    let repo: string
    let result: Reference | undefined

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
      result = BodyIssueRels.parsePartOf(reference, owner, repo)
    })

    then('match', docString => {
      expect(result).toEqual(JSON.parse(docString))
    })
  })

  test('parsePartOf with remote reference', ({given, and, when, then}) => {
    let reference: string
    let owner: string
    let repo: string
    let result: Reference | undefined

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
      result = BodyIssueRels.parsePartOf(reference, owner, repo)
    })

    then('match', docString => {
      expect(result).toEqual(JSON.parse(docString))
    })
  })

  test('parsePartOf does not find invalid', ({given, and, when, then}) => {
    let reference: string
    let owner: string
    let repo: string
    let result: Reference | undefined

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
      result = BodyIssueRels.parsePartOf(reference, owner, repo)
    })

    then('match', () => {
      expect(result).toEqual(undefined)
    })
  })
})
