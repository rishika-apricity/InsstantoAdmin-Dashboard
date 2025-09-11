export interface Payment {
  id: string
  orderId: string
  paymentId: string
  customerId: string
  customerName: string
  customerEmail: string
  amount: number
  currency: string
  status: "successful" | "failed" | "refund" | "settled" | "in_progress"
  method: string
  createdAt: string
  updatedAt: string
  bookingId: string
  serviceType: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  refundId?: string
  refundAmount?: number
  settlementId?: string
  timeline: PaymentTimelineEvent[]
}

export interface PaymentTimelineEvent {
  id: string
  type: "created" | "updated" | "refund_initiated" | "refund_processed" | "settled" | "failed"
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface PaymentStats {
  totalPayments: number
  successfulPayments: number
  failedPayments: number
  refundedPayments: number
  totalAmount: number
  refundedAmount: number
  pendingSettlements: number
}
