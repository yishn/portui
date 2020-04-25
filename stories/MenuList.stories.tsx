import {createElement} from 'react'
import {action} from '@storybook/addon-actions'
import {withKnobs, number, boolean} from '@storybook/addon-knobs'
import MenuList from '../src/MenuList'

export default {
  title: 'MenuList',
  component: MenuList,
  decorators: [withKnobs],
}

let createStory = (withOverflow: boolean) => () => {
  return (
    <MenuList
      style={{
        background: 'rgba(0, 0, 0, .1)',
        maxHeight: 300,
      }}
      maxWidth={200}
      items={Array(withOverflow ? 15 : 7)
        .fill(0)
        .map((_, i) => ({
          text: `Item ${i + 1}`,
          subitems: i <= 3 ? [{text: 'Submenu Item'}] : [],
        }))}
      openSubmenuTimeout={number('openSubmenuTimeout', 500)}
      renderItem={props => (
        <div
          style={{
            borderRight: props.submenuOpen
              ? '.3rem solid rgba(0, 0, 0, .2)'
              : '.3rem solid transparent',
            background: props.selected ? 'rgba(0, 0, 0, .1)' : undefined,
            padding: '.2rem .2rem .2rem .5rem',
          }}
          onMouseEnter={evt => {
            action('Item.onMouseEnter')(props.index, evt)
            props.onMouseEnter(props.index, evt)
          }}
          onClick={action('Item.onClick')}
        >
          {props.text} {props.hasSubmenu ? '▸' : ''}
        </div>
      )}
      onSubmenuOpen={action('onSubmenuOpen')}
    />
  )
}

export const Default = createStory(false)
export const WithOverflow = createStory(true)
