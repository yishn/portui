import {CSSProperties} from 'react'

export interface PortuiComponentProps<P> {
  id?: string
  className?: string
  style?: CSSProperties
  innerProps?: P
}
