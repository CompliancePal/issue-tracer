Feature: Issue instance

        @issue-7
        Scenario: Subtasks in the placeholder
            Given event body
                  """
                  ## Traceability <!-- traceability -->
                  <!-- Section created by CompliancePal. Do not edit -->

                  ### Related issues

                  - [x] Closed title (#1)
                  - [ ] Open title (#2)
                  """
             When event is triggered
             Then instance detects the subtasks

        @issue-7
        Scenario: Subtasks outside the placeholder
            Given event body
                  """
                  ## Traceability <!-- traceability -->
                  <!-- Section created by CompliancePal. Do not edit -->

                  ## Related issues

                  - [x] Closed title (#1)
                  - [ ] Open title (#2)
                  """
             When event is triggered
             Then instance detects the subtasks

        @issue-7
        Scenario: Subtasks in body without placeholder
            Given Issue body without placeholder
                  """
                  ## Traceability

                  ### Related issues

                  - [x] Closed title (#1)
                  - [ ] Open title (#2)
                  """
             When Event triggered
             Then Issue ignores

        @issue-7
        Scenario: Changes preserves content outside placeholder
            Given event body
                  """
                  ## Before

                  ## Traceability <!-- traceability -->
                  <!-- Section created by CompliancePal. Do not edit -->

                  ### Related issues

                  - [x] Closed title (#1)
                  - [ ] Open title (#2)

                  ## After
                  """
              And new subtask
                  """
                  {
                    "id": "3",
                    "title": "Added",
                    "closed": false,
                    "removed": false,
                    "repo": "issue-tracer",
                    "owner": "CompliancePal"
                  }
                  """
             When subtask added
             Then content outside placeholder is not affected
                  """
                  ## Before

                  ## Traceability <!-- traceability -->
                  <!-- Section created by CompliancePal. Do not edit -->

                  ### Related issues

                  - [x] Closed title (#1)
                  - [ ] Open title (#2)
                  - [ ] Added (#3)

                  ## After
                  """

        @issue-11
        Scenario: Changes added when the placeholder is at the end of document
            Given body
                  """
                  ## Background

                  Write somethig about the issue...

                  ## Traceability <!-- traceability -->
                  """
              And subtask
                  """
                  {
                    "id": "3",
                    "title": "Added",
                    "closed": false,
                    "removed": false,
                    "repo": "issue-tracer",
                    "owner": "CompliancePal"
                  }
                  """
             When added
             Then body updated
                  """
                  ## Background

                  Write somethig about the issue...

                  ## Traceability <!-- traceability -->
                  <!-- Section created by CompliancePal. Do not edit -->

                  ### Related issues

                  - [ ] Added (#3)
                  """

        @issue-9
        Scenario: Changes not added on issue without placeholder
            Given Issue body without placeholder
                  """
                  ## Something
                  """
              And new subtask
                  """
                  {
                    "id": "3",
                    "title": "Added",
                    "closed": false,
                    "removed": false,
                    "repo": "issue-tracer",
                    "owner": "CompliancePal"
                  }
                  """
             When subtask added
             Then body not updated
                  """
                  ## Something
                  """

        Scenario: partOf with local reference
            Given Issue body
                  """
                  # Title

                  ---
                  some: else
                  partOf: #123
                  key: value
                  ---
                  """
             When event triggered
             Then issue identifies the reference

        Scenario: partOf with remote reference
            Given Issue body
                  """
                  # Title

                  ---
                  some: else
                  partOf: u/r#123
                  key: value
                  ---
                  """
             When event triggered
             Then issue identifies the reference

