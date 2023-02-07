import {ScenarioNameTemplateVars} from 'jest-cucumber/dist/src/models'

export const scenarioNameTemplate = ({
  scenarioTitle,
  scenarioTags
}: ScenarioNameTemplateVars): string => {
  const issues = scenarioTags
    .filter(tag => tag.startsWith('@issue'))
    .map(tag => tag.replace('@issue-', '#'))

  const brackets = issues.length > 0 ? ` (${issues.join(', ')})` : ''

  return `${scenarioTitle}${brackets}`
}
