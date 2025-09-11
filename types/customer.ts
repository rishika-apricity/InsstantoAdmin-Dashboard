export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  city: string
  signupDate: string
  lastBookingDate: string | null
  totalBookings: number
  totalSpent: number
  lifetimeValue: number
  averageRating: number
  status: "active" | "inactive" | "blocked"
  tags: string[]
  notes: string
}

export interface CustomerBooking {
  id: string
  serviceId: string
  serviceName: string
  partnerId: string
  partnerName: string
  date: string
  amount: number
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled"
  rating?: number
  review?: string
}

export interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  newThisMonth: number
  averageLifetimeValue: number
  topSpendingCustomers: Customer[]
  recentSignups: Customer[]
}
