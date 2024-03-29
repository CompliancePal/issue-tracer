interface ValueObjectProps {
  [k: string]: unknown
}

export abstract class ValueObject<T extends ValueObjectProps> {
  readonly props: T

  constructor(props: T) {
    this.props = Object.freeze(props)
  }
}
