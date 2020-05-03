import {createElement, createRef, Component, MouseEvent} from 'react'
import classnames from 'classnames'
import {PortuiComponentProps} from './main'

export interface PopUpProps extends PortuiComponentProps<HTMLDivElement> {
  show?: boolean
  unmountDelay?: number

  onBackdropClick?: (evt: MouseEvent) => any
}

export interface PopUpState {
  mounted: boolean
}

export default class PopUp extends Component<PopUpProps, PopUpState> {
  elementRef = createRef<HTMLDivElement>()
  unmountTimeoutId?: number

  static getDerivedStateFromProps(
    props: PopUpProps,
    prevState: PopUpState
  ): Partial<PopUpState> {
    return {
      mounted: props.show ? true : prevState.mounted,
    }
  }

  constructor(props: PopUpProps) {
    super(props)

    this.state = {
      mounted: !!props.show,
    }
  }

  componentDidUpdate(prevProps: PopUpProps) {
    if (prevProps.show !== this.props.show) {
      clearTimeout(this.unmountTimeoutId)

      if (!this.props.show && this.state.mounted) {
        this.unmountTimeoutId = setTimeout(() => {
          this.setState({
            mounted: false,
          })
        }, this.props.unmountDelay ?? 0)
      }
    }
  }

  handleClick = (evt: MouseEvent) => {
    if (evt.target !== this.elementRef.current) return

    this.props.onBackdropClick?.(evt)
  }

  render() {
    let {props, state} = this
    if (!state.mounted) return null

    return (
      <div
        ref={this.elementRef}
        id={props.id}
        className={classnames('portui-pop-up', props.className, {
          'portui-show': props.show,
        })}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          ...props.style,
        }}
        onClick={this.handleClick}
        {...props.innerProps}
      >
        {props.children}
      </div>
    )
  }
}
