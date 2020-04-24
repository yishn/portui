import {createElement, useState} from 'react'
import {action} from '@storybook/addon-actions'
import {withKnobs, boolean, number} from '@storybook/addon-knobs'
import VirtualizedList from '../src/VirtualizedList'

export default {
  title: 'VirtualizedList',
  component: VirtualizedList,
  decorators: [withKnobs],
}

export const Default = () => {
  let horizontal = boolean('horizontal', false)
  let [selectedIndices, setSelectedIndices] = useState([])

  return (
    <VirtualizedList<{text: string}>
      style={{
        background: 'rgba(0, 0, 0, .1)',
        ...(horizontal ? {height: 400} : {}),
      }}
      horizontal={horizontal}
      mainAxisSize={300}
      itemSize={40}
      itemCount={number('itemCount', 100)}
      stickyItemCount={number('stickyItemCount', 0)}
      selectable={boolean('selectable', true)}
      selectedIndices={selectedIndices}
      getItem={index => ({
        text: `Item ${index + 1}`,
      })}
      renderItem={(item, i) => (
        <div
          key={i}
          style={{
            ...item.style,
            padding: '0 1rem',
            borderRight: '1px solid rgba(0, 0, 0, .1)',
            borderBottom: '1px solid rgba(0, 0, 0, .1)',
            overflow: 'hidden',
            background: item.selected
              ? 'rgba(0, 0, 0, .2)'
              : item.sticky
              ? 'rgba(0, 0, 0, .1)'
              : undefined,
            lineHeight: '40px',
          }}
          onClick={evt => {
            action('Item.onClick')(evt)
            setSelectedIndices(evt.ctrlKey ? indices => [...indices, i] : [i])
          }}
        >
          {item.text}
        </div>
      )}
      onItemsVisibilityChange={action('onItemsVisibilityChange')}
      onSelectedIndicesChange={evt => {
        action('onSelectedIndicesChange')(evt)
        setSelectedIndices(evt.selectedIndices)
      }}
      onScroll={action('onScroll')}
    />
  )
}
