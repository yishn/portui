import {
  createElement,
  createRef,
  Component,
  ReactNode,
  CSSProperties,
  Key,
  UIEvent,
  HTMLAttributes,
  RefObject,
} from 'react'
import {PortuiComponentProps} from './main'
import VirtualizedList, {ItemProps} from './VirtualizedList'
import ReorderableLinearFlex, {
  ItemData as ReorderableLinearFlexItemData,
  ItemProps as ColumnHeaderProps,
} from './ReorderableLinearFlex'
import {wedgeNumber} from './helper'

export interface ColumnData<R extends object>
  extends ReorderableLinearFlexItemData {
  key: keyof R & Key
  width: number
}

export interface RowProps extends ItemProps {
  key: Key
  style: CSSProperties
  children: ReactNode[]
  selected: boolean
}

export interface ColumnListProps<C extends ColumnData<R>, R extends object>
  extends PortuiComponentProps<HTMLAttributes<HTMLDivElement>> {
  headerStyle?: CSSProperties
  height: number
  rowHeight: number
  rowCount?: number
  columns?: C[]
  allowColumnsReorder?: boolean
  columnsDragDataFormat?: string
  selectable?: boolean
  selectedIndices?: number[]

  getRow?: (index: number) => R | undefined
  renderColumnHeader?: (
    column: C & ColumnHeaderProps
  ) => Exclude<ReactNode, null | undefined>
  renderRow?: (
    props: RowProps,
    index: number
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
  onSelectedIndicesChange?: (evt: {selectedIndices: number[]}) => any
  onScroll?: (evt: UIEvent) => any
  onKeyDown?: (evt: KeyboardEvent) => any
}

export default class ColumnList<
  C extends ColumnData<R>,
  R extends object
> extends Component<ColumnListProps<C, R>> {
  componentRef = createRef<VirtualizedList<{} | R>>()

  get elementRef(): RefObject<HTMLDivElement> {
    return this.componentRef.current?.elementRef ?? createRef()
  }

  handleColumnsReorder = (evt: {item: C; items: C[]}) => {
    this.props.onColumnsReorder?.({column: evt.item, columns: evt.items})
  }

  handleSelectedIndicesChange = (evt: {selectedIndices: number[]}) => {
    this.props.onSelectedIndicesChange?.({
      selectedIndices: evt.selectedIndices.map(i =>
        wedgeNumber(i - 1, 0, (this.props.rowCount ?? 0) - 1)
      ),
    })
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
      <VirtualizedList<R | {}>
        ref={this.componentRef}
        id={props.id}
        className="portui-column-list"
        style={props.style}
        innerProps={props.innerProps}
        mainAxisSize={props.height}
        itemSize={props.rowHeight}
        itemCount={(props.rowCount ?? 0) + 1}
        stickyItemCount={1}
        selectable={props.selectable}
        selectedIndices={props.selectedIndices?.map(i => i + 1)}
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
            props.renderRow?.(
              {
                ...row,
                key: i - 1,
                style: {
                  ...row.style,
                  ...columnsGrid,
                },
                selected: !!props.selectedIndices?.includes(i - 1),
                children:
                  props.columns?.map(column =>
                    props.renderRowColumn?.(
                      (row as R)[column.key],
                      column,
                      i - 1
                    )
                  ) ?? [],
              },
              i - 1
            )
          )
        }
        onSelectedIndicesChange={this.handleSelectedIndicesChange}
        onScroll={props.onScroll}
      />
    )
  }
}
