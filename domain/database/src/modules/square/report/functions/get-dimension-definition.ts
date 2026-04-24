import { DomainError } from "@analytics/shared-libs"
import type { Dimension } from "@analytics/report-builder"
import type { DimensionDefinition } from "./type"

export const getDimensionDefinition = (
  dimensionMap: Partial<Record<Dimension, DimensionDefinition>>,
  dimension: Dimension,
) => {
  const definition = dimensionMap[dimension]

  if (!definition) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: `Dimension ${dimension} is not available for this report query`,
      clientSafeMessage: `Dimension "${dimension}" is not available for this report.`,
      additionalContext: { dimension },
    })
  }

  return definition
}
