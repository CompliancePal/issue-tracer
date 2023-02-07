import {useTheme} from 'nextra-theme-docs'
import React from 'react'

let currentId = 0
const uuid = () => `mermaid-${(currentId++).toString()}`

function Mermaid({graphDefinition}) {
  const [html, setHtml] = React.useState('')

  const theme = useTheme().resolvedTheme === 'dark' ? 'dark' : 'neutral'

  React.useEffect(() => {
    //@ts-ignore
    window.mermaid.initialize({
      theme
    })

    if (graphDefinition) {
      try {
        //@ts-ignore
        window.mermaid.mermaidAPI.render(
          uuid(),
          `%%{init: {'theme':'${theme}'}}%%
          ${graphDefinition}`,
          svgCode => setHtml(svgCode)
        )
      } catch (e) {
        setHtml('')
        console.error(e)
      }
    }
  }, [graphDefinition, theme])

  return graphDefinition ? (
    <div dangerouslySetInnerHTML={{__html: html}} />
  ) : null
}

export default Mermaid
