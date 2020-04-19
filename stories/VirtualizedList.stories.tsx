import {createElement} from 'react'
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
            lineHeight: '40px',
          }}
        >
          {item.text}
        </div>
      )}
      onItemsVisibilityChange={action('onItemsVisibilityChange')}
      onScroll={action('onScroll')}
    />
  )
}
