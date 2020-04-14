import {
  createElement,
  createRef,
  Component,
  ComponentType,
  Key,
  WheelEvent,
} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import {PortuiComponentProps} from './main'

export interface TabData<T> {
  tabKey: Key
  data: T
}

export interface TabProps<T> extends TabData<T> {
  selected: boolean
}

export interface TabBarProps<T> extends PortuiComponentProps {
  allowReorder?: boolean
  allowWheelScroll?: boolean
  selectedTabId?: Key
  tabs?: Array<TabData<T>>
  TabComponent?: ComponentType<TabProps<T>>
}

interface TabBarState {
  scrollLeft: number
}

export default class TabBar<T> extends Component<TabBarProps<T>, TabBarState> {
  elementRef = createRef<HTMLDivElement>()
  tabsContainer = createRef<HTMLDivElement>()

  constructor(props: TabBarProps<T>) {
    super(props)

    this.state = {
      scrollLeft: 0,
    }
  }

  componentDidUpdate(prevProps: TabBarProps<T>, prevState: TabBarState) {
    if (prevProps.selectedTabId !== this.props.selectedTabId) {
      this.scrollTabIntoView(this.props.selectedTabId ?? 0)
    }

    if (
      this.tabsContainer.current != null &&
      prevState.scrollLeft !== this.state.scrollLeft
    ) {
      this.tabsContainer.current.scrollLeft = this.state.scrollLeft
    }
  }

  getTabElementByKey(tabKey: Key): Element | undefined {
    if (this.props.tabs == null || this.tabsContainer.current == null) return

    let index = this.props.tabs.findIndex(tab => tab.tabKey === tabKey)
    let tabElement = this.tabsContainer.current
      .querySelectorAll('.portui-tabs > *')
      .item(index)

    return tabElement
  }

  scrollTo(scrollLeft: number) {
    if (this.tabsContainer.current == null) return

    this.setState({
      scrollLeft: Math.min(
        this.tabsContainer.current.scrollWidth -
          this.tabsContainer.current.clientWidth,
        Math.max(0, scrollLeft)
      ),
    })
  }

  scrollTabIntoView(tabKey: Key) {
    let tabElement = this.getTabElementByKey(tabKey)

    if (tabElement != null && this.tabsContainer.current != null) {
      scrollIntoView(tabElement, {
        scrollMode: 'if-needed',
        boundary: this.tabsContainer.current,
        behavior: actions => {
          for (let action of actions) {
            if (action.el !== this.tabsContainer.current) continue

            this.scrollTo(action.left)
            break
          }
        },
      })
    }
  }

  handleWheel = (evt: WheelEvent) => {
    if (this.tabsContainer.current == null || !this.props.allowWheelScroll)
      return

    evt.preventDefault()

    let delta = evt.deltaX !== 0 ? evt.deltaX : evt.deltaY
    this.scrollTo(this.state.scrollLeft + delta)
  }

  render() {
    let props = this.props
    let {TabComponent = () => null} = props

    return (
      <div
        ref={this.elementRef}
        id={props.id}
        className={`portui-tab-bar ${props.className ?? ''}`}
        style={{
          display: 'grid',
          gridTemplate: '100% / 100%',
          ...(props.style ?? {}),
        }}
      >
        <div
          ref={this.tabsContainer}
          className="portui-tabs"
          style={{
            position: 'relative',
            display: 'flex',
            flexWrap: 'nowrap',
            alignItems: 'stretch',
            overflow: 'hidden',
          }}
          onWheel={this.handleWheel}
        >
          {(props.tabs ?? []).map((tab, i) => {
            let selected =
              props.selectedTabId != null
                ? props.selectedTabId === tab.tabKey
                : i === 0

            return (
              <TabComponent {...tab} key={tab.tabKey} selected={selected} />
            )
          })}
        </div>
      </div>
    )
  }
}
