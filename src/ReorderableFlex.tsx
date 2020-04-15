import {
  createElement,
  createRef,
  Component,
  ComponentType,
  Key,
  WheelEvent,
  MouseEvent as ReactMouseEvent,
  UIEvent,
} from 'react'
import classnames from 'classnames'
import scrollIntoView from 'scroll-into-view-if-needed'
import {PortuiComponentProps} from './main'

export interface ItemData {
  itemKey: Key
}

export interface ItemProps extends ItemData {
  reordering: boolean

  onMouseDown: (itemKey: Key, evt: ReactMouseEvent) => void
}

export interface ReorderableFlexProps<T extends ItemData>
  extends PortuiComponentProps {
  vertical?: boolean
  allowReorder?: boolean
  allowWheelScroll?: boolean
  autoScrollAreaSize?: number
  autoScrollInterval?: number
  autoScrollStep?: number
  items?: Array<T>

  Item?: ComponentType<ItemProps & T>
  onScroll?: (evt: UIEvent) => any
  onReorder?: (evt: {items: Array<T>}) => any
}

interface ReorderableFlexState {
  beginOverflow: boolean
  endOverflow: boolean
  reorderingPermutation: number[] | null
  reorderingItemKey: Key | null
}

export default class ReorderableFlex<T extends ItemData> extends Component<
  ReorderableFlexProps<T>,
  ReorderableFlexState
> {
  elementRef = createRef<HTMLDivElement>()
  itemCenters: number[] | null = null

  autoScrollDirection: -1 | 1 = -1
  autoScrollIntervalId: number | undefined
  scrollThrottleTimeoutId: number | undefined

  constructor(props: ReorderableFlexProps<T>) {
    super(props)

    this.state = {
      beginOverflow: false,
      endOverflow: false,
      reorderingPermutation: null,
      reorderingItemKey: null,
    }
  }

  get scrollPosition(): number {
    return (
      (this.props.vertical
        ? this.elementRef.current?.scrollTop
        : this.elementRef.current?.scrollLeft) ?? 0
    )
  }

  componentDidMount() {
    document.addEventListener('mouseup', this.handleMouseUp)
    document.addEventListener('mousemove', this.handleMouseMove)

    this.handleScroll()
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.handleMouseUp)
    document.removeEventListener('mousemove', this.handleMouseMove)
  }

  componentDidUpdate(
    prevProps: ReorderableFlexProps<T>,
    prevState: ReorderableFlexState
  ) {
    if (
      this.itemCenters == null ||
      prevState.reorderingPermutation !== this.state.reorderingPermutation ||
      !prevProps.vertical !== !this.props.vertical
    ) {
      this.itemCenters = this.getItemElements().map(el =>
        this.props.vertical
          ? el.offsetTop + el.offsetHeight / 2
          : el.offsetLeft + el.offsetWidth / 2
      )
    }
  }

  getItemElements(): HTMLElement[] {
    if (this.elementRef.current == null) return []

    return [
      ...this.elementRef.current.querySelectorAll(
        '.portui-reorderable-flex > *'
      ),
    ] as HTMLElement[]
  }

  getItemElementByKey(itemKey: Key): HTMLElement | undefined {
    if (this.props.items == null || this.elementRef.current == null) return

    let index = this.props.items.findIndex(item => item.itemKey === itemKey)
    let itemElement = this.elementRef.current
      .querySelectorAll('.portui-reorderable-flex > *')
      .item(index) as HTMLElement

    return itemElement
  }

  scrollTo(scrollPosition: number, smooth: boolean = false) {
    if (this.elementRef.current == null) return

    this.elementRef.current.scrollTo({
      [this.props.vertical ? 'top' : 'left']: scrollPosition,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }

  scrollItemIntoView(itemKey: Key) {
    let itemElement = this.getItemElementByKey(itemKey)

    if (itemElement != null && this.elementRef.current != null) {
      scrollIntoView(itemElement, {
        scrollMode: 'if-needed',
        boundary: this.elementRef.current,
        behavior: actions => {
          for (let action of actions) {
            if (action.el !== this.elementRef.current) continue

            this.scrollTo(this.props.vertical ? action.top : action.left, true)
            break
          }
        },
      })
    }
  }

  startAutoscrolling(direction: -1 | 1) {
    if (
      this.autoScrollIntervalId != null &&
      this.autoScrollDirection === direction
    )
      return

    let {autoScrollStep = 50, autoScrollInterval = 200} = this.props

    clearInterval(this.autoScrollIntervalId)

    this.autoScrollDirection = direction
    this.autoScrollIntervalId = setInterval(() => {
      if (this.elementRef.current == null) return

      this.scrollTo(this.scrollPosition + direction * autoScrollStep, true)
    }, autoScrollInterval)
  }

  stopAutoscrolling() {
    if (this.autoScrollIntervalId != null) {
      clearInterval(this.autoScrollIntervalId)
      this.autoScrollIntervalId = undefined
    }
  }

  handleWheel = (evt: WheelEvent) => {
    if (!this.props.allowWheelScroll) return

    evt.preventDefault()

    this.scrollTo(this.scrollPosition + evt.deltaY)
  }

  handleScroll = (evt?: UIEvent) => {
    if (evt != null) {
      this.props.onScroll?.(evt)
    }

    clearTimeout(this.scrollThrottleTimeoutId)

    this.scrollThrottleTimeoutId = setTimeout(() => {
      let el = this.elementRef.current
      if (el == null) return

      let [scrollSize, clientSize] = [
        [el.scrollWidth, el.clientWidth],
        [el.scrollHeight, el.clientHeight],
      ][+!!this.props.vertical]

      this.setState({
        beginOverflow: this.scrollPosition > 0,
        endOverflow: Math.ceil(this.scrollPosition) < scrollSize - clientSize,
      })
    }, 200)
  }

  handleItemMouseDown = (itemKey: Key, evt: ReactMouseEvent) => {
    if (
      evt.button !== 0 ||
      !this.props.allowReorder ||
      this.state.reorderingItemKey != null
    )
      return

    evt.preventDefault()

    this.setState({
      reorderingItemKey: itemKey,
    })
  }

  handleMouseUp = (evt: MouseEvent) => {
    if (evt.button !== 0 || this.state.reorderingItemKey == null) return

    evt.preventDefault()

    if (this.state.reorderingPermutation != null) {
      this.props.onReorder?.({
        items: this.state.reorderingPermutation.map(
          i => (this.props.items ?? [])[i]
        ),
      })
    }

    this.stopAutoscrolling()
    this.setState({
      reorderingPermutation: null,
      reorderingItemKey: null,
    })
  }

  handleMouseMove = (evt: MouseEvent) => {
    if (
      this.elementRef.current == null ||
      this.state.reorderingItemKey == null ||
      this.itemCenters == null
    )
      return

    evt.preventDefault()

    let {items = [], autoScrollAreaSize = 50} = this.props
    let itemIndex = items.findIndex(
      item => item.itemKey === this.state.reorderingItemKey
    )
    if (itemIndex < 0) return

    let clientRect = this.elementRef.current.getBoundingClientRect()
    let [clientBegin, clientEnd] = [
      [clientRect.left, clientRect.right],
      [clientRect.top, clientRect.bottom],
    ][+!!this.props.vertical]

    let mousePosition =
      (this.props.vertical ? evt.clientY : evt.clientX) -
      clientBegin +
      this.scrollPosition
    let autoScrollDirection: -1 | 0 | 1 =
      mousePosition - this.scrollPosition < clientBegin + autoScrollAreaSize
        ? -1
        : mousePosition - this.scrollPosition > clientEnd - autoScrollAreaSize
        ? 1
        : 0

    let permutation = this.state.reorderingPermutation ?? items.map((_, i) => i)
    let itemPermutationIndex = permutation.indexOf(itemIndex)
    permutation = permutation.filter(i => i !== itemIndex)

    let insertBeforeIndex = this.itemCenters
      .filter((_, i) => i !== itemPermutationIndex)
      .findIndex((center, i) => mousePosition < center)
    if (insertBeforeIndex < 0) insertBeforeIndex = this.itemCenters.length

    permutation.splice(insertBeforeIndex, 0, itemIndex)

    if (autoScrollDirection === 0) {
      this.stopAutoscrolling()
    } else {
      this.startAutoscrolling(autoScrollDirection)
    }

    this.setState({
      reorderingPermutation: permutation,
    })
  }

  render() {
    let {props, state} = this
    let {Item = () => null} = props

    return (
      <div
        ref={this.elementRef}
        id={props.id}
        className={classnames(
          'portui-reorderable-flex',
          props.className ?? '',
          {
            'portui-beginoverflow': state.beginOverflow,
            'portui-endoverflow': state.endOverflow,
          }
        )}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: props.vertical ? 'column' : 'row',
          flexWrap: 'nowrap',
          alignItems: 'stretch',
          overflow: 'auto',
          ...(props.style ?? {}),
        }}
        onWheel={this.handleWheel}
        onScroll={this.handleScroll}
      >
        {(props.items ?? [])
          .map((item, i, items) =>
            state.reorderingPermutation == null
              ? item
              : items[state.reorderingPermutation[i]]
          )
          .map(item => (
            <Item
              {...item}
              key={item.itemKey}
              reordering={item.itemKey === this.state.reorderingItemKey}
              onMouseDown={this.handleItemMouseDown}
            />
          ))}
      </div>
    )
  }
}
