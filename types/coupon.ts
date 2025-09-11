export interface Coupon {
  id: string
  code: string
  title: string
  description: string
  type: "percentage" | "fixed" | "free_service"
  value: number
  minOrderValue: number
  maxDiscount?: number
  usageLimit: number
  usedCount: number
  validFrom: string
  validUntil: string
  isActive: boolean
  applicableServices: string[]
  createdAt: string
}

export interface CouponUsage {
  id: string
  couponId: string
  customerId: string
  bookingId: string
  discountAmount: number
  usedAt: string
}
