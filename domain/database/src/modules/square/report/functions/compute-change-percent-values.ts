export const computeChangePercentValues = (
  laterValues: Record<string, string | number | null>,
  earlierValues: Record<string, string | number | null>,
): Record<string, string | number | null> => {
  const percentValues: Record<string, string | number | null> = {}
  const allKeys = new Set([...Object.keys(laterValues), ...Object.keys(earlierValues)])

  for (const key of allKeys) {
    const laterNumeric = Number(laterValues[key] ?? 0)
    const earlierNumeric = Number(earlierValues[key] ?? 0)

    if (earlierNumeric === 0) {
      percentValues[key] = null
      continue
    }

    percentValues[key] = ((laterNumeric - earlierNumeric) / earlierNumeric) * 100
  }

  return percentValues
}
