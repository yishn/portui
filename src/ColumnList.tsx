import {
  createElement,
  createRef,
  Component,
  ReactNode,
  CSSProperties,
  Key,
  UIEvent,
  ReactChildren,
} from 'react'
import classnames from 'classnames'
import {PortuiComponentProps} from './main'
import VirtualizedList, {ItemProps as RowProps} from './VirtualizedList'
import ReorderableLinearFlex, {
  ItemData as ReorderableLinearFlexItemData,
  ItemProps as ColumnHeaderProps,
} from './ReorderableLinearFlex'

export interface ColumnData<R extends object>
  extends ReorderableLinearFlexItemData {
  key: keyof R & Key
  width: number
}

export interface ColumnListProps<C extends ColumnData<R>, R extends object>
  extends PortuiComponentProps {
  rowStyle?: CSSProperties
  headerStyle?: CSSProperties
  height: number
  rowHeight: number
  rowCount?: number
  columns?: C[]
  allowColumnsReorder?: boolean
  columnsDragDataFormat?: string

  getRow?: (index: number) => R | undefined
  renderColumnHeader?: (
    column: C & ColumnHeaderProps
  ) => Exclude<ReactNode, null | undefined>
  renderRowColumn?: (
    item: R[keyof R],
    column: C,
    index: number
  ) => Exclude<ReactNode, null | undefined>
  onColumnsReorder?: (evt: {column: C; columns: C[]}) => any
  onItemsVisibilityChange?: (evt: {
    visibleStartIndex: number
    visibleEndIndex: number
  }) => any
  onScroll?: (evt: UIEvent) => any
}

export default class ColumnList<
  C extends ColumnData<R>,
  R extends object
> extends Component<ColumnListProps<C, R>> {
  elementRef = createRef<HTMLDivElement>()

  handleColumnsReorder = (evt: {item: C; items: C[]}) => {
    this.props.onColumnsReorder?.({column: evt.item, columns: evt.items})
  }

  render() {
    let {props} = this
    let rowWidth =
      props.columns?.reduce((sum, column) => sum + column.width, 0) ?? 0
    let columnsGrid: CSSProperties = {
      display: 'grid',
      gridTemplate: `100% / ${
        props.columns?.map(column => `${column.width}px`)?.join(' ') ?? '100%'
      } 1fr`,
      minWidth: rowWidth,
    }

    return (
      <div
        ref={this.elementRef}
        id={props.id}
        className={classnames('portui-column-list', props.className)}
        style={{
          ...props.style,
          position: 'relative',
          height: props.height,
          display: 'grid',
          gridTemplate: '100% / 100%',
        }}
      >
        <VirtualizedList<R | {}>
          className="portui-rows"
          mainAxisSize={props.height}
          itemSize={props.rowHeight}
          itemCount={(props.rowCount ?? 0) + 1}
          stickyItemCount={1}
          getItem={i => (i === 0 ? {} : props.getRow?.(i - 1))}
          renderItem={(row, i) =>
            i === 0 ? (
              <ReorderableLinearFlex<C>
                key="portui-columnheaders"
                className="portui-columnheaders"
                style={{
                  ...row.style,
                  minWidth: rowWidth,
                  ...props.headerStyle,
                }}
                allowReorder={props.allowColumnsReorder}
                dragDataFormat={props.columnsDragDataFormat}
                items={props.columns}
                renderItem={props.renderColumnHeader}
                onReorder={this.handleColumnsReorder}
              />
            ) : (
              <div
                key={i - 1}
                className="portui-row"
                style={{
                  ...row.style,
                  ...columnsGrid,
                  ...props.rowStyle,
                }}
              >
                {props.columns?.map(column =>
                  props.renderRowColumn?.((row as R)[column.key], column, i - 1)
                )}
              </div>
            )
          }
          onScroll={props.onScroll}
        />
      </div>
    )
  }
}
