Feature: PullRequest

        @issue-13
        Scenario: Finds feature files in repository
            Given feature files
             When opening pull_request
             Then files available
