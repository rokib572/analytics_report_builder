import { zValidator } from "@hono/zod-validator"

type ValidatorTarget = Parameters<typeof zValidator>[0]
type ValidatorSchema = Parameters<typeof zValidator>[1]

export const schemaValidator = (target: ValidatorTarget, schema: ValidatorSchema) =>
  zValidator(target, schema, (result, context) => {
    if (result.success) {
      return
    }

    const fields = result.error.issues.reduce<Record<string, string[]>>((acc, issue) => {
      const key = issue.path.length > 0 ? issue.path.join(".") : "form"
      const existing = acc[key] ?? []
      existing.push(issue.message)
      acc[key] = existing
      return acc
    }, {})

    return context.json(
      {
        success: false,
        error: "Validation failed",
        fields,
      },
      422,
    )
  })
