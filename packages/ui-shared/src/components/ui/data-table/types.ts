import type { ColumnDef } from "@tanstack/react-table"

// --- Pagination ---
export type PaginationState = { page: number; limit: number }
export type PaginationInfo = { page: number; limit: number; totalCount: number }

// --- Sorting ---
export type SortingState = { field: string; direction: "asc" | "desc" } | null

// --- Search/Filter Config ---
export type TextSearchConfig = {
  type: "text"
  field: string
  placeholder?: string
}

export type SelectSearchConfig = {
  type: "select"
  field: string
  label?: string
  options: Array<{ label: string; value: string }>
  placeholder?: string
}

export type DateRangeSearchConfig = {
  type: "date-range"
  fieldFrom: string
  fieldTo: string
  label?: string
}

export type SearchConfig = TextSearchConfig | SelectSearchConfig | DateRangeSearchConfig

// --- Props ---
export type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  pagination: PaginationInfo
  onPaginationChange: (state: PaginationState) => void
  searchConfig?: SearchConfig[]
  filterValues?: Record<string, string>
  onFilterChange?: (filters: Record<string, string>) => void
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (row: TData) => void
  pageSizeOptions?: number[]
}
