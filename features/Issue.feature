Feature: Issue instance

        @issue-7
        @issue-25
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
        @issue-15
        @issue-27
        Scenario: Changes preserves content outside placeholder
            Given event body
                  """
                  ---
                  partOf: #1

                  ---

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
                    "state": "open",
                    "removed": false,
                    "repo": "issue-tracer",
                    "owner": "CompliancePal"
                  }
                  """
             When subtask added
             Then content outside placeholder is not affected
                  """
                  ---
                  partOf: #1

                  ---

                  ## Before

                  ## Traceability <!-- traceability -->
                  <!-- Section created by CompliancePal. Do not edit -->

                  ### Related issues

                  - [x] Closed title (#1)
                  - [ ] Open title (#2)
                  - [ ] Added (#3)

                  ## After
                  """

        @issue-23
        @issue-27
        Scenario: Added duplicate cross reference subtask
            Given event body
                  """
                  ## Traceability <!-- traceability -->
                  <!-- Section created by CompliancePal. Do not edit -->

                  ### Related issues

                  - [x] Closed title (CompliancePal/cross-ref#1)
                  - [ ] Open title (#2)
                  """
              And existing cross reference subtask
                  """
                  {
                    "id": "1",
                    "title": "Closed title",
                    "state": "closed",
                    "removed": false,
                    "repo": "cross-ref",
                    "owner": "CompliancePal"
                  }
                  """
             When subtask added
             Then issue body unchanged
                  """
                  ## Traceability <!-- traceability -->
                  <!-- Section created by CompliancePal. Do not edit -->

                  ### Related issues

                  - [x] Closed title (CompliancePal/cross-ref#1)
                  - [ ] Open title (#2)
                  """

        @issue-11
        @issue-27
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
                    "state": "open",
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
        @issue-27
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
                    "state": "open",
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

