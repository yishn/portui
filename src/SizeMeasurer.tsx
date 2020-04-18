import {createElement, createRef, Component, RefObject, ReactNode} from 'react'

let measureCallbacks = new WeakMap<Element, () => void>()
let resizeObserver = new (window as any).ResizeObserver(
  (entries: {target: Element}[]) => {
    for (let {target} of entries) {
      measureCallbacks.get(target)?.()
    }
  }
)

export interface SizeMeasurerProps<T extends Element> {
  throttle?: number
  measureSize?: (el: T) => {width: number; height: number}
  render?: (props: {
    ref: RefObject<T>
    width?: number
    height?: number
  }) => ReactNode

  onMeasure?: (evt: {width: number; height: number}) => any
}

interface SizeMeasurerState {
  width?: number
  height?: number
}

export default class SizeMeasurer<T extends Element> extends Component<
  SizeMeasurerProps<T>,
  SizeMeasurerState
> {
  elementRef = createRef<T>()
  measureTimeoutId?: number

  constructor(props: SizeMeasurerProps<T>) {
    super(props)

    this.state = {}
  }

  componentDidMount() {
    if (this.elementRef.current == null) {
      throw new Error('elementRef is not assigned')
    }

    measureCallbacks.set(this.elementRef.current, this.measure)
    resizeObserver.observe(this.elementRef.current)

    this.measure()
  }

  componentWillUnmount() {
    measureCallbacks.delete(this.elementRef.current!)
    resizeObserver.unobserve(this.elementRef.current)
  }

  measure = () => {
    clearTimeout(this.measureTimeoutId)

    this.measureTimeoutId = setTimeout(() => {
      let el = this.elementRef.current
      if (el == null) return

      let {width, height} = this.props.measureSize?.(el) ?? {
        width: el.clientWidth,
        height: el.clientHeight,
      }

      this.setState({width, height})
      this.props.onMeasure?.({width, height})
    }, this.props.throttle ?? 0)
  }

  render() {
    return (
      this.props.render?.({
        ref: this.elementRef,
        width: this.state.width,
        height: this.state.height,
      }) ?? null
    )
  }
}
