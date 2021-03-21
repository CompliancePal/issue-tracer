Feature: TestCaseExporter

        Scenario: details
            Given test case
            """
Feature: TestCaseExporter

        Scenario: details
            Given test case
             When exported
             Then result
            """
             When exported
             Then result
             """
<details>
<summary>:cucumber: TestCaseExporter - details</summary>


```gherkin
Feature: TestCaseExporter


  Scenario: details
     Given test case
      When exported
      Then result
```


</details>
             """
