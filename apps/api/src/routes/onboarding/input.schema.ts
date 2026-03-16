import z from "zod"

export const schema = z.object({
  companyName: z.string().min(1),
  businessType: z.string().min(1),
  businessSize: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
})
