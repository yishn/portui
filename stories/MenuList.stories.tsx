import {createElement, useState} from 'react'
import {action} from '@storybook/addon-actions'
import {withKnobs, number, boolean} from '@storybook/addon-knobs'
import MenuList from '../src/MenuList'

export default {
  title: 'MenuList',
  component: MenuList,
  decorators: [withKnobs],
}

let createStory = (withOverflow: boolean) => () => {
  let [openedSubmenuIndex, setOpenedSubmenuIndex] = useState<number | null>()

  return (
    <MenuList
      style={{
        background: 'rgba(0, 0, 0, .1)',
        maxHeight: 300,
        maxWidth: 200,
      }}
      items={[
        ...Array(withOverflow ? 15 : 7)
          .fill(0)
          .map((_, i) => ({
            text: `Item ${i + 1}`,
            subitems: i <= 3 ? [{text: 'Submenu Item'}] : [],
          })),
        {
          text: 'Disabled Item',
          disabled: true,
        },
        {text: 'Last Item'},
      ]}
      openSubmenuTimeout={number('openSubmenuTimeout', 500)}
      openedSubmenuIndex={openedSubmenuIndex}
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
      onSubmenuOpen={evt => {
        action('onSubmenuOpen')(evt)
        setOpenedSubmenuIndex(evt.item.subitems?.length > 0 ? evt.index : null)
      }}
      onSubmenuClose={() => {
        action('onSubmenuClose')()
        setOpenedSubmenuIndex(null)
      }}
      onItemClick={action('onItemClick')}
    />
  )
}

export const Default = createStory(false)
export const WithOverflow = createStory(true)
