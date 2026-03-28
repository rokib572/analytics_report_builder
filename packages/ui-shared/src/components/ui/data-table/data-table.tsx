import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table"
import { Skeleton } from "../skeleton"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import { cn } from "../../../lib/utils"
import type { DataTableProps } from "./types"

const SKELETON_ROW_COUNT = 5

export const DataTable = <TData,>({
  columns,
  data,
  pagination,
  onPaginationChange,
  searchConfig,
  filterValues,
  onFilterChange,
  sorting,
  onSortingChange,
  isLoading = false,
  emptyMessage = "No results found.",
  onRowClick,
  pageSizeOptions,
}: DataTableProps<TData>) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    rowCount: pagination.totalCount,
  })

  const hasToolbar = searchConfig && searchConfig.length > 0 && filterValues && onFilterChange

  return (
    <div className="space-y-0">
      {hasToolbar && (
        <DataTableToolbar
          searchConfig={searchConfig}
          filterValues={filterValues}
          onFilterChange={onFilterChange}
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, {
                          ...header.getContext(),
                          sorting,
                          onSortingChange,
                        })}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={`skeleton-${rowIndex}-${colIndex}`}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  )
}
