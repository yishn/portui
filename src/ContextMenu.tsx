import {
  createElement,
  createRef,
  Component,
  RefObject,
  ReactNode,
  CSSProperties,
  Key,
  KeyboardEvent,
} from 'react'
import {PortuiComponentProps} from './main'
import PopUp from './PopUp'
import MenuList, {MenuItem, MenuItemProps, MenuItemEvent} from './MenuList'

export interface ContextMenuProps<T>
  extends PortuiComponentProps<HTMLDivElement> {
  menuListStyle?: CSSProperties
  x?: number
  y?: number
  show?: boolean
  openSubmenuTimeout?: number
  items?: (MenuItem<T> & T)[]

  renderItem?: (
    item: MenuItemProps<T> & T
  ) => Exclude<ReactNode, null | undefined>
  onClose?: () => any
  onItemClick?: (evt: MenuItemEvent<T>) => any
}

interface ContextMenuState<T> {
  prevItems?: (MenuItem<T> & T)[]
  openLeft: boolean
  openTop: boolean
  openSubmenus: {
    selectedIndex: number
    x: number
    y: number
    itemLeft: number
    itemRight: number
    itemTop: number
    itemBottom: number
  }[]
}

export default class ContextMenu<T> extends Component<
  ContextMenuProps<T>,
  ContextMenuState<T>
> {
  popUpRef = createRef<PopUp>()

  static getDerivedStateFromProps<T>(
    props: ContextMenuProps<T>,
    prevState: ContextMenuState<T>
  ): Partial<ContextMenuState<T>> {
    return {
      prevItems: props.items,
      ...(!props.show || props.items !== prevState.prevItems
        ? {openSubmenus: []}
        : {}),
    }
  }

  constructor(props: ContextMenuProps<T>) {
    super(props)

    this.state = {
      openSubmenus: [],
      openLeft: false,
      openTop: false,
    }
  }

  get elementRef(): RefObject<HTMLDivElement> {
    return this.popUpRef.current?.elementRef ?? createRef()
  }

  componentDidUpdate(
    prevProps: ContextMenuProps<T>,
    prevState: ContextMenuState<T>
  ) {
    if (this.elementRef.current == null) return

    if (prevState.openSubmenus !== this.state.openSubmenus) {
      let children = this.elementRef.current.children
      let lastSubmenu = children[children.length - 1] as HTMLElement | undefined
      if (lastSubmenu == null) return

      let viewportRect = this.elementRef.current.getBoundingClientRect()
      let rect = lastSubmenu.getBoundingClientRect()

      this.setState(({openSubmenus}) => {
        let [lastSubmenuData] = openSubmenus.slice(-1)
        if (lastSubmenuData == null) return null

        if (rect.right > viewportRect.right) {
          // Open left
          lastSubmenuData.x = Math.max(0, lastSubmenuData.itemLeft - rect.width)
        }

        if (rect.bottom > viewportRect.bottom) {
          // Open top
          lastSubmenuData.y = Math.max(
            0,
            lastSubmenuData.itemBottom - rect.height
          )
        }

        return {openSubmenus}
      })

      lastSubmenu.focus()
    }
  }

  handleSubmenuOpen = (index: number, evt: MenuItemEvent<T>) => {
    let itemRect = evt.currentTarget.getBoundingClientRect()

    this.setState(state => {
      if (state.openSubmenus[index]?.selectedIndex !== evt.index) {
        let openSubmenus = state.openSubmenus.slice(0, index)

        openSubmenus[index] = {
          selectedIndex: evt.index,
          x: itemRect.right,
          y: itemRect.top,
          itemLeft: itemRect.left,
          itemRight: itemRect.right,
          itemTop: itemRect.top,
          itemBottom: itemRect.bottom,
        }

        return {openSubmenus}
      }

      return null
    })
  }

  handleSubmenuClose = (index: number) => {
    this.setState(state => {
      return {openSubmenus: state.openSubmenus.slice(0, index)}
    })
  }

  handleKeyDown = (index: number, evt: KeyboardEvent) => {
    if (evt.key === 'ArrowLeft') {
      evt.preventDefault()

      this.setState(state => {
        if (this.state.openSubmenus[index] == null) {
          return {openSubmenus: state.openSubmenus.slice(0, index - 1)}
        }

        return null
      })
    } else if (evt.key === 'Escape') {
      evt.preventDefault()

      this.props.onClose?.()
    }
  }

  render() {
    let {props, state} = this

    let renderMenuList = (p: {
      index: number
      key: Key
      x: number
      y: number
      items?: (MenuItem<T> & T)[]
    }) => {
      return (
        <MenuList
          key={p.key}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            maxHeight: '100%',
            ...props.menuListStyle,
          }}
          items={p.items}
          openSubmenuTimeout={props.openSubmenuTimeout}
          openedSubmenuIndex={state.openSubmenus[p.index]?.selectedIndex}
          renderItem={props.renderItem}
          onSubmenuOpen={evt => this.handleSubmenuOpen(p.index, evt)}
          onSubmenuClose={() => this.handleSubmenuClose(p.index)}
          onKeyDown={evt => this.handleKeyDown(p.index, evt)}
          onItemClick={props.onItemClick}
        />
      )
    }

    return (
      <PopUp
        ref={this.popUpRef}
        id={props.id}
        className={'portui-context-menu ' + (props.className ?? '')}
        style={props.style}
        innerProps={props.innerProps}
        show={props.show}
        onBackdropClick={props.onClose}
      >
        {props.show &&
          renderMenuList({
            index: 0,
            key: 'main',
            x: props.x ?? 0,
            y: props.y ?? 0,
            items: props.items,
          })}

        {(() => {
          let submenusItems = state.openSubmenus
            .reduce(
              (acc, props) => {
                acc.push(acc.slice(-1)[0]?.[props.selectedIndex]?.subitems)
                return acc
              },
              [props.items]
            )
            .slice(1)

          return state.openSubmenus.map((props, i) => {
            let items = submenusItems[i]

            return renderMenuList({
              index: i + 1,
              key: state.openSubmenus
                .slice(0, i + 1)
                .map(x => x.selectedIndex)
                .join(','),
              x: props.x,
              y: props.y,
              items,
            })
          })
        })()}
      </PopUp>
    )
  }
}
