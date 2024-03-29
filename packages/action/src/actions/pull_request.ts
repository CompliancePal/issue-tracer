import * as core from '@actions/core'
import * as github from '@actions/github'
import {PullRequestEvent} from '@octokit/webhooks-definitions/schema'
import {PullRequest} from '../domain/PullRequest'
import {IssuesRepo} from '../repo/Issues'

export const pullRequestHandler = async (ghToken: string): Promise<void> => {
  let issue, repo, pullRequest

  switch (github.context.payload.action) {
    case 'opened':
    case 'edited':
    case 'synchronize':
      pullRequest = await PullRequest.fromEventPayload(
        github.context.payload as PullRequestEvent
      )

      if (pullRequest.resolvesRequirement === undefined) {
        core.setFailed(`Action could not identify the resolved issue`)
        return
      }

      core.info(
        `Pull request contains ${pullRequest.testCases.length} test cases`
      )

      repo = new IssuesRepo(ghToken)

      issue = await repo.get({
        owner: pullRequest.owner,
        repo: pullRequest.repo,
        issue_number: pullRequest.resolvesRequirement
      })

      if (issue === undefined) {
        core.setFailed(
          `Action could not retrieve the issue resolved by the pull request ${pullRequest.resolvesRequirement}`
        )
        return
      }

      // github.getOctokit(ghToken).graphql({
      //   query: `query timeline($name: String!, $owner: String!, $number: Int!) {
      //     repository(name: $name, owner: $owner) {
      //       issue(number: $number) {
      //         id
      //         number
      //         timelineItems(first: 10) {
      //           nodes {
      //             ... on CrossReferencedEvent {
      //               id
      //               source {
      //                 ... on PullRequest {
      //                   id
      //                   number
      //                 }
      //               }
      //               willCloseTarget
      //             }
      //           }
      //         }
      //       }
      //     }
      //   }`,
      //   name: 'repo_name',
      //   owner: 'owner'
      // })

      issue.setResolvedBy(pullRequest)

      issue.save(repo)

      core.info(`Resolved issue ${issue.number} updated sucessfuly`)

      break
    default:
  }

  // core.info(JSON.stringify(github.context.payload))
}
