import {createElement, useState} from 'react'
import {action} from '@storybook/addon-actions'
import {withKnobs, boolean} from '@storybook/addon-knobs'
import ReorderableLinearFlex, {ItemProps} from '../src/ReorderableLinearFlex'

export default {
  title: 'ReorderableLinearFlex',
  component: ReorderableLinearFlex,
  decorators: [withKnobs],
}

let Item = (props: ItemProps & {title: string}) => (
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
    onDragStart={evt => {
      props.onDragStart(props.itemKey, evt)
      action('Item.onDragStart')(props.itemKey, evt)
    }}
    onDragEnd={evt => {
      props.onDragEnd(props.itemKey, evt)
      action('Item.onDragEnd')(props.itemKey, evt)
    }}
  >
    {props.title}
  </div>
)

let createStory = (itemsCount: number) => () => {
  let [items, setItems] = useState(
    [...Array(itemsCount)].map((_, i) => ({
      itemKey: i + 1,
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
      Item={Item}
      onReorder={evt => {
        setItems(evt.items)
        action('onReorder')(evt)
      }}
    />
  )
}

export const Default = createStory(5)
export const WithOverflow = createStory(50)
