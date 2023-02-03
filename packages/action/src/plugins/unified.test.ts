import {defineFeature, loadFeature} from 'jest-cucumber'
import unified from 'unified'
import markdown from 'remark-parse'
import gfm from 'remark-gfm'
import stringify from 'remark-stringify'
import frontmatter from 'remark-frontmatter'
import {styleMarkdownOutput} from './unified'
import {scenarioNameTemplate} from '../utils/test'
import {SectionExporter} from '../repo/exporters/SectionExporter'

const features = loadFeature('features/unified.feature', {
  scenarioNameTemplate
})

defineFeature(features, test => {
  const processor = unified()
    .use(markdown)
    .use(gfm)
    .use(frontmatter)
    .use(stringify)
    .use(styleMarkdownOutput, {
      comment: SectionExporter.COMMENT
    })
  let input: string
  let result: string

  test('Frontmatter is preserved', ({given, when, then}) => {
    given('issue body with frontmatter', docString => {
      input = docString
    })

    when('recreating the body', () => {
      result = processor.processSync(input).contents as string
    })

    then('style is maintained', docString => {
      expect(result).toEqual(docString)
    })
  })
})
