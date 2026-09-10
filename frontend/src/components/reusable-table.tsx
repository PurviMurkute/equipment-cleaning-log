import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import type { ReactNode } from 'react'

export type TableColumn<T> = {
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => ReactNode
  className?: string
}

type ReusableTableProps<T> = {
  columns: TableColumn<T>[]
  data: T[]
  caption?: string
  emptyState?: string
}

function ReusableTable<T>({ columns, data, caption, emptyState = 'No rows found.' }: ReusableTableProps<T>) {
  return (
    <div className="w-full overflow-hidden">
      <Table>
        {caption ? <TableCaption>{caption}</TableCaption> : null}
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column.header} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => (
                  <TableCell key={column.header} className={column.className}>
                    {column.cell
                      ? column.cell(row)
                      : column.accessorKey
                        ? String(row[column.accessorKey] ?? '')
                        : null}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-8 text-center text-xs text-slate-500">
                {emptyState}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default ReusableTable
