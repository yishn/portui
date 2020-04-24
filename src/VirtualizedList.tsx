import {
  createElement,
  createRef,
  Component,
  ReactNode,
  CSSProperties,
  UIEvent,
  KeyboardEvent,
  HTMLAttributes,
} from 'react'
import classnames from 'classnames'
import {PortuiComponentProps} from './main'
import {wedgeNumber, detectLinearStep} from './helper'

export interface ItemProps {
  style: CSSProperties
  sticky: boolean
  selected: boolean
}

export interface VirtualizedListProps<T extends object>
  extends PortuiComponentProps<HTMLAttributes<HTMLDivElement>> {
  mainAxisSize: number
  itemSize: number
  itemCount?: number
  horizontal?: boolean
  stickyItemCount?: number
  selectable?: boolean
  selectedIndices?: number[]

  getItem?: (index: number) => T | undefined
  renderItem?: (item: T & ItemProps, index: number) => ReactNode
  onItemsVisibilityChange?: (evt: {
    visibleStartIndex: number
    visibleEndIndex: number
  }) => any
  onSelectedIndicesChange?: (evt: {selectedIndices: number[]}) => any
  onScroll?: (evt: UIEvent) => any
  onKeyDown?: (evt: KeyboardEvent) => any
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
    if (this.elementRef.current == null) return

    let {itemCount, itemSize, selectable, stickyItemCount = 0} = this.props
    let lastSelectedIndex = this.props.selectedIndices?.slice(-1)[0]

    if (prevProps.itemCount !== itemCount) {
      this.measureVisibleItems()
    }

    if (
      selectable &&
      lastSelectedIndex != null &&
      (!prevProps.selectable ||
        prevProps.selectedIndices?.slice(-1)[0] !== lastSelectedIndex) &&
      lastSelectedIndex >= stickyItemCount
    ) {
      let selectedItemBegin = lastSelectedIndex * itemSize
      let containerSize = this.props.horizontal
        ? this.elementRef.current.clientWidth
        : this.elementRef.current.clientHeight

      if (
        selectedItemBegin - stickyItemCount * itemSize <
        this.scrollPosition
      ) {
        this.scrollPosition = selectedItemBegin - stickyItemCount * itemSize
      } else if (
        selectedItemBegin + itemSize - containerSize >
        this.scrollPosition
      ) {
        this.scrollPosition = selectedItemBegin + itemSize - containerSize
      }
    }
  }

  get scrollPosition(): number {
    return (
      (this.props.horizontal
        ? this.elementRef.current?.scrollLeft
        : this.elementRef.current?.scrollTop) ?? 0
    )
  }

  set scrollPosition(value: number) {
    if (this.elementRef.current == null) return

    if (this.props.horizontal) {
      this.elementRef.current.scrollLeft = value
    } else {
      this.elementRef.current.scrollTop = value
    }
  }

  get scrollSize(): number {
    return (this.props.itemCount ?? 0) * this.props.itemSize
  }

  measureVisibleItems() {
    if (this.elementRef.current == null) return

    let {itemSize, mainAxisSize, itemCount = 0} = this.props

    let scrollPosition = this.scrollPosition

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

  handleKeyDown = (evt: KeyboardEvent) => {
    this.props.onKeyDown?.(evt)

    if (
      evt.target !== this.elementRef.current ||
      !this.props.selectable ||
      this.props.itemCount == null ||
      this.props.itemCount === 0
    )
      return

    let nextKeys = [this.props.horizontal ? 'ArrowRight' : 'ArrowDown', 'End']
    let prevKeys = [this.props.horizontal ? 'ArrowLeft' : 'ArrowUp', 'Home']
    let allTheWay = ['Home', 'End'].includes(evt.key)
    let step = nextKeys.includes(evt.key)
      ? 1
      : prevKeys.includes(evt.key)
      ? -1
      : null
    if (step == null) return

    evt.preventDefault()

    if (
      this.props.selectedIndices == null ||
      this.props.selectedIndices.length === 0
    ) {
      this.props.onSelectedIndicesChange?.({selectedIndices: [0]})
      return
    }

    let newSelectedIndices = this.props.selectedIndices
    let lastSelectedIndex = this.props.selectedIndices.slice(-1)[0]
    let newSelectedIndex = wedgeNumber(
      !allTheWay
        ? lastSelectedIndex + step
        : step < 0
        ? 0
        : this.props.itemCount - 1,
      0,
      this.props.itemCount - 1
    )

    if (!evt.shiftKey) {
      newSelectedIndices = [newSelectedIndex]
    } else {
      let linearStep = detectLinearStep(this.props.selectedIndices)

      if (allTheWay) {
        let start =
          linearStep != null && Math.abs(linearStep) === 1
            ? this.props.selectedIndices[0]
            : lastSelectedIndex

        newSelectedIndices = Array(Math.abs(start - newSelectedIndex) + 1)
          .fill(0)
          .map((_, i) => start + i * step!)
      } else if (linearStep === -step) {
        newSelectedIndices = this.props.selectedIndices.slice(0, -1)
      } else if (lastSelectedIndex !== newSelectedIndex) {
        if (linearStep === step) {
          newSelectedIndices = [...this.props.selectedIndices, newSelectedIndex]
        } else {
          newSelectedIndices = [lastSelectedIndex, newSelectedIndex]
        }
      }
    }

    if (newSelectedIndices !== this.props.selectedIndices) {
      this.props.onSelectedIndicesChange?.({
        selectedIndices: newSelectedIndices,
      })
    }
  }

  render() {
    let {props, state} = this

    return (
      <div
        ref={this.elementRef}
        tabIndex={props.selectable ? 0 : undefined}
        id={props.id}
        className={classnames('portui-virtualized-list', props.className)}
        style={{
          position: 'relative',
          [props.horizontal ? 'width' : 'height']: props.mainAxisSize,
          overflow: 'auto',
          ...props.style,
        }}
        onScroll={this.handleScroll}
        onKeyDown={this.handleKeyDown}
        {...props.innerProps}
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
          let {stickyItemCount = 0} = props

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
                  selected:
                    !!props.selectable &&
                    !!props.selectedIndices?.includes(index),
                },
                index
              )
            )
          }

          for (
            let i = Math.max(0, state.visibleStartIndex, stickyItemCount);
            i <= state.visibleEndIndex;
            i++
          ) {
            addItemNode(i, false)
          }

          for (let i = 0; i < stickyItemCount; i++) {
            addItemNode(i, true)
          }

          return itemNodes
        })()}
      </div>
    )
  }
}
