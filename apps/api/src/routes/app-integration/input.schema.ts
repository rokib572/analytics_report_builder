import z from "zod"

export const schema = z.object({
  appName: z
    .string({ error: "App name is required" })
    .min(1, { error: "App name cannot be empty" }),
  appKey: z.string().optional(),
  appSecret: z
    .string({ error: "App secret is required" })
    .min(1, { error: "App secret cannot be empty" }),
  environment: z
    .string({ error: "Environment is required" })
    .min(1, { error: "Environment cannot be empty" }),
  isActive: z.boolean().default(true),
  label: z.string().optional(),
})
