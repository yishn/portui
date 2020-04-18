import {createElement, useState} from 'react'
import {action} from '@storybook/addon-actions'
import {withKnobs, boolean} from '@storybook/addon-knobs'
import ReorderableLinearFlex from '../src/ReorderableLinearFlex'

export default {
  title: 'ReorderableLinearFlex',
  component: ReorderableLinearFlex,
  decorators: [withKnobs],
}

let createStory = (itemsCount: number) => () => {
  let [items, setItems] = useState(
    [...Array(itemsCount)].map((_, i) => ({
      key: i + 1,
      title: `Item ${i + 1}`,
      dragData: `Item ${i + 1}`,
    }))
  )

  return (
    <ReorderableLinearFlex
      style={{
        background: 'rgba(0, 0, 0, .1)',
        maxHeight: 200,
      }}
      dragDataFormat="data/tabs"
      vertical={boolean('vertical', false)}
      allowReorder={boolean('allowReorder', true)}
      allowWheelScroll={boolean('useWheelToScroll', true)}
      items={items}
      renderItem={props => (
        <div
          key={props.key}
          draggable
          style={{
            flex: '0 0 auto',
            padding: '.2rem .5rem',
            borderRight: '1px solid rgba(0, 0, 0, .1)',
            borderBottom: '1px solid rgba(0, 0, 0, .1)',
            background: props.reordering ? 'rgba(0, 0, 0, .1)' : undefined,
          }}
          title={props.title}
          onClick={evt => evt.preventDefault()}
          onDragStart={evt => {
            props.onDragStart(props.key, evt)
            action('Item.onDragStart')(props.key, evt)
          }}
          onDragEnd={evt => {
            props.onDragEnd(props.key, evt)
            action('Item.onDragEnd')(props.key, evt)
          }}
        >
          {props.title}
        </div>
      )}
      onReorder={evt => {
        setItems(evt.items)
        action('onReorder')(evt)
      }}
    />
  )
}

export const Default = createStory(5)
export const WithOverflow = createStory(50)
