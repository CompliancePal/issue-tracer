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

