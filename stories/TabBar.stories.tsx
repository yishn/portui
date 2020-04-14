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
  let [selectedTabId, setSelectedTabId] = useState<Key>(1)

  return (
    <TabBar
      style={{background: 'rgba(0, 0, 0, .1)'}}
      allowReorder={boolean('allowReorder', false)}
      allowWheelScroll={boolean('useWheelToScroll', true)}
      selectedTabId={selectedTabId}
      tabs={[...Array(50)].map((_, i) => ({
        tabKey: i + 1,
        data: {title: `File ${i + 1}`},
      }))}
      TabComponent={props => (
        <a
          style={{
            flex: '0 0 auto',
            padding: '.2rem .5rem',
            background: props.selected ? 'rgba(0, 0, 0, .1)' : undefined,
          }}
          href="#"
          title={props.data.title}
          onClick={evt => {
            evt.preventDefault()

            setSelectedTabId(props.tabKey)
            action('Tab.onClick')(evt)
          }}
        >
          {props.data.title}
        </a>
      )}
    />
  )
}
