import {Parent} from 'unist'
import {decodeDict} from '../utils/structured-field-values'

export class Section {
  protected props: {
    flag: string
    depth?: number
    start?: number
    end?: number
  }

  constructor(flag: string) {
    this.props = {
      flag
    }
  }

  get start(): number | undefined {
    return this.props.start
  }

  get end(): number | undefined {
    return this.props.end
  }

  enter(start: number, depth: number): void {
    this.props.start = start
    this.props.depth = depth
  }

  leave(end: number): void {
    this.props.end = end
  }

  isEndMarker(depth: number): boolean {
    if (this.props.depth === undefined) return false

    return depth <= this.props.depth
  }

  isInside(): boolean {
    return this.props.start !== undefined && this.props.end === undefined
  }

  isStartMarker(node: Parent): boolean {
    if (node.type === 'heading') {
      if (node.children.length === 2) {
        if (node.children[1].type === 'html') {
          const value = node.children[1].value as string

          const m = value.match(/^<!-- (?<meta>.*) -->$/)

          if (m !== null && m.groups) {
            const {
              [this.props.flag]: {value: traceability} = {
                value: false
              }
            } = decodeDict(m.groups.meta)

            if (traceability) {
              return true
            }
          }
        }
      }
    }

    return false
  }
}
