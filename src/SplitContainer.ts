import {createElement as h, createRef, Component, ReactNode} from 'react'
import {PortuiComponentProps} from './main'

export interface SplitContainerProps extends PortuiComponentProps {
  vertical?: boolean
  invert?: boolean
  procentualSplit?: boolean
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
  elementRef = createRef<HTMLElement>()

  handleResizerMouseDown = (evt: MouseEvent) => {
    if (evt.button !== 0) return
    this.resizerMouseDown = true
  }

  handleMouseUp = (evt: MouseEvent) => {
    if (evt.button !== 0 || !this.resizerMouseDown) return

    let {onResizeFinished = () => {}} = this.props

    this.resizerMouseDown = false
    onResizeFinished()
  }

  handleMouseMove = (evt: MouseEvent) => {
    if (this.elementRef.current == null || !this.resizerMouseDown) return

    let {vertical, invert, procentualSplit, onResize = () => {}} = this.props
    let rect = this.elementRef.current.getBoundingClientRect()
    let mousePosition = !vertical ? evt.clientX : evt.clientY
    let containerBegin = !vertical ? rect.left : rect.top
    let containerEnd = !vertical ? rect.right : rect.bottom
    let sideSize = Math.min(
      !invert ? containerEnd - mousePosition : mousePosition - containerBegin,
      containerEnd - containerBegin
    )

    if (procentualSplit) {
      sideSize =
        containerEnd === containerBegin
          ? 0
          : (sideSize * 100) / (containerEnd - containerBegin)
    }

    onResize({sideSize})
  }

  componentDidMount() {
    document.addEventListener('mouseup', this.handleMouseUp)
    document.addEventListener('mousemove', this.handleMouseMove)
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.handleMouseUp)
    document.removeEventListener('mousemove', this.handleMouseMove)
  }

  render() {
    let {
      id,
      className = '',
      style = {},
      vertical,
      invert,
      procentualSplit,
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

    let resizer = h('div', {
      className: 'portui-resizer',
      style: {
        position: 'absolute',
        width: vertical ? null : splitterSize,
        height: !vertical ? null : splitterSize,
        cursor: vertical ? 'ns-resize' : 'ew-resize',
        left: vertical ? 0 : !invert ? 0 : null,
        right: vertical ? 0 : invert ? 0 : null,
        top: !vertical ? 0 : !invert ? 0 : null,
        bottom: !vertical ? 0 : invert ? 0 : null,
        zIndex: splitterZIndex,
      },

      onMouseDown: this.handleResizerMouseDown,
    })

    return h(
      'div',
      {
        ref: this.elementRef,
        id,
        className: `portui-split-container ${className}`,
        style: {
          ...style,
          display: 'grid',
          gridTemplate: `${gridTemplateRows} / ${gridTemplateColumns}`,
        },
      },

      !invert && mainContent,

      h(
        'div',
        {
          className: `portui-side`,
          style: {
            position: 'relative',
            display: 'grid',
            gridTemplate: '100% / 100%',
          },
        },
        [sideContent, resizer]
      ),

      invert && mainContent
    )
  }
}
