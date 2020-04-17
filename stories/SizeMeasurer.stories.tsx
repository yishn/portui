import {createElement, useState} from 'react'
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
      render={({elementRef, width, height}) => (
        <div ref={elementRef} style={{background: 'rgba(0, 0, 0, .1)'}}>
          Width: {width}, Height: {height}
        </div>
      )}
      onMeasure={action('onMeasure')}
    />
  )
}
