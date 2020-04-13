import {createElement} from 'react'
import {action} from '@storybook/addon-actions'
import SplitContainer from '../src/SplitContainer'

export default {
  title: 'SplitContainer',
  component: SplitContainer,
}

export const Default = () => (
  <SplitContainer
    onResize={action('onResize')}
    onResizeFinished={action('onResizeFinished')}
  />
)
