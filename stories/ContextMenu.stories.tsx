import {createElement, Fragment, useState} from 'react'
import {action} from '@storybook/addon-actions'
import {withKnobs, number, boolean} from '@storybook/addon-knobs'
import ContextMenu from '../src/ContextMenu'

export default {
  title: 'ContextMenu',
  component: ContextMenu,
  decorators: [withKnobs],
}

export const Default = () => {
  let [x, setX] = useState(0)
  let [y, setY] = useState(0)
  let [showMenu, setShowMenu] = useState(false)

  let items = Array(7)
    .fill(0)
    .map((_, i) => ({
      text: `Item ${i + 1}`,
      subitems: [],
    }))

  items[3].subitems = items
  items[5].subitems = items

  return (
    <div>
      <button
        onClick={evt => {
          setX(evt.clientX)
          setY(evt.clientY)
          setShowMenu(true)
        }}
      >
        Open ContextMenu
      </button>

      <ContextMenu
        style={{
          background: 'rgba(0, 0, 0, .05)',
        }}
        menuListStyle={{
          background: 'rgba(0, 0, 0, .1)',
        }}
        x={x}
        y={y}
        show={showMenu}
        openSubmenuTimeout={number('openSubmenuTimeout', 500)}
        items={items}
        renderItem={props => (
          <div
            key={props.index}
            style={{
              padding: '.2rem .5rem',
              background: props.openedSubmenu
                ? 'rgba(0, 0, 0, .2)'
                : props.selected
                ? 'rgba(0, 0, 0, .1)'
                : undefined,
              color: props.disabled ? 'rgba(0, 0, 0, .6)' : undefined,
            }}
            onMouseEnter={evt => {
              action('Item.onMouseEnter')(props.index, evt)
              props.onMouseEnter(props.index, evt)
            }}
            onClick={evt => {
              props.onClick(props.index, evt)
            }}
          >
            {props.text} {props.subitems?.length > 0 ? '▸' : ''}
          </div>
        )}
        onClose={() => {
          action('onClose')()
          setShowMenu(false)
        }}
        onItemClick={action('onItemClick')}
      />
    </div>
  )
}
