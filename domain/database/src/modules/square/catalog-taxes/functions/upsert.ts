import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type CatalogTaxDto, type CatalogTaxPayload, catalogTaxes } from "../schema"

export const upsertCatalogTax = async (
  db: DbClient,
  customerId: string,
  data: CatalogTaxPayload,
): Promise<CatalogTaxDto | undefined> => {
  const [tax] = await db
    .insert(catalogTaxes)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: catalogTaxes.squareId,
      set: {
        name: sql`excluded.name`,
        percentage: sql`excluded.percentage`,
        inclusionType: sql`excluded.inclusion_type`,
        appliesToCustomAmounts: sql`excluded.applies_to_custom_amounts`,
        enabled: sql`excluded.enabled`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
      },
      setWhere: sql`excluded.content_hash <> ${catalogTaxes.contentHash}`,
    })
    .returning()

  return tax
}
