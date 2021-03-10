export class Entity<T> {
  protected props: T

  constructor(props: T) {
    this.props = props
  }
}
