export const escapeLikePattern = (value: string): string => {
  return value.replace(/[\\%_]/g, "\\$&")
}

export const toContainsIlike = (value: string): string => {
  return `%${escapeLikePattern(value)}%`
}
