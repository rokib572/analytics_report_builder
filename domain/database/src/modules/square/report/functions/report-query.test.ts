import assert from "node:assert/strict"
import test from "node:test"
import { buildReportQuery } from "./report-query"

void test("buildReportQuery rejects pivot requests without metrics before touching the database", async () => {
  await assert.rejects(
    buildReportQuery({} as never, "customer-1", {
      metrics: [],
      rows: ["locationId"],
      columns: ["saleDate"],
      filters: [],
      chartType: "table",
      dateRange: {
        from: "2026-04-01",
        to: "2026-04-07",
      },
    }),
    (error) => {
      assert.equal((error as { code?: string }).code, "BAD_REQUEST")
      return true
    },
  )
})

void test("buildReportQuery rejects cross-mode pivots before executing a query", async () => {
  await assert.rejects(
    buildReportQuery({} as never, "customer-1", {
      metrics: ["netSales"],
      rows: ["paymentMethod"],
      columns: ["product"],
      filters: [],
      chartType: "table",
      dateRange: {
        from: "2026-04-01",
        to: "2026-04-07",
      },
    }),
    (error) => {
      assert.equal((error as { code?: string }).code, "BAD_REQUEST")
      return true
    },
  )
})

void test("buildReportQuery rejects product category with payment method before executing a query", async () => {
  await assert.rejects(
    buildReportQuery({} as never, "customer-1", {
      metrics: ["netSales"],
      rows: ["productCategory"],
      columns: [],
      filters: [{ dimension: "paymentMethod", operator: "eq", value: "CARD" }],
      chartType: "table",
      dateRange: {
        from: "2026-04-01",
        to: "2026-04-07",
      },
    }),
    (error) => {
      assert.equal((error as { code?: string }).code, "BAD_REQUEST")
      return true
    },
  )
})
