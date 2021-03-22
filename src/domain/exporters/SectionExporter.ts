import {PullRequest, TestCase} from '../PullRequest'

export class SectionExporter {
  static COMMENT = '<!-- Section created by CompliancePal. Do not edit -->'

  depth: number

  constructor(depth: number) {
    this.depth = depth
  }

  protected headingString(increment: number): string {
    return '#'.repeat(this.depth + increment)
  }

  heading(): string {
    return `${this.headingString(0)} Traceability <!-- traceability -->\n${
      SectionExporter.COMMENT
    }\n`
  }

  resolvedBy(pullRequest?: PullRequest): string | null {
    return pullRequest
      ? `${this.headingString(1)} Resolved by\n\nChange request #${
          pullRequest.number
        } will close this issue.`
      : null
  }

  testCases({testCases}: PullRequest): string | null {
    const details = testCases
      .map((testCase: TestCase) => {
        return this.testCaseDetails(testCase)
      })
      .join('\n')

    return testCases.length > 0
      ? `${this.headingString(1)} Test cases\n\n${details}\n`
      : null
  }

  testCaseDetails(testCase: TestCase): string {
    return `<details>
<summary>:cucumber: ${testCase.feature} - ${testCase.title}</summary>
\n
\`\`\`gherkin
Feature: ${testCase.feature}
\n
  Scenario: ${testCase.title}
${testCase.steps
  .map(step => {
    // process.stdout.write(JSON.stringify(step))
    return `${this.leftPad(this.capitalize(step.keyword), 11)} ${step.stepText}`
  })
  .join('\n')}
\`\`\`
\n
</details>
`
  }

  protected leftPad(text: string, length: number): string {
    return text.padStart(length)
  }

  protected capitalize(input: string): string {
    return input[0].toUpperCase() + input.substring(1)
  }
}
