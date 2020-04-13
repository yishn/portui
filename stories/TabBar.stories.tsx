import {createElement, useState, Key} from 'react'
import {action} from '@storybook/addon-actions'
import {withKnobs, boolean} from '@storybook/addon-knobs'
import TabBar from '../src/TabBar'

export default {
  title: 'TabBar',
  component: TabBar,
  decorators: [withKnobs],
}

export const Default = () => {
  let [selectedTabKey, setSelectedTabKey] = useState<Key>(1)

  return (
    <TabBar
      style={{background: 'rgba(0, 0, 0, .1)'}}
      allowReorder={boolean('allowReorder', false)}
      selectedTabKey={selectedTabKey}
      tabs={[...Array(50)].map((_, i) => ({
        key: i + 1,
        data: {title: `File ${i + 1}`},
      }))}
      renderTab={tab => (
        <a
          style={{
            flex: '0 0 auto',
            padding: '.2rem .5rem',
            background: tab.selected ? 'rgba(0, 0, 0, .1)' : undefined,
          }}
          href="#"
          title={tab.data.title}
          onClick={evt => {
            evt.preventDefault()

            setSelectedTabKey(tab.key)
            action('Tab.onClick')(evt)
          }}
        >
          {tab.data.title}
        </a>
      )}
    />
  )
}
