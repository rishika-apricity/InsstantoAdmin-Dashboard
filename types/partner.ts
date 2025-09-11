export interface Partner {
  id: string
  name: string
  email: string
  phone: string
  city: string
  areas: string[]
  services: string[]
  joinDate: string
  status: "pending" | "active" | "suspended" | "rejected"
  kycStatus: "pending" | "verified" | "rejected"
  rating: number
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  earnings: number
  pendingPayouts: number
  onTimePercentage: number
  acceptanceRate: number
  documents: PartnerDocument[]
  subscription: PartnerSubscription
  compliance: ComplianceStatus
}

export interface PartnerDocument {
  id: string
  type: "aadhar" | "pan" | "license" | "insurance" | "photo"
  name: string
  status: "pending" | "verified" | "rejected"
  uploadDate: string
  verifiedDate?: string
  rejectionReason?: string
}

export interface PartnerSubscription {
  plan: "basic" | "premium" | "enterprise"
  startDate: string
  endDate: string
  slots: number
  usedSlots: number
  monthlyFee: number
  status: "active" | "expired" | "suspended"
}

export interface ComplianceStatus {
  backgroundCheck: "pending" | "completed" | "failed"
  trainingCompleted: boolean
  insuranceValid: boolean
  licenseValid: boolean
  lastAuditDate?: string
  complianceScore: number
}

export interface PartnerPayout {
  id: string
  partnerId: string
  amount: number
  period: string
  status: "pending" | "processing" | "completed" | "failed"
  requestDate: string
  processedDate?: string
  razorpayOrderId?: string
  failureReason?: string
}

export interface PartnerPerformance {
  partnerId: string
  period: string
  bookings: number
  revenue: number
  rating: number
  onTimeDelivery: number
  customerSatisfaction: number
  repeatCustomers: number
}
