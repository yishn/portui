import {
  createElement,
  createRef,
  Component,
  ReactNode,
  CSSProperties,
  UIEvent,
} from 'react'
import classnames from 'classnames'
import {PortuiComponentProps} from './main'

export interface ItemProps {
  style: CSSProperties
  sticky: boolean
}

export interface VirtualizedListProps<T extends object>
  extends PortuiComponentProps {
  mainAxisSize: number
  itemSize: number
  itemCount?: number
  horizontal?: boolean
  stickyIndices?: number[]

  getItem?: (index: number) => T | undefined
  renderItem?: (item: T & ItemProps, index: number) => ReactNode
  onItemsVisibilityChange?: (evt: {
    visibleStartIndex: number
    visibleEndIndex: number
  }) => any
  onScroll?: (evt: UIEvent) => any
}

interface VirtualizedListState {
  visibleStartIndex: number
  visibleEndIndex: number
}

export default class VirtualizedList<T extends object> extends Component<
  VirtualizedListProps<T>,
  VirtualizedListState
> {
  elementRef = createRef<HTMLDivElement>()

  constructor(props: VirtualizedListProps<T>) {
    super(props)

    this.state = {
      visibleStartIndex: -1,
      visibleEndIndex: -1,
    }
  }

  componentDidMount() {
    this.measureVisibleItems()
  }

  componentDidUpdate(prevProps: VirtualizedListProps<T>) {
    if (prevProps.itemCount !== this.props.itemCount) {
      this.measureVisibleItems()
    }
  }

  get scrollSize(): number {
    return (this.props.itemCount ?? 0) * this.props.itemSize
  }

  measureVisibleItems() {
    if (this.elementRef.current == null) return

    let {itemSize, mainAxisSize, itemCount = 0} = this.props

    let scrollPosition = this.props.horizontal
      ? this.elementRef.current.scrollLeft
      : this.elementRef.current.scrollTop

    let visibleStartIndex = Math.min(
      Math.floor(scrollPosition / itemSize),
      itemCount - 1
    )

    let visibleEndIndex = Math.min(
      Math.ceil((scrollPosition + mainAxisSize) / itemSize),
      itemCount - 1
    )

    if (
      this.state.visibleStartIndex !== visibleStartIndex ||
      this.state.visibleEndIndex !== visibleEndIndex
    ) {
      this.setState({visibleStartIndex, visibleEndIndex})
      this.props.onItemsVisibilityChange?.({visibleStartIndex, visibleEndIndex})
    }
  }

  handleScroll = (evt: UIEvent) => {
    this.measureVisibleItems()
    this.props.onScroll?.(evt)
  }

  render() {
    let {props, state} = this

    return (
      <div
        ref={this.elementRef}
        id={props.id}
        className={classnames('portui-virtualized-list', props.className)}
        style={{
          position: 'relative',
          [props.horizontal ? 'width' : 'height']: props.mainAxisSize,
          overflow: 'auto',
          ...props.style,
        }}
        onScroll={this.handleScroll}
      >
        <div
          className="portui-placeholder"
          style={{
            position: 'absolute',
            [props.horizontal ? 'left' : 'top']: this.scrollSize - 1,
            height: 1,
            width: 1,
            visibility: 'hidden',
            pointerEvents: 'none',
          }}
        />

        {(() => {
          let itemNodes: ReactNode[] = []
          let unusedStickyIndices = [...(props.stickyIndices ?? [])]

          let addItemNode = (index: number, sticky: boolean) => {
            let item = this.props.getItem?.(index)
            if (item === undefined) return

            itemNodes.push(
              this.props.renderItem?.(
                {
                  ...item,
                  style: {
                    boxSizing: 'border-box',
                    position: sticky ? 'sticky' : 'absolute',
                    [props.horizontal ? 'top' : 'left']: 0,
                    [props.horizontal ? 'height' : 'width']: '100%',
                    [props.horizontal ? 'left' : 'top']:
                      index * this.props.itemSize,
                    [props.horizontal ? 'width' : 'height']: this.props
                      .itemSize,
                    float: 'left',
                  },
                  sticky,
                },
                index
              )
            )
          }

          for (
            let i = state.visibleStartIndex;
            i >= 0 && i <= state.visibleEndIndex;
            i++
          ) {
            let unusedStickyIndicesIndex = unusedStickyIndices.indexOf(i)
            if (unusedStickyIndicesIndex >= 0) {
              unusedStickyIndices.splice(unusedStickyIndicesIndex, 1)
            }

            addItemNode(i, unusedStickyIndicesIndex >= 0)
          }

          for (let i of unusedStickyIndices) {
            addItemNode(i, true)
          }

          return itemNodes
        })()}
      </div>
    )
  }
}
