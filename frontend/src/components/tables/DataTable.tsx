import * as React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils'

interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  globalFilter?: string
  pageSize?: number
  selectable?: boolean
  onRowClick?: (row: TData) => void
  emptyMessage?: string
}

export function DataTable<TData>({
  data,
  columns,
  globalFilter = '',
  pageSize = 20,
  selectable = false,
  onRowClick,
  emptyMessage = 'No results found.',
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const selectionColumn: ColumnDef<TData, unknown> = {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        aria-label="Select all rows"
        className="rounded border-border-default text-accent-primary focus:ring-accent-primary"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
        className="rounded border-border-default text-accent-primary focus:ring-accent-primary"
      />
    ),
    size: 40,
    enableSorting: false,
  }

  const table = useReactTable({
    data,
    columns: selectable ? [selectionColumn, ...columns] : columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="space-y-3">
      {selectable && selectedCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs">
          <span className="font-semibold text-accent-primary">{selectedCount} selected</span>
          <Button variant="ghost" size="sm" onClick={() => setRowSelection({})} className="h-6 px-2 text-2xs">
            Clear Selection
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-border-subtle bg-bg-primary overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary/70 border-b border-border-subtle">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    const sorted = header.column.getIsSorted()
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          'px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap',
                          canSort && 'cursor-pointer select-none hover:text-text-primary transition-colors',
                        )}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                      >
                        <div className="flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="text-text-muted">
                              {sorted === 'asc' ? (
                                <ChevronUp className="h-3.5 w-3.5 text-accent-primary" />
                              ) : sorted === 'desc' ? (
                                <ChevronDown className="h-3.5 w-3.5 text-accent-primary" />
                              ) : (
                                <ChevronsUpDown className="h-3.5 w-3.5 opacity-40 hover:opacity-100" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border-subtle bg-bg-primary">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center text-text-muted text-sm">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'transition-colors duration-150',
                      onRowClick && 'cursor-pointer hover:bg-hover',
                      row.getIsSelected() && 'bg-amber-500/5',
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-text-secondary">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle bg-bg-secondary/40 text-xs text-text-muted">
          <span>
            {table.getFilteredRowModel().rows.length} total rows
            {selectedCount > 0 && ` · ${selectedCount} selected`}
          </span>
          <div className="flex items-center gap-3">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
