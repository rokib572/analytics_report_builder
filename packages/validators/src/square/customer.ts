import { z } from "zod"

export const listSquareCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  name: z.string().trim().min(1).optional(),
  phoneNumber: z.string().trim().min(1).optional(),
  emailAddress: z.string().trim().min(1).optional(),
  creationTimeFrom: z.coerce.date().optional(),
  creationTimeTo: z.coerce.date().optional(),
})

export type ListSquareCustomersQuery = z.infer<typeof listSquareCustomersQuerySchema>
