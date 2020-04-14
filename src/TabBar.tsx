import {
  createElement,
  createRef,
  Component,
  ComponentType,
  Key,
  WheelEvent,
  MouseEvent as ReactMouseEvent,
} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import {PortuiComponentProps} from './main'

export interface TabData {
  tabKey: Key
}

export interface TabProps extends TabData {
  selected: boolean

  onMouseDown: (tabKey: Key, evt: ReactMouseEvent) => void
}

export interface TabBarProps<T> extends PortuiComponentProps {
  allowReorder?: boolean
  allowWheelScroll?: boolean
  selectedTabId?: Key
  tabs?: Array<TabData & T>
  TabComponent?: ComponentType<TabProps & T>

  onReorder?: (evt: {tabs: Array<TabData & T>}) => any
}

interface TabBarState {
  scrollLeft: number
  reorderingTabKey: Key | null
  reorderingPermutation: number[] | null
  tabCenters: number[] | null
}

export default class TabBar<T> extends Component<TabBarProps<T>, TabBarState> {
  elementRef = createRef<HTMLDivElement>()
  tabsContainer = createRef<HTMLDivElement>()

  constructor(props: TabBarProps<T>) {
    super(props)

    this.state = {
      scrollLeft: 0,
      reorderingTabKey: null,
      reorderingPermutation: null,
      tabCenters: null,
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

    if (
      this.state.tabCenters == null ||
      prevState.reorderingPermutation !== this.state.reorderingPermutation
    ) {
      this.setState({
        tabCenters: this.getTabElements().map(
          el => el.offsetLeft + el.offsetWidth / 2
        ),
      })
    }
  }

  componentDidMount() {
    document.addEventListener('mouseup', this.handleMouseUp)
    document.addEventListener('mousemove', this.handleMouseMove)
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.handleMouseUp)
    document.removeEventListener('mousemove', this.handleMouseMove)
  }

  getTabElements(): HTMLElement[] {
    if (this.tabsContainer.current == null) return []

    return [
      ...this.tabsContainer.current.querySelectorAll('.portui-tabs > *'),
    ] as HTMLElement[]
  }

  getTabElementByKey(tabKey: Key): HTMLElement | undefined {
    if (this.props.tabs == null || this.tabsContainer.current == null) return

    let index = this.props.tabs.findIndex(tab => tab.tabKey === tabKey)
    let tabElement = this.tabsContainer.current
      .querySelectorAll('.portui-tabs > *')
      .item(index) as HTMLElement

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

  handleTabMouseDown = (tabKey: Key, evt: ReactMouseEvent) => {
    if (
      evt.button !== 0 ||
      !this.props.allowReorder ||
      this.state.reorderingTabKey != null
    )
      return

    evt.preventDefault()

    this.setState({
      reorderingTabKey: tabKey,
    })
  }

  handleMouseUp = (evt: MouseEvent) => {
    if (evt.button !== 0 || this.state.reorderingTabKey == null) return

    evt.preventDefault()

    if (this.state.reorderingPermutation != null) {
      this.props.onReorder?.({
        tabs: this.state.reorderingPermutation.map(
          i => (this.props.tabs ?? [])[i]
        ),
      })
    }

    this.setState({
      reorderingTabKey: null,
      reorderingPermutation: null,
    })
  }

  handleMouseMove = (evt: MouseEvent) => {
    if (
      this.tabsContainer.current == null ||
      this.props.tabs == null ||
      this.state.reorderingTabKey == null ||
      this.state.tabCenters == null
    )
      return

    evt.preventDefault()

    let tabIndex = this.props.tabs.findIndex(
      tab => tab.tabKey === this.state.reorderingTabKey
    )
    if (tabIndex < 0) return

    let tabsContainerLeft = this.tabsContainer.current.getBoundingClientRect()
      .left
    let mouseLeft =
      evt.clientX - tabsContainerLeft + this.tabsContainer.current.scrollLeft
    let permutation =
      this.state.reorderingPermutation ?? this.props.tabs.map((_, i) => i)
    let tabPermutationIndex = permutation.indexOf(tabIndex)
    permutation = permutation.filter(i => i !== tabIndex)

    let insertBeforeIndex = this.state.tabCenters
      .filter((_, i) => i !== tabPermutationIndex)
      .findIndex((center, i) => mouseLeft < center)
    if (insertBeforeIndex < 0) insertBeforeIndex = this.state.tabCenters.length

    permutation.splice(insertBeforeIndex, 0, tabIndex)

    this.setState({
      reorderingPermutation: permutation,
    })
  }

  render() {
    let {props, state} = this
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
          {(props.tabs ?? [])
            .map((tab, i, tabs) =>
              state.reorderingPermutation == null
                ? tab
                : tabs[state.reorderingPermutation[i]]
            )
            .map((tab, i) => (
              <TabComponent
                {...tab}
                key={tab.tabKey}
                selected={
                  props.selectedTabId != null
                    ? props.selectedTabId === tab.tabKey
                    : i === 0
                }
                onMouseDown={this.handleTabMouseDown}
              />
            ))}
        </div>
      </div>
    )
  }
}
