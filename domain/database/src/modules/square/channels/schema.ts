import { varchar, timestamp, unique, index } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { coreSchema, primaryKey, foreignKey } from "../../../db/base"
import { customers } from "../../customers/schema"

export const channels = coreSchema.table(
  "channels",
  {
    id: primaryKey(),
    customerId: foreignKey("customer_id")
      .notNull()
      .references(() => customers.id),
    squareSourceName: varchar("square_source_name", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique("channels_customer_source_name_unique").on(t.customerId, t.squareSourceName),
    index("channels_customer_id_idx").on(t.customerId),
  ],
)

export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  customerId: true,
  createdAt: true,
  updatedAt: true,
})

export const updateChannelSchema = createInsertSchema(channels)
  .partial()
  .omit({ id: true, customerId: true, squareSourceName: true, createdAt: true, updatedAt: true })

export const selectChannelSchema = createSelectSchema(channels)

export type ChannelPayload = ReturnType<typeof insertChannelSchema.parse>
export type UpdateChannelPayload = ReturnType<typeof updateChannelSchema.parse>
export type ChannelDto = ReturnType<typeof selectChannelSchema.parse>
