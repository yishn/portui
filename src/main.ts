import {CSSProperties, HTMLAttributes} from 'react'

export interface PortuiComponentProps<T> {
  id?: string
  className?: string
  style?: CSSProperties
  innerProps?: HTMLAttributes<T>
}
