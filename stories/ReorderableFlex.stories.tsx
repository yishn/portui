import {createElement, useState} from 'react'
import {action} from '@storybook/addon-actions'
import {withKnobs, boolean} from '@storybook/addon-knobs'
import ReorderableFlex from '../src/ReorderableFlex'

export default {
  title: 'ReorderableFlex',
  component: ReorderableFlex,
  decorators: [withKnobs],
}

let createStory = (itemsCount: number) => () => {
  let [items, setItems] = useState(
    [...Array(itemsCount)].map((_, i) => ({
      itemKey: i + 1,
      title: `Item ${i + 1}`,
    }))
  )

  return (
    <ReorderableFlex
      style={{
        background: 'rgba(0, 0, 0, .1)',
        maxHeight: 200,
      }}
      vertical={boolean('vertical', false)}
      allowReorder={boolean('allowReorder', true)}
      allowWheelScroll={boolean('useWheelToScroll', true)}
      items={items}
      Item={props => (
        <div
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
          onMouseDown={evt => {
            props.onMouseDown(props.itemKey, evt)

            if (evt.button !== 0) return
            evt.preventDefault()

            action('Item.onMouseDown')(props.itemKey, evt)
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
