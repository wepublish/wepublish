import 'rsuite-table'

declare module 'rsuite-table' {
  type RowDataType<T = {[key: string]: any}> = {
    dataKey?: string
    children?: RowDataType[]
  } & T
}
