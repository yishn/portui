import {
  createElement,
  createRef,
  Component,
  ComponentType,
  Key,
  WheelEvent,
  UIEvent,
  DragEvent as ReactDragEvent,
} from 'react'
import classnames from 'classnames'
import scrollIntoView from 'scroll-into-view-if-needed'
import {PortuiComponentProps} from './main'

export interface ItemData {
  itemKey: Key
  dragData?: string
}

export interface ItemProps extends ItemData {
  reordering: boolean

  onDragStart: (itemKey: Key, evt: ReactDragEvent) => void
  onDragEnd: (itemKey: Key, evt: ReactDragEvent) => void
}

export interface ReorderableFlexProps<T extends ItemData>
  extends PortuiComponentProps {
  vertical?: boolean
  allowReorder?: boolean
  allowWheelScroll?: boolean
  autoScrollAreaSize?: number
  autoScrollInterval?: number
  autoScrollStep?: number
  dragDataFormat?: string
  items?: T[]

  Item?: ComponentType<ItemProps & T>
  onScroll?: (evt: UIEvent) => any
  onReorder?: (evt: {item: T; items: T[]}) => any
}

interface ReorderableFlexState {
  beginOverflow: boolean
  endOverflow: boolean
  reorderingItemKey: Key | null
}

export default class ReorderableFlex<T extends ItemData> extends Component<
  ReorderableFlexProps<T>,
  ReorderableFlexState
> {
  elementRef = createRef<HTMLDivElement>()
  itemCenters: number[] | null = null

  scrollThrottleTimeoutId: number | undefined

  constructor(props: ReorderableFlexProps<T>) {
    super(props)

    this.state = {
      beginOverflow: false,
      endOverflow: false,
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
    this.handleScroll()
  }

  componentDidUpdate(prevProps: ReorderableFlexProps<T>) {
    if (
      this.itemCenters == null ||
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

  getItemByKey(itemKey: Key): T | undefined {
    return this.props.items?.find(item => item.itemKey === itemKey)
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

  handleItemDragStart = (itemKey: Key, evt: ReactDragEvent) => {
    if (!this.props.allowReorder || this.props.dragDataFormat == null) return

    let item = this.getItemByKey(itemKey)
    if (item == null) return

    evt.dataTransfer.setData(
      this.props.dragDataFormat,
      item.dragData ?? item.itemKey.toString()
    )

    this.setState({
      reorderingItemKey: itemKey,
    })
  }

  handleItemDragEnd = (itemKey: Key, evt: ReactDragEvent) => {
    this.setState({reorderingItemKey: null})
  }

  handleDragOver = (evt: ReactDragEvent) => {
    if (
      this.props.dragDataFormat == null ||
      !evt.dataTransfer.types.includes(this.props.dragDataFormat)
    )
      return

    evt.preventDefault()

    if (
      this.elementRef.current == null ||
      this.state.reorderingItemKey == null ||
      this.itemCenters == null
    )
      return

    let {items = []} = this.props
    let itemIndex = items.findIndex(
      item => item.itemKey === this.state.reorderingItemKey
    )
    if (itemIndex < 0) return
    let item = items[itemIndex]

    let clientRect = this.elementRef.current.getBoundingClientRect()
    let clientBegin = [clientRect.left, clientRect.top][+!!this.props.vertical]

    let mousePosition =
      (this.props.vertical ? evt.clientY : evt.clientX) -
      clientBegin +
      this.scrollPosition

    let insertBeforeIndex = this.itemCenters
      .filter((_, i) => i !== itemIndex)
      .findIndex(center => mousePosition < center)
    if (insertBeforeIndex < 0) insertBeforeIndex = this.itemCenters.length - 1

    if (insertBeforeIndex !== itemIndex) {
      let permutation = items.filter(x => x !== item)
      permutation.splice(insertBeforeIndex, 0, item)

      this.props.onReorder?.({
        item,
        items: permutation,
      })
    }
  }

  handleDrop = (evt: DragEvent | ReactDragEvent) => {
    this.setState({reorderingItemKey: null})
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
        onDragOver={this.handleDragOver}
        onDrop={this.handleDrop}
      >
        {(props.items ?? []).map(item => (
          <Item
            {...item}
            key={item.itemKey}
            reordering={item.itemKey === this.state.reorderingItemKey}
            onDragStart={this.handleItemDragStart}
            onDragEnd={this.handleItemDragEnd}
          />
        ))}
      </div>
    )
  }
}
