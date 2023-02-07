Feature: Style output

        @issue-15
        Scenario: Frontmatter is preserved
            Given issue body with frontmatter
                  """
                  ---
                  partOf: #123

                  ---

                  ## Some heading

                  """
             When recreating the body
             Then style is maintained
                  """
                  ---
                  partOf: #123

                  ---

                  ## Some heading

                  """
