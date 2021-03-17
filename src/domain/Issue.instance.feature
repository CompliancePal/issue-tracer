Feature: Issue instance

        @issue-7
        Scenario: Instance detects subtasks in the placeholder
            Given event body
            """
            ## Traceability <!-- traceability -->

            ### Related issues
            <!-- Section created by CompliancePal. Do not edit -->

            - [x] Closed title (#1)
            - [ ] Open title (#2)
            """
             When event is triggered
             Then instance detects the subtasks

        @issue-7
        Scenario: Instance ignores subtasks outside the placeholder
            Given event body
            """
            ## Traceability <!-- traceability -->

            ## Related issues

            - [x] Closed title (#1)
            - [ ] Open title (#2)
            """
             When event is triggered
             Then instance detects the subtasks

        @issue-7
        Scenario: Instance ignores subtasks in body without placeholder
            Given Issue body without placeholder
            """
            ## Traceability

            ### Related issues
            <!-- Section created by CompliancePal. Do not edit -->

            - [x] Closed title (#1)
            - [ ] Open title (#2)
            """
             When Event triggered
             Then Issue ignores

        Scenario: Instance detects partOf with local reference
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

        Scenario: Instance detects partOf with remote reference
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

