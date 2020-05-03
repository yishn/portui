import {createElement, useState} from 'react'
import {action} from '@storybook/addon-actions'
import {withKnobs, number, boolean} from '@storybook/addon-knobs'
import ColumnList from '../src/ColumnList'

export default {
  title: 'ColumnList',
  component: ColumnList,
  decorators: [withKnobs],
}

interface Column {
  key: keyof Row
  width: number
  text: string
}

interface Row {
  [columnKey: string]: {
    text: string
  }
}

export const Default = () => {
  let [selectedIndices, setSelectedIndices] = useState([])
  let [columns, setColumns] = useState<Column[]>([
    {
      key: 'column0',
      width: 150,
      text: 'Column 0',
    },
    {
      key: 'column1',
      width: 200,
      text: 'Column 1',
    },
    {
      key: 'column2',
      width: 175,
      text: 'Column 2',
    },
    {
      key: 'column3',
      width: 150,
      text: 'Column 3',
    },
    {
      key: 'column4',
      width: 150,
      text: 'Column 4',
    },
  ])

  return (
    <ColumnList<Column, Row>
      style={{
        background: 'rgba(0, 0, 0, .1)',
      }}
      headerStyle={{
        background: 'rgba(0, 0, 0, .15)',
      }}
      height={400}
      rowHeight={40}
      rowCount={number('rowCount', 100)}
      columns={columns}
      allowColumnReorder={boolean('allowColumnReorder', true)}
      columnDragDataFormat="text/plain"
      selectable={boolean('selectable', true)}
      selectedIndices={selectedIndices}
      getRow={index => ({
        column0: {text: `Row ${index + 1}, Col 0`},
        column1: {text: `Row ${index + 1}, Col 1`},
        column2: {text: `Row ${index + 1}, Col 2`},
        column3: {text: `Row ${index + 1}, Col 3`},
        column4: {text: `Row ${index + 1}, Col 4`},
      })}
      renderColumnHeader={column => (
        <div
          key={column.key}
          draggable
          style={{
            boxSizing: 'border-box',
            width: column.width,
            borderRight: '1px solid rgba(0, 0, 0, .1)',
            padding: '0 .5rem',
            background: column.reordering
              ? 'rgba(0, 0, 0, .2)'
              : 'rgba(0, 0, 0, .1)',
            lineHeight: '40px',
          }}
          onDragStart={evt => column.onDragStart(column.key, evt)}
          onDragEnd={evt => column.onDragEnd(column.key, evt)}
        >
          {column.text}
        </div>
      )}
      renderRow={(props, i) => (
        <div
          key={props.key}
          style={{
            ...props.style,
            background: props.selected ? 'rgba(0, 0, 0, .1)' : undefined,
          }}
          onClick={evt => {
            action('Row.onClick')(evt)
            setSelectedIndices(
              evt.ctrlKey
                ? indices =>
                    indices.includes(i)
                      ? indices.filter(j => j !== i)
                      : [...indices, i]
                : [i]
            )
          }}
        >
          {props.children}
        </div>
      )}
      renderRowColumn={(item, column) => (
        <div
          key={column.key}
          style={{
            borderRight: '1px solid rgba(0, 0, 0, .1)',
            padding: '0 .5rem',
            overflow: 'hidden',
            lineHeight: '40px',
          }}
        >
          {item.text}
        </div>
      )}
      onColumnReorder={evt => {
        action('onColumnReorder')(evt)
        setColumns(evt.columns)
      }}
      onSelectedIndicesChange={evt => {
        action('onSelectedIndicesChange')(evt)
        setSelectedIndices(evt.selectedIndices)
      }}
    />
  )
}
