import type { RefundPayload } from "@analytics/database"
import type { Square } from "square"
import { computeContentHash } from "../../utils/content-hash"
import { sumProcessingFees } from "../payments/shared"

const toBigInt = (money?: { amount?: bigint | null }): bigint | null =>
  money?.amount !== undefined && money?.amount !== null ? BigInt(money.amount) : null

export const computeRefundContentHash = (refund: Square.PaymentRefund): string => {
  const hashInput = {
    id: refund.id,
    paymentId: refund.paymentId,
    status: refund.status,
    amountMoney: refund.amountMoney?.amount,
    destinationType: refund.destinationType,
    processingFee: refund.processingFee,
    updatedAt: refund.updatedAt,
  }

  return computeContentHash(hashInput as Record<string, unknown>)
}

export const mapRefundPayload = (
  refund: Square.PaymentRefund,
  internalLocationId: string,
  contentHash: string,
  squareCustomerId: string | null,
): RefundPayload => ({
  locationId: internalLocationId,
  squareId: refund.id,
  paymentId: refund.paymentId ?? null,
  orderId: refund.orderId ?? null,
  status: refund.status ?? "PENDING",
  amountMoney: BigInt(refund.amountMoney.amount ?? 0),
  appFeeMoney: toBigInt(refund.appFeeMoney),
  processingFeeMoney: sumProcessingFees(refund.processingFee),
  reason: refund.reason ?? null,
  destinationType: refund.destinationType ?? null,
  unlinked: refund.unlinked ?? false,
  teamMemberId: refund.teamMemberId ?? null,
  squareCustomerId,
  contentHash,
  createdAt: new Date(refund.createdAt ?? new Date().toISOString()),
  updatedAt: new Date(refund.updatedAt ?? refund.createdAt ?? new Date().toISOString()),
})
