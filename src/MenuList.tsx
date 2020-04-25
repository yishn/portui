import {
  createElement,
  createRef,
  Component,
  ReactNode,
  MouseEvent,
  KeyboardEvent,
} from 'react'
import classnames from 'classnames'
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed'
import {PortuiComponentProps} from './main'

export interface MenuItem<T> {
  subitems?: (MenuItem<T> & T)[]
}

export interface MenuItemProps<T> extends MenuItem<T> {
  index: number
  selected: boolean
  openedSubmenu: boolean

  onMouseEnter: (index: number, evt: MouseEvent) => any
}

export interface MenuListProps<T> extends PortuiComponentProps<HTMLDivElement> {
  maxWidth?: number | string
  maxHeight?: number | string
  items?: (MenuItem<T> & T)[]
  openSubmenuTimeout?: number
  openedSubmenuIndex?: number | null

  renderItem?: (item: MenuItemProps<T> & T) => ReactNode
  onSubmenuOpen?: (evt: {index: number; item: MenuItem<T> & T}) => any
  onMouseLeave?: (evt: MouseEvent) => any
  onKeyDown?: (evt: KeyboardEvent) => any
}

interface MenuListState {
  selectedIndex: number | null
}

export default class MenuList<T> extends Component<
  MenuListProps<T>,
  MenuListState
> {
  elementRef = createRef<HTMLDivElement>()
  openSubmenuTimeoutId?: number

  constructor(props: MenuListProps<T>) {
    super(props)

    this.state = {
      selectedIndex: null,
    }
  }

  getItemElementByIndex(index: number): Element | undefined {
    return this.elementRef.current
      ?.querySelectorAll('.portui-menu-list > *')
      .item(index)
  }

  handleMouseLeave = (evt: MouseEvent) => {
    this.props.onMouseLeave?.(evt)

    if (
      this.props.openedSubmenuIndex == null ||
      this.props.openedSubmenuIndex === this.state.selectedIndex
    )
      return

    clearTimeout(this.openSubmenuTimeoutId)

    this.setState({
      selectedIndex: this.props.openedSubmenuIndex,
    })
  }

  handleKeyDown = (evt: KeyboardEvent) => {
    this.props.onKeyDown?.(evt)

    if (this.props.items == null || this.props.items.length === 0) return

    let selectedItem = this.props.items?.[this.state.selectedIndex ?? -1]
    let step = evt.key === 'ArrowUp' ? -1 : evt.key === 'ArrowDown' ? 1 : null

    if (step != null) {
      // Select menu item

      evt.preventDefault()

      let newSelectedIndex =
        this.state.selectedIndex == null
          ? 0
          : (this.state.selectedIndex + step + this.props.items.length) %
            this.props.items.length

      let itemElement = this.getItemElementByIndex(newSelectedIndex)

      if (itemElement != null) {
        scrollIntoViewIfNeeded(itemElement, {
          scrollMode: 'if-needed',
          block: 'nearest',
          boundary: this.elementRef.current,
        })
      }

      setTimeout(() => {
        this.setState({
          selectedIndex: newSelectedIndex,
        })
      })
    } else if (evt.key === 'ArrowRight' && selectedItem != null) {
      // Open submenu

      evt.preventDefault()

      this.props.onSubmenuOpen?.({
        index: this.state.selectedIndex!,
        item: selectedItem,
      })
    }
  }

  handleItemMouseEnter = (index: number, evt: MouseEvent) => {
    let item = this.props.items?.[index]
    if (item == null) return

    this.elementRef.current?.focus()
    clearTimeout(this.openSubmenuTimeoutId)

    this.openSubmenuTimeoutId = setTimeout(() => {
      this.props.onSubmenuOpen?.({index, item: item!})
    }, this.props.openSubmenuTimeout ?? 500)

    this.setState({
      selectedIndex: index,
    })
  }

  render() {
    let {props, state} = this

    return (
      <div
        ref={this.elementRef}
        tabIndex={0}
        id={props.id}
        className={classnames('portui-menu-list', props.className)}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          alignItems: 'stretch',
          maxWidth: props.maxWidth,
          maxHeight: props.maxHeight ?? '100%',
          overflow: 'auto',
          ...props.style,
        }}
        onMouseLeave={this.handleMouseLeave}
        onKeyDown={this.handleKeyDown}
        {...props.innerProps}
      >
        {props.items?.map((item, i) =>
          props.renderItem?.({
            ...item,
            index: i,
            selected: state.selectedIndex === i,
            openedSubmenu: props.openedSubmenuIndex === i,
            onMouseEnter: this.handleItemMouseEnter,
          })
        )}
      </div>
    )
  }
}