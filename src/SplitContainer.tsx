import {
  createElement,
  createRef,
  Component,
  ReactNode,
  MouseEvent as ReactMouseEvent,
} from 'react'
import {PortuiComponentProps} from './main'

export interface SplitContainerProps extends PortuiComponentProps {
  vertical?: boolean
  invert?: boolean
  percentalSplit?: boolean
  sideSize?: number
  splitterSize?: number
  splitterZIndex?: number
  mainContent?: ReactNode
  sideContent?: ReactNode

  onResizeFinished?: () => any
  onResize?: (evt: {sideSize: number}) => any
}

export default class SplitContainer extends Component<SplitContainerProps> {
  resizerMouseDown = false
  elementRef = createRef<HTMLDivElement>()

  componentDidMount() {
    document.addEventListener('mouseup', this.handleMouseUp)
    document.addEventListener('mousemove', this.handleMouseMove)
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.handleMouseUp)
    document.removeEventListener('mousemove', this.handleMouseMove)
  }

  handleResizerMouseDown = (evt: ReactMouseEvent) => {
    if (evt.button !== 0) return
    this.resizerMouseDown = true
  }

  handleMouseUp = (evt: MouseEvent) => {
    if (evt.button !== 0 || !this.resizerMouseDown) return

    this.resizerMouseDown = false
    this.props.onResizeFinished?.()
  }

  handleMouseMove = (evt: MouseEvent) => {
    if (this.elementRef.current == null || !this.resizerMouseDown) return
    evt.preventDefault()

    let {vertical, invert, percentalSplit, onResize} = this.props
    let rect = this.elementRef.current.getBoundingClientRect()
    let mousePosition = !vertical ? evt.clientX : evt.clientY
    let containerBegin = !vertical ? rect.left : rect.top
    let containerEnd = !vertical ? rect.right : rect.bottom
    let sideSize = Math.max(
      Math.min(
        // Add one pixel for cursor stability
        !invert
          ? containerEnd - mousePosition + 1
          : mousePosition - containerBegin + 1,
        containerEnd - containerBegin
      ),
      0
    )

    if (percentalSplit) {
      sideSize =
        containerEnd === containerBegin
          ? 0
          : (sideSize * 100) / (containerEnd - containerBegin)
    }

    onResize?.({sideSize})
  }

  render() {
    let {
      id,
      className = '',
      style = {},
      vertical,
      invert,
      percentalSplit: procentualSplit,
      mainContent,
      sideContent,
      sideSize = 200,
      splitterSize = 5,
      splitterZIndex = 999,
    } = this.props

    let gridTemplate = procentualSplit
      ? [`${100 - sideSize}%`, `${sideSize}%`]
      : [`calc(100% - ${sideSize}px)`, `${sideSize}px`]
    if (invert) gridTemplate.reverse()

    let gridTemplateRows = !vertical ? '100%' : gridTemplate.join(' ')
    let gridTemplateColumns = vertical ? '100%' : gridTemplate.join(' ')

    let resizerNode = (
      <div
        className="portui-resizer"
        style={{
          position: 'absolute',
          width: vertical ? undefined : splitterSize,
          height: !vertical ? undefined : splitterSize,
          cursor: vertical ? 'ns-resize' : 'ew-resize',
          left: vertical ? 0 : !invert ? 0 : undefined,
          right: vertical ? 0 : invert ? 0 : undefined,
          top: !vertical ? 0 : !invert ? 0 : undefined,
          bottom: !vertical ? 0 : invert ? 0 : undefined,
          zIndex: splitterZIndex,
        }}
        onMouseDown={this.handleResizerMouseDown}
      />
    )

    return (
      <div
        ref={this.elementRef}
        id={id}
        className={`portui-split-container ${className}`}
        style={{
          display: 'grid',
          gridTemplate: `${gridTemplateRows} / ${gridTemplateColumns}`,
          ...style,
        }}
      >
        {!invert && mainContent}

        <div
          className="portui-side"
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplate: '100% / 100%',
          }}
        >
          {sideContent}
          {resizerNode}
        </div>

        {invert && mainContent}
      </div>
    )
  }
}
