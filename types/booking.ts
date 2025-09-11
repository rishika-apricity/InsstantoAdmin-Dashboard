export interface Booking {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  partnerId: string
  partnerName: string
  serviceId: string
  serviceName: string
  serviceCategory: string
  bookingDate: string
  bookingTime: string
  duration: number
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled" | "rescheduled"
  priority: "low" | "medium" | "high" | "urgent"
  address: string
  city: string
  pincode: string
  totalAmount: number
  paidAmount: number
  paymentStatus: "pending" | "partial" | "paid" | "refunded"
  paymentMethod: "cash" | "card" | "upi" | "wallet"
  notes?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  rating?: number
  feedback?: string
}

export interface BookingStats {
  totalBookings: number
  pendingBookings: number
  confirmedBookings: number
  completedBookings: number
  cancelledBookings: number
  totalRevenue: number
  averageRating: number
  completionRate: number
}
