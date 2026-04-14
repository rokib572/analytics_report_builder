import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type CatalogDiscountDto, type CatalogDiscountPayload, catalogDiscounts } from "../schema"

export const upsertCatalogDiscount = async (
  db: DbClient,
  customerId: string,
  data: CatalogDiscountPayload,
): Promise<CatalogDiscountDto | undefined> => {
  const [discount] = await db
    .insert(catalogDiscounts)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: catalogDiscounts.squareId,
      set: {
        name: sql`excluded.name`,
        discountType: sql`excluded.discount_type`,
        percentage: sql`excluded.percentage`,
        amountMoney: sql`excluded.amount_money`,
        pinRequired: sql`excluded.pin_required`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
      },
      setWhere: sql`excluded.content_hash <> ${catalogDiscounts.contentHash}`,
    })
    .returning()

  return discount
}
