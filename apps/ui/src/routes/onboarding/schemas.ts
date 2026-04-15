import { z } from "zod"
import { OnboardingSchema } from "@analytics/validators"

export const OnboardingFormSchema = OnboardingSchema.extend({
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const businessTypes = [
  "Restaurant",
  "Retail",
  "Service",
  "E-commerce",
  "Healthcare",
  "Education",
  "Other",
]

export const businessSizes = ["1-5 employees", "6-20 employees", "21-50 employees", "50+ employees"]
