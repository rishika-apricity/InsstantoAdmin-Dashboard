export interface RevenueData {
  month: string
  revenue: number
  bookings: number
  growth: number
}

export interface ServicePerformance {
  serviceName: string
  category: string
  bookings: number
  revenue: number
  rating: number
  completionRate: number
}

export interface OperationalMetrics {
  totalPartners: number
  activePartners: number
  averageResponseTime: number
  customerSatisfaction: number
  repeatCustomers: number
  cancellationRate: number
}

export interface MarketingMetrics {
  newCustomers: number
  customerAcquisitionCost: number
  lifetimeValue: number
  conversionRate: number
  organicTraffic: number
  paidTraffic: number
}
