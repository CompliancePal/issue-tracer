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
    rule: '-',
    join: [
      //@ts-ignore
      (first: Node, second: Node) => {
        // do not add space between the heading and the comment
        if (
          first.type === 'heading' &&
          second.type === 'html' &&
          second.value === options.comment
        ) {
          return 0
        }

        // do not add space in frontmatter
        if (first.type === 'thematicBreak' && second.type === 'paragraph') {
          return 0
        }

        return true
      }
    ]
  })
}
