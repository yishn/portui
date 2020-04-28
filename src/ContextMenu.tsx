import {
  createElement,
  createRef,
  Component,
  RefObject,
  ReactNode,
  CSSProperties,
  Key,
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

  renderItem?: (item: MenuItemProps<T> & T) => ReactNode
  onClose?: () => any
  onItemClick?: (evt: MenuItemEvent<T>) => any
}

interface ContextMenuState<T> {
  prevItems?: (MenuItem<T> & T)[]
  openLeft: boolean
  openTop: boolean
  openSubmenus: {
    selectedIndex: number
    itemLeft: number
    itemRight: number
    itemTop: number
    itemBottom: number
    openLeft?: boolean
    openTop?: boolean
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
  ): Partial<ContextMenuState<T>> | undefined {
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

  handleSubmenuOpen = (index: number, evt: MenuItemEvent<T>) => {
    let hasSubmenu = (evt.item.subitems?.length ?? 0) > 0
    let itemRect = evt.currentTarget.getBoundingClientRect()

    this.setState(state => {
      if (state.openSubmenus[index]?.selectedIndex !== evt.index) {
        let openSubmenus = state.openSubmenus.slice(0, index)

        if (hasSubmenu) {
          openSubmenus[index] = {
            selectedIndex: evt.index,
            itemLeft: itemRect.left + 5,
            itemRight: itemRect.right - 5,
            itemTop: itemRect.top,
            itemBottom: itemRect.bottom,
          }
        }

        return {openSubmenus}
      }

      return null
    })
  }

  render() {
    let {props, state} = this

    let renderMenuList = (p: {
      index: number
      key: Key
      x: number
      y: number
      openLeft: boolean
      openTop: boolean
      items?: (MenuItem<T> & T)[]
    }) => {
      return (
        <MenuList
          key={p.key}
          style={{
            position: 'absolute',
            [!p.openLeft ? 'left' : 'right']: p.x,
            [!p.openTop ? 'top' : 'bottom']: p.y,
            ...props.menuListStyle,
          }}
          items={p.items}
          openSubmenuTimeout={props.openSubmenuTimeout}
          openedSubmenuIndex={state.openSubmenus[p.index]?.selectedIndex}
          renderItem={props.renderItem}
          onSubmenuOpen={evt => this.handleSubmenuOpen(p.index, evt)}
          onItemClick={props.onItemClick}
        />
      )
    }

    return (
      <PopUp
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
            openLeft: state.openLeft,
            openTop: state.openTop,
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
              x: props.openLeft ? props.itemLeft : props.itemRight,
              y: props.openTop ? props.itemBottom : props.itemTop,
              openLeft: !!props.openLeft,
              openTop: !!props.openTop,
              items,
            })
          })
        })()}
      </PopUp>
    )
  }
}
