import { z } from "zod"

export const RequestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
})
