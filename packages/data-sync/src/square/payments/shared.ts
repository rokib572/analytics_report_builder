import type { PaymentPayload } from "@analytics/database"
import type { Square } from "square"
import { computeContentHash } from "../../utils/content-hash"

const toBigInt = (money?: { amount?: bigint | null }): bigint | null =>
  money?.amount !== undefined && money?.amount !== null ? BigInt(money.amount) : null

export const sumProcessingFees = (
  processingFees?: Square.ProcessingFee[] | null,
): bigint | null => {
  if (!processingFees || processingFees.length === 0) {
    return null
  }

  return processingFees.reduce<bigint>(
    (sum, fee) => sum + BigInt(fee.amountMoney?.amount ?? 0),
    BigInt(0),
  )
}

export const computePaymentContentHash = (payment: Square.Payment): string => {
  const hashInput = {
    id: payment.id,
    locationId: payment.locationId,
    status: payment.status,
    sourceType: payment.sourceType,
    amountMoney: payment.amountMoney?.amount,
    tipMoney: payment.tipMoney?.amount,
    totalMoney: payment.totalMoney?.amount,
    processingFee: payment.processingFee,
    cardDetails: payment.cardDetails,
    riskEvaluation: payment.riskEvaluation,
    updatedAt: payment.updatedAt,
  }

  return computeContentHash(hashInput as Record<string, unknown>)
}

export const mapPaymentPayload = (
  payment: Square.Payment,
  internalLocationId: string,
  contentHash: string,
): PaymentPayload => ({
  locationId: internalLocationId,
  squareId: payment.id ?? "",
  orderId: payment.orderId ?? null,
  status: payment.status ?? "PENDING",
  sourceType: payment.sourceType ?? null,
  amountMoney: toBigInt(payment.amountMoney),
  tipMoney: toBigInt(payment.tipMoney),
  totalMoney: toBigInt(payment.totalMoney),
  appFeeMoney: toBigInt(payment.appFeeMoney),
  refundedMoney: toBigInt(payment.refundedMoney),
  processingFeeMoney: sumProcessingFees(payment.processingFee),
  cardBrand: payment.cardDetails?.card?.cardBrand ?? null,
  cardLast4: payment.cardDetails?.card?.last4 ?? null,
  cardEntryMethod: payment.cardDetails?.entryMethod ?? null,
  riskLevel: payment.riskEvaluation?.riskLevel ?? null,
  squareCustomerId: payment.customerId ?? null,
  teamMemberId: payment.teamMemberId ?? null,
  deviceId: payment.deviceDetails?.deviceId ?? null,
  applicationId: payment.applicationDetails?.applicationId ?? null,
  receiptUrl: payment.receiptUrl ?? null,
  contentHash,
  createdAt: new Date(payment.createdAt ?? new Date().toISOString()),
  updatedAt: new Date(payment.updatedAt ?? payment.createdAt ?? new Date().toISOString()),
})
