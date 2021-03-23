Feature: BodyIssueRels

        @issue-25
        Scenario: parsePartOf with local reference
            Given reference
              """
              #123
              """
              And owner
              """
              owner
              """
              And repo
              """
              repo
              """
             When parsing
             Then match
             """
             {
              "owner": "owner",
              "repo": "repo",
              "issue_number": 123
             }
             """

        @issue-25
        Scenario: parsePartOf with remote reference
            Given reference
              """
              u-x/r#123
              """
              And owner
              """
              o
              """
              And repo
              """
              r
              """
             When parsing
             Then match
             """
             {
              "owner": "u-x",
              "repo": "r",
              "issue_number": 123
             }
             """

        @issue-25
        Scenario: parsePartOf does not find invalid
            Given reference
              """
              abc#123
              """
              And owner
              """
              owner
              """
              And repo
              """
              repo
              """
             When parsing
             Then match
