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

export interface TabData {
  tabKey: Key
}

export interface TabProps extends TabData {
  current: boolean

  onMouseDown: (tabKey: Key, evt: ReactMouseEvent) => void
}

export interface TabBarProps<T extends TabData> extends PortuiComponentProps {
  allowReorder?: boolean
  allowWheelScroll?: boolean
  autoScrollAreaSize?: number
  autoScrollInterval?: number
  autoScrollStep?: number
  currentTabKey?: Key
  tabs?: Array<T>

  Tab?: ComponentType<TabProps & T>
  onScroll?: (evt: UIEvent) => any
  onReorder?: (evt: {tabs: Array<T>}) => any
}

interface TabBarState {
  beginOverflow: boolean
  endOverflow: boolean
  reorderingPermutation: number[] | null
}

export default class TabBar<T extends TabData> extends Component<
  TabBarProps<T>,
  TabBarState
> {
  elementRef = createRef<HTMLDivElement>()
  tabsContainerRef = createRef<HTMLDivElement>()

  tabCenters: number[] | null = null
  reorderingTabKey: Key | null = null

  autoScrollDirection: -1 | 1 = -1
  autoScrollIntervalId: number | undefined
  scrollThrottleTimeoutId: number | undefined

  constructor(props: TabBarProps<T>) {
    super(props)

    this.state = {
      beginOverflow: false,
      endOverflow: false,
      reorderingPermutation: null,
    }
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

  componentDidUpdate(prevProps: TabBarProps<T>, prevState: TabBarState) {
    if (prevProps.currentTabKey !== this.props.currentTabKey) {
      this.scrollTabIntoView(this.props.currentTabKey ?? 0)
    }

    if (
      this.tabCenters == null ||
      prevState.reorderingPermutation !== this.state.reorderingPermutation
    ) {
      this.tabCenters = this.getTabElements().map(
        el => el.offsetLeft + el.offsetWidth / 2
      )
    }
  }

  getTabElements(): HTMLElement[] {
    if (this.tabsContainerRef.current == null) return []

    return [
      ...this.tabsContainerRef.current.querySelectorAll('.portui-tabs > *'),
    ] as HTMLElement[]
  }

  getTabElementByKey(tabKey: Key): HTMLElement | undefined {
    if (this.props.tabs == null || this.tabsContainerRef.current == null) return

    let index = this.props.tabs.findIndex(tab => tab.tabKey === tabKey)
    let tabElement = this.tabsContainerRef.current
      .querySelectorAll('.portui-tabs > *')
      .item(index) as HTMLElement

    return tabElement
  }

  scrollTo(scrollLeft: number, smooth: boolean = false) {
    if (this.tabsContainerRef.current == null) return

    this.tabsContainerRef.current.scrollTo({
      left: scrollLeft,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }

  scrollTabIntoView(tabKey: Key) {
    let tabElement = this.getTabElementByKey(tabKey)

    if (tabElement != null && this.tabsContainerRef.current != null) {
      scrollIntoView(tabElement, {
        scrollMode: 'if-needed',
        boundary: this.tabsContainerRef.current,
        behavior: actions => {
          for (let action of actions) {
            if (action.el !== this.tabsContainerRef.current) continue

            this.scrollTo(action.left, true)
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
      if (this.tabsContainerRef.current == null) return

      this.scrollTo(
        this.tabsContainerRef.current.scrollLeft + direction * autoScrollStep,
        true
      )
    }, autoScrollInterval)
  }

  stopAutoscrolling() {
    if (this.autoScrollIntervalId != null) {
      clearInterval(this.autoScrollIntervalId)
      this.autoScrollIntervalId = undefined
    }
  }

  handleWheel = (evt: WheelEvent) => {
    if (this.tabsContainerRef.current == null || !this.props.allowWheelScroll)
      return

    evt.preventDefault()

    this.scrollTo(this.tabsContainerRef.current?.scrollLeft + evt.deltaY)
  }

  handleScroll = (evt?: UIEvent) => {
    if (evt != null) {
      this.props.onScroll?.(evt)
    }

    clearTimeout(this.scrollThrottleTimeoutId)

    this.scrollThrottleTimeoutId = setTimeout(() => {
      let el = this.tabsContainerRef.current
      if (el == null) return

      this.setState({
        beginOverflow: el.scrollLeft > 0,
        endOverflow: Math.ceil(el.scrollLeft) < el.scrollWidth - el.clientWidth,
      })
    }, 200)
  }

  handleTabMouseDown = (tabKey: Key, evt: ReactMouseEvent) => {
    if (
      evt.button !== 0 ||
      !this.props.allowReorder ||
      this.reorderingTabKey != null
    )
      return

    evt.preventDefault()

    this.reorderingTabKey = tabKey
  }

  handleMouseUp = (evt: MouseEvent) => {
    if (evt.button !== 0 || this.reorderingTabKey == null) return

    evt.preventDefault()

    if (this.state.reorderingPermutation != null) {
      this.props.onReorder?.({
        tabs: this.state.reorderingPermutation.map(
          i => (this.props.tabs ?? [])[i]
        ),
      })
    }

    this.reorderingTabKey = null

    this.stopAutoscrolling()
    this.setState({
      reorderingPermutation: null,
    })
  }

  handleMouseMove = (evt: MouseEvent) => {
    if (
      this.tabsContainerRef.current == null ||
      this.reorderingTabKey == null ||
      this.tabCenters == null
    )
      return

    evt.preventDefault()

    let {tabs = [], autoScrollAreaSize = 50} = this.props
    let tabIndex = tabs.findIndex(tab => tab.tabKey === this.reorderingTabKey)
    if (tabIndex < 0) return

    let tabsContainerRect = this.tabsContainerRef.current.getBoundingClientRect()
    let mouseLeft =
      evt.clientX -
      tabsContainerRect.left +
      this.tabsContainerRef.current?.scrollLeft
    let autoScrollDirection: -1 | 0 | 1 =
      mouseLeft - this.tabsContainerRef.current?.scrollLeft <
      tabsContainerRect.left + autoScrollAreaSize
        ? -1
        : mouseLeft - this.tabsContainerRef.current?.scrollLeft >
          tabsContainerRect.right - autoScrollAreaSize
        ? 1
        : 0

    let permutation = this.state.reorderingPermutation ?? tabs.map((_, i) => i)
    let tabPermutationIndex = permutation.indexOf(tabIndex)
    permutation = permutation.filter(i => i !== tabIndex)

    let insertBeforeIndex = this.tabCenters
      .filter((_, i) => i !== tabPermutationIndex)
      .findIndex((center, i) => mouseLeft < center)
    if (insertBeforeIndex < 0) insertBeforeIndex = this.tabCenters.length

    permutation.splice(insertBeforeIndex, 0, tabIndex)

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
    let {Tab = () => null} = props

    return (
      <div
        ref={this.elementRef}
        id={props.id}
        className={classnames('portui-tab-bar', props.className ?? '', {
          'portui-beginoverflow': state.beginOverflow,
          'portui-endoverflow': state.endOverflow,
        })}
        style={{
          display: 'grid',
          gridTemplate: '100% / 100%',
          ...(props.style ?? {}),
        }}
      >
        <div
          ref={this.tabsContainerRef}
          className="portui-tabs"
          style={{
            position: 'relative',
            display: 'flex',
            flexWrap: 'nowrap',
            alignItems: 'stretch',
            overflow: 'auto',
          }}
          onWheel={this.handleWheel}
          onScroll={this.handleScroll}
        >
          {(props.tabs ?? [])
            .map((tab, i, tabs) =>
              state.reorderingPermutation == null
                ? tab
                : tabs[state.reorderingPermutation[i]]
            )
            .map((tab, i) => (
              <Tab
                {...tab}
                key={tab.tabKey}
                current={
                  props.currentTabKey != null
                    ? props.currentTabKey === tab.tabKey
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
