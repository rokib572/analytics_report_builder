import { z } from "zod"

export const IdParamSchema = z.object({
  id: z.string().length(26, { error: "Invalid ID: must be a 26-character ULID" }),
})

export type IdParam = z.infer<typeof IdParamSchema>
