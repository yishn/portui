import {createElement, useState} from 'react'
import {action} from '@storybook/addon-actions'
import {withKnobs, boolean} from '@storybook/addon-knobs'
import SplitContainer from '../src/SplitContainer'

export default {
  title: 'SplitContainer',
  component: SplitContainer,
  decorators: [withKnobs],
}

let createStory = (percentualSplit: boolean) => () => {
  let [sideSize, setSideSize] = useState(percentualSplit ? 33 : 200)

  return (
    <SplitContainer
      percentalSplit={percentualSplit}
      vertical={boolean('vertical', false)}
      invert={boolean('invert', false)}
      sideSize={sideSize}
      style={{
        height: 500,
        background: 'rgba(0, 0, 0, .1)',
      }}
      mainContent={<div>Main Content</div>}
      sideContent={
        <div style={{background: 'rgba(0, 0, 0, .1)'}}>
          Side Content, Size: {sideSize}
          {percentualSplit ? '%' : 'px'}
        </div>
      }
      onResize={evt => {
        setSideSize(evt.sideSize)
        action('onResize')(evt)
      }}
      onResizeFinished={action('onResizeFinished')}
    />
  )
}

export const Default = createStory(false)
export const PercentalSplit = createStory(true)
