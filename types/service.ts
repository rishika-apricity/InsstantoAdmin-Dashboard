export interface Service {
  id: string
  name: string
  category: string
  description: string
  basePrice: number
  duration: number
  isActive: boolean
  rating: number
  totalBookings: number
  createdAt: string
  updatedAt: string
}

export interface ServiceCategory {
  id: string
  name: string
  description: string
  icon: string
  serviceCount: number
  isActive: boolean
}

export interface PricingRule {
  id: string
  serviceId: string
  type: "peak_hours" | "weekend" | "holiday" | "bulk_discount"
  multiplier: number
  conditions: Record<string, any>
  isActive: boolean
}
