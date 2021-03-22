import {defineFeature, loadFeature, parseFeature} from 'jest-cucumber'
import {scenarioNameTemplate} from '../../utils/test'
import {TestCase} from '../PullRequest'
import {SectionExporter} from './SectionExporter'

const features = loadFeature('features/SectionExporter.feature', {
  scenarioNameTemplate
})

defineFeature(features, test => {
  test('details', ({given, when, then}) => {
    let testCase: TestCase
    let result: string

    given('test case', docString => {
      const feature = parseFeature(docString)

      testCase = {
        filename: 'filename',
        feature: feature.title,
        steps: feature.scenarios[0].steps,
        title: feature.scenarios[0].title,
        lineNumber: 1
      }
    })

    when('exported', () => {
      const exporter = new SectionExporter(2)

      result = exporter.testCaseDetails(testCase)
    })

    then('result', () => {
      expect(result).toBeTruthy()
    })
  })
})
