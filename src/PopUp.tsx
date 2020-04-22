import {
  createElement,
  createRef,
  Component,
  MouseEvent,
  HTMLAttributes,
} from 'react'
import classnames from 'classnames'
import {PortuiComponentProps} from './main'

export interface PopUpProps
  extends PortuiComponentProps<HTMLAttributes<HTMLDivElement>> {
  show?: boolean

  onBackdropClick?: (evt: MouseEvent) => any
}

export default class PopUp extends Component<PopUpProps> {
  elementRef = createRef<HTMLDivElement>()

  handleClick = (evt: MouseEvent) => {
    if (evt.target !== this.elementRef.current) return

    this.props.onBackdropClick?.(evt)
  }

  render() {
    let {props} = this

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
          display: props.show ? 'flex' : 'none',
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
