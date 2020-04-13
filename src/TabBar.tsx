import {
  createElement,
  createRef,
  Component,
  ReactNode,
  Key,
  WheelEvent,
  SyntheticEvent,
} from 'react'
import {PortuiComponentProps} from './main'

export interface TabData<T> {
  key: Key
  data: T
}

export interface RenderTabData<T> extends TabData<T> {
  selected: boolean
}

export interface TabBarProps<T> extends PortuiComponentProps {
  allowReorder?: boolean
  selectedTabKey?: Key
  tabs?: Array<TabData<T>>
  renderTab?: (tab: RenderTabData<T>) => ReactNode
}

export default class TabBar<T> extends Component<TabBarProps<T>> {
  elementRef = createRef<HTMLDivElement>()
  scrollContainerRef = createRef<HTMLDivElement>()

  handleWheel = (evt: WheelEvent) => {
    if (this.scrollContainerRef.current == null) return
    evt.preventDefault()

    this.scrollContainerRef.current.scrollLeft += evt.deltaY
  }

  render() {
    let props = this.props

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
          ref={this.scrollContainerRef}
          className="portui-tabs"
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            alignItems: 'stretch',
            overflow: 'hidden',
          }}
          onWheel={this.handleWheel}
        >
          {(props.tabs ?? []).map((tab, i) => {
            let selected =
              props.selectedTabKey != null
                ? props.selectedTabKey === tab.key
                : i === 0

            return props.renderTab?.({...tab, selected})
          })}
        </div>
      </div>
    )
  }
}
