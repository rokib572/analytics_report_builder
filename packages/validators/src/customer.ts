import { z } from "zod"

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Customer = z.infer<typeof CustomerSchema>
