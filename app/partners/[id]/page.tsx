"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore"
import { getFirestoreDb } from "@/lib/firebase"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Wallet,
  Star,
  FileText,
  ShoppingCart,
  CreditCard,
  Building2,
  DollarSign,
  Activity,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  BarChart3,
  Briefcase
} from "lucide-react"

// Import the section components
import { PartnerEarningsSection } from "./sections/partner-earnings"
import { PartnerBookingsSection } from "./sections/partner-bookings"
import { PartnerCreditsSection } from "./sections/partner-credits"
import { PartnerDocumentsSection } from "./sections/partner-documents"
import { PartnerChemicalsSection } from "./sections/partner-chemicals"
import { PartnerLoansSection } from "./sections/partner-loans"

type PartnerDoc = {
  id: string
  uid?: string
  email?: string
  display_name?: string
  customer_name?: string
  phone_number?: string
  contact_no?: number
  userType?: any
  created_time?: Timestamp
  city?: string
  photo_url?: string
  address?: any
  bio?: string
  partner_status?: string
  kyc_status?: string
  services?: string[]
  ratings_average?: number
  total_reviews?: number
}

type WalletDoc = {
  id: string
  service_partner_id?: any
  total_balance?: number
  TotalAmountComeIn_Wallet?: number
  pending_amount?: number
  last_payout_date?: Timestamp
  is_paid?: boolean
}

export default function PartnerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string
  const db = getFirestoreDb()

  // States
  const [partner, setPartner] = useState<PartnerDoc | null>(null)
  const [walletInfo, setWalletInfo] = useState<WalletDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [walletLoading, setWalletLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("earnings")

  // Fetch partner details
  useEffect(() => {
    const fetchPartner = async () => {
      if (!partnerId) return

      try {
        setLoading(true)
        const partnerDoc = await getDoc(doc(db, "customer", partnerId))

        if (partnerDoc.exists()) {
          const data = partnerDoc.data()
          if (data.userType?.provider || data.userType?.AgencyPartner) {
            setPartner({ id: partnerDoc.id, ...data } as PartnerDoc)
          } else {
            setError("This user is not a partner")
          }
        } else {
          setError("Partner not found")
        }
      } catch (err: any) {
        setError(err.message || "Failed to load partner details")
      } finally {
        setLoading(false)
      }
    }

    fetchPartner()
  }, [partnerId, db])

  // Fetch wallet information
  useEffect(() => {
    const fetchWalletInfo = async () => {
      if (!partner?.id) return

      try {
        setWalletLoading(true)

        const partnerRef = doc(db, "customer", partner.id)
        const walletQuery = query(
          collection(db, "Wallet_Overall"),
          where("service_partner_id", "==", partnerRef)
        )

        const snapshot = await getDocs(walletQuery)
        if (!snapshot.empty) {
          const [walletDoc] = snapshot.docs
          if (walletDoc) {
            setWalletInfo({ id: walletDoc.id, ...(walletDoc.data() as any) } as WalletDoc)
          }
        }
      } catch (err: any) {
        console.error("Failed to load wallet info:", err)
      } finally {
        setWalletLoading(false)
      }
    }

    fetchWalletInfo()
  }, [partner?.id, db])

  // Fetch reviews & ratings
  useEffect(() => {
    const fetchReviews = async () => {
      if (!partner?.id) return
      try {
        const partnerRef = doc(db, "customer", partner.id)
        const reviewsQuery = query(
          collection(db, "reviews"),
          where("partnerId", "==", partnerRef)
        )
        const snapshot = await getDocs(reviewsQuery)

        if (!snapshot.empty) {
          let total = 0
          let count = 0
          snapshot.forEach(doc => {
            const data = doc.data() as any
            if (typeof data.partnerRating === "number") {
              total += data.partnerRating
              count++
            }
          })
          const avg = count > 0 ? total / count : 0
          setPartner(prev => prev ? { ...prev, ratings_average: avg, total_reviews: count } : prev)
        } else {
          setPartner(prev => prev ? { ...prev, ratings_average: 0, total_reviews: 0 } : prev)
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err)
      }
    }

    fetchReviews()
  }, [partner?.id, db])

  // Helper functions
  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp?.toDate) return "—"
    return timestamp.toDate().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  }

  const formatCurrency = (amount?: number) => {
    if (typeof amount !== 'number') return "₹0"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getInitials = (name?: string) => {
    if (!name) return "P"
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'onboarded':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'suspended':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Suspended</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>
    }
  }

  const getKycBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'verified':
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="secondary">{status || "Not Submitted"}</Badge>
    }
  }

  const getPartnerType = () => {
    if (!partner?.userType) return "Unknown"
    if (partner.userType.provider && partner.userType.AgencyPartner) return "Provider & Agency"
    if (partner.userType.provider) return "Service Provider"
    if (partner.userType.AgencyPartner) return "Agency Partner"
    return "Unknown"
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <AdminSidebar />
          <div className="flex flex-col sm:gap-4 sm:py-4">
            <AdminHeader title="Partner Details" />
            <main className="flex-1 p-4 md:p-6">
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading partner details...</span>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !partner) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <AdminSidebar />
          <div className="flex flex-col sm:gap-4 sm:py-4">
            <AdminHeader title="Partner Details" />
            <main className="flex-1 p-4 md:p-6">
              <Card>
                <CardContent className="p-8 text-center">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-semibold mb-2">Partner Not Found</h3>
                  <p className="text-muted-foreground mb-4">{error || "The requested partner could not be found."}</p>
                  <Button onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                </CardContent>
              </Card>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AdminSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4">
          <AdminHeader title="Partner Management" />
          <main className="flex-1 space-y-6 p-4 md:p-6">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Partners
              </Button>
            </div>

            {/* Partner Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Avatar and Basic Info */}
                  <div className="flex flex-col items-center lg:items-start gap-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={partner.photo_url} alt={partner.display_name || partner.customer_name} />
                      <AvatarFallback className="text-lg">
                        {getInitials(partner.display_name || partner.customer_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center lg:text-left">
                      <h2 className="text-2xl font-bold">{partner.display_name || partner.customer_name || "Unknown Partner"}</h2>
                      <p className="text-muted-foreground">Partner ID: {partner.uid || partner.id}</p>
                      <div className="flex flex-col gap-2 mt-2">
                        <Badge variant="outline" className="w-fit">
                          <Building2 className="w-3 h-3 mr-1" />
                          {getPartnerType()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator orientation="vertical" className="hidden lg:block" />

                  {/* Contact and Status Information */}
                  <div className="flex-1 grid gap-6 lg:grid-cols-2">
                    {/* Contact Info */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Contact Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Email</p>
                            <p className="text-sm text-muted-foreground">{partner.email || "Not provided"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Phone</p>
                            <p className="text-sm text-muted-foreground">
                              {partner.phone_number || (partner.contact_no ? String(partner.contact_no) : "Not provided")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">City</p>
                            <p className="text-sm text-muted-foreground">{partner.city || "Not provided"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Joined</p>
                            <p className="text-sm text-muted-foreground">{formatDate(partner.created_time)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status and Performance */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Status & Performance</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Activity className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Partner Status</p>
                            {getStatusBadge(partner.partner_status)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">KYC Status</p>
                            {getKycBadge(partner.kyc_status)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Star className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Rating</p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{partner.ratings_average?.toFixed(1) || "0.0"}</span>
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-muted-foreground">({partner.total_reviews || 0} reviews)</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Wallet className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Current Balance</p>
                            <p className="text-sm font-bold">
                              {walletLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : formatCurrency(walletInfo?.total_balance || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services */}
                {partner.services && partner.services.length > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h4 className="font-medium mb-3">Services Offered</h4>
                      <div className="flex flex-wrap gap-2">
                        {partner.services.map((service, index) => (
                          <Badge key={index} variant="outline">{service}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Earnings</p>
                      <p className="text-2xl font-bold">{formatCurrency(walletInfo?.TotalAmountComeIn_Wallet || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Current Balance</p>
                      <p className="text-2xl font-bold">{formatCurrency(walletInfo?.total_balance || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Star className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Rating</p>
                      <p className="text-2xl font-bold">{partner.ratings_average?.toFixed(1) || "0.0"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Reviews</p>
                      <p className="text-2xl font-bold">{partner.total_reviews || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Sections */}
            <Card>
              <CardHeader>
                <CardTitle>Partner Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="earnings" className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span className="hidden sm:inline">Earnings</span>
                    </TabsTrigger>
                    <TabsTrigger value="bookings" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="hidden sm:inline">Bookings</span>
                    </TabsTrigger>
                    <TabsTrigger value="loans" className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span className="hidden sm:inline">Loans</span>
                    </TabsTrigger>
                    <TabsTrigger value="credits" className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="hidden sm:inline">Credits</span>
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">Documents</span>
                    </TabsTrigger>
                    <TabsTrigger value="chemicals" className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      <span className="hidden sm:inline">Chemicals</span>
                    </TabsTrigger>

                  </TabsList>

                  <TabsContent value="earnings" className="mt-6">
                    <PartnerEarningsSection partnerId={partnerId} />
                  </TabsContent>

                  <TabsContent value="bookings" className="mt-6">
                    <PartnerBookingsSection partnerId={partnerId} />
                  </TabsContent>
                  <TabsContent value="loans" className="mt-6">
                    <PartnerLoansSection partnerId={partnerId} />
                  </TabsContent>

                  <TabsContent value="credits" className="mt-6">
                    <PartnerCreditsSection partnerId={partnerId} />
                  </TabsContent>

                  <TabsContent value="documents" className="mt-6">
                    <PartnerDocumentsSection partnerId={partnerId} />
                  </TabsContent>

                  <TabsContent value="chemicals" className="mt-6">
                    <PartnerChemicalsSection partnerId={partnerId} />
                  </TabsContent>

                </Tabs>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
