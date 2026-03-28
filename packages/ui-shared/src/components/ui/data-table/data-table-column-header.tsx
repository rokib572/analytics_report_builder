import type { Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { Button } from "../button"
import { cn } from "../../../lib/utils"
import type { SortingState } from "./types"

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>
  title: string
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  className?: string
}

export const DataTableColumnHeader = <TData, TValue>({
  column,
  title,
  sorting,
  onSortingChange,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) => {
  if (!onSortingChange || !column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  const field = column.id
  const isActive = sorting?.field === field
  const direction = isActive ? sorting.direction : null

  const handleClick = () => {
    if (!direction) {
      onSortingChange({ field, direction: "asc" })
    } else if (direction === "asc") {
      onSortingChange({ field, direction: "desc" })
    } else {
      onSortingChange(null)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8 data-[state=open]:bg-accent", className)}
      onClick={handleClick}
    >
      {title}
      {direction === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : direction === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  )
}
