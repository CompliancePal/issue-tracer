import {ValueObject} from './core/ValueObject'

export interface SubtaskProps {
  [k: string]: unknown
  id: string
  title: string
  closed: boolean
  removed: boolean
  repo: string
  owner: string
  crossReference: boolean
}

export class Subtask extends ValueObject<SubtaskProps> {
  static create(props: SubtaskProps): Subtask {
    return new Subtask({...props})
  }

  private constructor(props: SubtaskProps) {
    super(props)
  }

  get repo(): string {
    return this.props.repo
  }

  get owner(): string {
    return this.props.owner
  }

  get closed(): boolean {
    return this.props.closed
  }

  get id(): string {
    return this.props.id
  }

  get title(): string {
    return this.props.title
  }

  toString(): string {
    const reference = this.props.crossReference
      ? `${this.props.owner}/${this.props.repo}`
      : ''
    return `${reference}#${this.props.id}`
  }

  equals(subtask: SubtaskProps): boolean {
    return Object.keys(subtask).every(key => this.props[key] === subtask[key])
  }
}
