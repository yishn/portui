import {createElement, useState} from 'react'
import {action} from '@storybook/addon-actions'
import {withKnobs, boolean} from '@storybook/addon-knobs'
import TabBar from '../src/TabBar'

export default {
  title: 'TabBar',
  component: TabBar,
  decorators: [withKnobs],
}

export const Default = () => {
  let [selectedTabId, setSelectedTabId] = useState(1)
  let [tabs, setTabs] = useState(
    [...Array(50)].map((_, i) => ({
      tabKey: i + 1,
      title: `File ${i + 1}`,
    }))
  )

  return (
    <TabBar
      style={{background: 'rgba(0, 0, 0, .1)'}}
      allowReorder={boolean('allowReorder', false)}
      allowWheelScroll={boolean('useWheelToScroll', true)}
      selectedTabId={selectedTabId}
      tabs={tabs}
      TabComponent={props => (
        <a
          style={{
            flex: '0 0 auto',
            padding: '.2rem .5rem',
            background: props.selected ? 'rgba(0, 0, 0, .1)' : undefined,
          }}
          href="#"
          title={props.title}
          onClick={evt => evt.preventDefault()}
          onMouseDown={evt => {
            props.onMouseDown(props.tabKey, evt)

            if (evt.button !== 0) return
            evt.preventDefault()

            setSelectedTabId(props.tabKey)
            action('Tab.onMouseDown')(props.tabKey, evt)
          }}
        >
          {props.title}
        </a>
      )}
      onReorder={evt => {
        setTabs(evt.tabs)
        action('onReorder')(evt)
      }}
    />
  )
}
