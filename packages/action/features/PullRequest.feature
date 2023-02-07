Feature: PullRequest

        @issue-13
        Scenario: Finds requirements to be resolved
            Given PR body
                  """
                  Resolves #1.

                  The rest of the pull request...
                  """
              And features
                  """
Feature: Fake feature

        @issue-1
        @tag
        Scenario: Issue scenario
            Given initial state
             When stimulus triggered
             Then end state

        @issue-100
        Scenario: Existing scenario
            Given initial state
             When stimulus triggered
             Then end state
                  """
             When Creating the instance
             Then finds the requirement
                  """
                  1
                  """
              And issue features

