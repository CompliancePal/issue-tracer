import {Options as ToMarkdownOptions} from 'mdast-util-to-markdown/types'
import {Node} from 'unist'

interface Options {
  comment: string
}

/**
 * Further customisation options on plugin homepage
 * https://github.com/syntax-tree/mdast-util-to-markdown
 */
export function styleMarkdownOutput(options: Options): void {
  //@ts-ignore
  const data = this.data() as {
    toMarkdownExtensions: ToMarkdownOptions[]
  }

  data.toMarkdownExtensions.push({
    bullet: '-',
    listItemIndent: 'one',
    join: [
      //@ts-ignore
      (first: Node, second: Node) => {
        if (
          first.type === 'heading' &&
          second.type === 'html' &&
          second.value === options.comment
        ) {
          return 0
        }

        return true
      }
    ]
  })
}
