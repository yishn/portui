import {createElement} from 'react'
import {action} from '@storybook/addon-actions'
import {withKnobs, number} from '@storybook/addon-knobs'
import SizeMeasurer from '../src/SizeMeasurer'

export default {
  title: 'SizeMeasurer',
  component: SizeMeasurer,
  decorators: [withKnobs],
}

export const Default = () => {
  return (
    <SizeMeasurer<HTMLDivElement>
      throttle={number('throttle', 0)}
      render={({ref, width, height}) => (
        <div
          ref={ref}
          style={{
            background: 'rgba(0, 0, 0, .1)',
            overflow: 'hidden',
            resize: 'both',
          }}
        >
          Width: {width}
          <br />
          Height: {height}
        </div>
      )}
      onMeasure={action('onMeasure')}
    />
  )
}
