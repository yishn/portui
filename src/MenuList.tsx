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
  disabled?: boolean
  subitems?: (MenuItem<T> & T)[]
}

export interface MenuItemProps<T> extends MenuItem<T> {
  index: number
  selected: boolean
  openedSubmenu: boolean

  onMouseEnter: (index: number, evt: MouseEvent) => any
  onClick: (index: number, evt: MouseEvent) => any
}

export interface MenuItemEvent<T> {
  index: number
  item: MenuItem<T> & T
  currentTarget: Element
}

export interface MenuListProps<T> extends PortuiComponentProps<HTMLDivElement> {
  items?: (MenuItem<T> & T)[]
  openSubmenuTimeout?: number
  openedSubmenuIndex?: number | null

  renderItem?: (
    item: MenuItemProps<T> & T
  ) => Exclude<ReactNode, null | undefined>
  onSubmenuOpen?: (evt: MenuItemEvent<T>) => any
  onSubmenuClose?: () => any
  onItemClick?: (evt: MenuItemEvent<T>) => any
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

  getItemElementByIndex(index: number): Element | null {
    return this.elementRef.current?.children[index] ?? null
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

    if (
      this.props.items == null ||
      this.props.items.filter(item => !item.disabled).length === 0
    )
      return

    let selectedItem = this.props.items?.[this.state.selectedIndex ?? -1]
    let step = evt.key === 'ArrowUp' ? -1 : evt.key === 'ArrowDown' ? 1 : null

    if (step != null) {
      // Select menu item

      evt.preventDefault()

      let newSelectedIndex = 0

      if (this.state.selectedIndex != null) {
        for (let i = 1; ; i++) {
          newSelectedIndex =
            (this.state.selectedIndex + i * step + this.props.items.length) %
            this.props.items.length

          if (!this.props.items[newSelectedIndex].disabled) break
        }
      }

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

      if (
        this.state.selectedIndex != null &&
        this.props.openedSubmenuIndex !== this.state.selectedIndex
      ) {
        if ((selectedItem.subitems?.length ?? 0) > 0) {
          this.props.onSubmenuOpen?.({
            index: this.state.selectedIndex,
            item: selectedItem,
            currentTarget: this.getItemElementByIndex(
              this.state.selectedIndex
            )!,
          })
        } else {
          this.props.onSubmenuClose?.()
        }
      }
    } else if (evt.key === 'ArrowLeft' && selectedItem != null) {
      evt.preventDefault()

      this.props.onSubmenuClose?.()
    } else if (evt.key === 'Enter' && selectedItem != null) {
      // Trigger item click

      evt.preventDefault()

      this.props.onItemClick?.({
        index: this.state.selectedIndex!,
        item: selectedItem,
        currentTarget: this.getItemElementByIndex(this.state.selectedIndex!)!,
      })
    }
  }

  handleItemMouseEnter = (index: number, evt: MouseEvent) => {
    let item = this.props.items?.[index]
    if (item == null || item.disabled) return

    this.elementRef.current?.focus()
    clearTimeout(this.openSubmenuTimeoutId)

    if (this.props.openedSubmenuIndex !== index) {
      let {currentTarget} = evt

      this.openSubmenuTimeoutId = setTimeout(() => {
        if (item != null && (item.subitems?.length ?? 0) > 0) {
          this.props.onSubmenuOpen?.({
            index,
            item,
            currentTarget,
          })
        } else {
          this.props.onSubmenuClose?.()
        }
      }, this.props.openSubmenuTimeout ?? 500)
    }

    this.setState({
      selectedIndex: index,
    })
  }

  handleItemClick = (index: number, evt: MouseEvent) => {
    let item = this.props.items?.[index]
    if (item == null || item.disabled) return

    this.props.onItemClick?.({
      index,
      item,
      currentTarget: this.getItemElementByIndex(index)!,
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
            onClick: this.handleItemClick,
          })
        )}
      </div>
    )
  }
}
