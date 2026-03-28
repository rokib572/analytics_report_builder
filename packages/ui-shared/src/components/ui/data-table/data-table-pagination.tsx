import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select"
import { Button } from "../button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import type { PaginationInfo, PaginationState } from "./types"

type DataTablePaginationProps = {
  pagination: PaginationInfo
  onPaginationChange: (state: PaginationState) => void
  pageSizeOptions?: number[]
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

const getPageItems = (currentPage: number, totalPages: number): (number | "ellipsis")[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const items: (number | "ellipsis")[] = [1]

  if (currentPage > 3) {
    items.push("ellipsis")
  }

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  for (let i = start; i <= end; i++) {
    items.push(i)
  }

  if (currentPage < totalPages - 2) {
    items.push("ellipsis")
  }

  items.push(totalPages)

  return items
}

export const DataTablePagination = ({
  pagination,
  onPaginationChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: DataTablePaginationProps) => {
  const { page, limit, totalCount } = pagination
  const totalPages = Math.max(1, Math.ceil(totalCount / limit))
  const startRecord = totalCount === 0 ? 0 : (page - 1) * limit + 1
  const endRecord = Math.min(page * limit, totalCount)
  const pageItems = getPageItems(page, totalPages)

  const goToPage = (newPage: number) => {
    onPaginationChange({ page: newPage, limit })
  }

  const changePageSize = (newLimit: string) => {
    onPaginationChange({ page: 1, limit: Number(newLimit) })
  }

  return (
    <div className="flex flex-col gap-2 px-2 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select value={String(limit)} onValueChange={changePageSize}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">
          {totalCount === 0 ? "No records" : `${startRecord}-${endRecord} of ${totalCount}`}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => goToPage(1)}
          disabled={page <= 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageItems.map((item, index) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(item)}
            >
              {item}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => goToPage(totalPages)}
          disabled={page >= totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
