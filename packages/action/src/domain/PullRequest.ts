import {relative} from 'path'
import * as core from '@actions/core'
import * as glob from '@actions/glob'
import {
  PullRequest as GitHubPullRequest,
  PullRequestEvent
} from '@octokit/webhooks-definitions/schema'
import {loadFeature} from 'jest-cucumber'
import unified from 'unified'
import markdown from 'remark-parse'
import gfm from 'remark-gfm'
import {Parent, Literal} from 'unist'
import visit from 'unist-util-visit'
import {Entity} from './Entity'
import {ParsedStep} from 'jest-cucumber/dist/src/models'

export interface TestCase {
  filename: string
  feature: string
  steps: ParsedStep[]
  title: string
  lineNumber: number
}

const findFeatures = async (issue_number: number): Promise<TestCase[]> => {
  core.info(`Running in ${process.cwd()}`)

  const result: TestCase[] = []
  const globber = await glob.create(
    [`**/*.feature`, `!.git`, `!.private-action`].join('\n')
  )

  for (const path of globber.getSearchPaths()) {
    core.debug(`Looking for feature files in ${path}`)
  }

  for await (const file of globber.globGenerator()) {
    core.info(`Processing feature file: ${file}`)
    const feature = loadFeature(file)

    for (const scenario of feature.scenarios) {
      if (scenario.tags.includes(`@issue-${issue_number}`)) {
        result.push({
          filename: relative(process.cwd(), file),
          feature: feature.title,
          title: scenario.title,
          steps: scenario.steps,
          lineNumber: scenario.lineNumber
        })
      }
    }
  }

  return result
}

export class PullRequest extends Entity<GitHubPullRequest> {
  readonly owner: string
  readonly repo: string
  readonly resolvesRequirement?: number
  testCases: TestCase[]

  static async fromEventPayload(event: PullRequestEvent): Promise<PullRequest> {
    //TODO: move the feature globbing into a repository

    const pullRequest = new PullRequest(
      event.pull_request,
      event.repository.owner.login,
      event.repository.name
    )

    if (pullRequest.resolvesRequirement) {
      pullRequest.testCases = await findFeatures(
        pullRequest.resolvesRequirement
      )
    }

    return pullRequest
  }

  protected constructor(pr: GitHubPullRequest, owner: string, repo: string) {
    super(pr)
    this.owner = owner
    this.repo = repo

    this.resolvesRequirement = this.detectRequirement()
    this.testCases = []
  }

  get number(): number {
    return this.props.number
  }

  // get testCases(): Promise<TestCase[]> {
  //   return (async () => {
  //     try {
  //       return await this.findFeatures()
  //     } catch (error) {
  //       return []
  //     }
  //   })()
  // }

  protected detectRequirement(): number | undefined {
    let issue_number: number | undefined

    const tree = unified()
      .use(markdown)
      .use(gfm)
      .parse(this.props.body) as Parent

    const paragraph = tree.children[0] as Parent

    if (paragraph !== undefined && paragraph.type === 'paragraph') {
      visit(paragraph, 'text', (node: Literal) => {
        const m = (node.value as string).match(/Resolves #(?<issue>[0-9]*)/)

        if (m && m.groups) {
          issue_number = parseInt(m.groups.issue)
        }
      })
    }

    return issue_number
  }
}
