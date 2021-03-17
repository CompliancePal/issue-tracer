Feature: Issue instance

        Scenario: Instance detects subtasks in the placeholder
            Given Issue body
            """
            ## Traceability <!-- traceability -->

            ### Related issues

            <!-- Section created by CompliancePal. Do not edit -->

            - [x] Closed title (#1)
            - [ ] Open title (#2)
            """
             When Event triggered
             Then Issue detects the subtasks

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

