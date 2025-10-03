"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { getFirestoreDb } from "@/lib/firebase"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Wallet, 
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  History,
  TrendingUp,
  Users,
  Loader2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

type CustomerDoc = {
  id: string
  uid?: string
  email?: string
  display_name?: string
  customer_name?: string
  phone_number?: string
  contact_no?: number
  userType?: any
  created_time?: Timestamp
  edited_time?: Timestamp
  location?: any
  photo_url?: string
  address?: any
  bio?: string
  referralBy?: string
  Subscription?: string
}

type BookingDoc = {
  id: string
  customer_id?: any // DocumentReference to customer
  provider_id?: any // DocumentReference to customer (service provider)
  status?: string
  date?: Timestamp
  timeSlot?: Timestamp
  subCategoryCart_id?: any // DocumentReference
  service_id?: string
  package_id?: string
  amount_paid?: number
  otp?: number
  address?: any
  checkoutItems?: any[] // Array of service items
  cartClone_id?: any
  itemOptions_id?: string
}

type WalletDoc = {
  id: string
  service_partner_id?: any // DocumentReference to customer
  user_type?: any
  credit_balance?: number
  expiryDate?: Timestamp
  WalletBonusStatus?: string
}

type ServiceInfo = {
  serviceName?: string
  subCategoryName?: string
}

const PAGE_SIZE = 10

export default function CustomerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  const db = getFirestoreDb()

  // States
  const [customer, setCustomer] = useState<CustomerDoc | null>(null)
  const [bookings, setBookings] = useState<BookingDoc[]>([])
  const [walletInfo, setWalletInfo] = useState<WalletDoc | null>(null)
  const [servicesMap, setServicesMap] = useState<Record<string, ServiceInfo>>({})
  const [loading, setLoading] = useState(true)
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [walletLoading, setWalletLoading] = useState(true)
  const [error, setError] = useState("")

  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch customer details
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) return
      
      try {
        setLoading(true)
        const customerDoc = await getDoc(doc(db, "customer", customerId))
        
        if (customerDoc.exists()) {
          setCustomer({ id: customerDoc.id, ...customerDoc.data() } as CustomerDoc)
        } else {
          setError("Customer not found")
        }
      } catch (err: any) {
        setError(err.message || "Failed to load customer details")
      } finally {
        setLoading(false)
      }
    }

    fetchCustomer()
  }, [customerId, db])

  // Fetch customer bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!customer?.id) return

      try {
        setBookingsLoading(true)
        
        // Create customer reference
        const customerRef = doc(db, "customer", customer.id)
        
        // Query bookings where customer_id references this customer
        const bookingsQuery = query(
          collection(db, "bookings"),
          where("customer_id", "==", customerRef),
          orderBy("date", "desc")
        )

        const snapshot = await getDocs(bookingsQuery)
        const bookingDocs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BookingDoc[]

        setBookings(bookingDocs)
        
        // Fetch service information for bookings
        await fetchServicesInfo(bookingDocs)
        
      } catch (err: any) {
        console.error("Failed to load bookings:", err)
        // If orderBy fails, try without it
        try {
          const customerRef = doc(db, "customer", customer.id)
          const fallbackQuery = query(
            collection(db, "bookings"),
            where("customer_id", "==", customerRef)
          )
          const snapshot = await getDocs(fallbackQuery)
          const bookingDocs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as BookingDoc[]
          
          // Sort manually
          bookingDocs.sort((a, b) => {
            const dateA = a.date?.toDate?.() || new Date(0)
            const dateB = b.date?.toDate?.() || new Date(0)
            return dateB.getTime() - dateA.getTime()
          })
          
          setBookings(bookingDocs)
          await fetchServicesInfo(bookingDocs)
        } catch (fallbackErr) {
          console.error("Fallback query also failed:", fallbackErr)
        }
      } finally {
        setBookingsLoading(false)
      }
    }

    fetchBookings()
  }, [customer?.id, db])

  // Fetch wallet information
  useEffect(() => {
    const fetchWalletInfo = async () => {
      if (!customer?.id) return

      try {
        setWalletLoading(true)
        
        // Create customer reference
        const customerRef = doc(db, "customer", customer.id)
        
        // Query partner_overall_credits where service_partner_id references this customer
        try {
          const walletQuery = query(
            collection(db, "partner_overall_credits"),
            where("service_partner_id", "==", customerRef)
          )
        const snapshot = await getDocs(walletQuery)
        if (!snapshot.empty) {
          const [walletDoc] = snapshot.docs
          if (walletDoc) {
            setWalletInfo({ id: walletDoc.id, ...(walletDoc.data() as any) } as WalletDoc)
          }
        }} catch (walletErr) {
          console.error("Error fetching wallet from partner_overall_credits:", walletErr)
        }
        
      } catch (err: any) {
        console.error("Failed to load wallet info:", err)
      } finally {
        setWalletLoading(false)
      }
    }

    fetchWalletInfo()
  }, [customer?.id, db])

  // Fetch service information for bookings
  const fetchServicesInfo = async (bookingDocs: BookingDoc[]) => {
    try {
      const serviceRefs = bookingDocs
        .map(b => b.subCategoryCart_id)
        .filter(Boolean)

      if (serviceRefs.length === 0) return

      const uniqueRefs = Array.from(new Set(serviceRefs.map(ref => ref?.path || ref)))
      const servicesInfo: Record<string, ServiceInfo> = {}

      await Promise.all(
        uniqueRefs.map(async (refPath) => {
          try {
            let docRef
            if (typeof refPath === 'string' && refPath.includes('/')) {
              docRef = doc(db, refPath)
            } else {
              docRef = doc(db, "sub_categoryCart", refPath)
            }
            
            const serviceDoc = await getDoc(docRef)
            
            if (serviceDoc.exists()) {
              const data = serviceDoc.data()
              servicesInfo[refPath] = {
                serviceName: data.serviceName || data.service_name || "Unknown Service",
                subCategoryName: data.subCategoryName || data.sub_category_name || ""
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch service for ${refPath}:`, error)
            servicesInfo[refPath] = { serviceName: "Unknown Service" }
          }
        })
      )

      setServicesMap(servicesInfo)
    } catch (error) {
      console.error("Error fetching services info:", error)
    }
  }

  // Helper functions
  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp?.toDate) return "—"
    return timestamp.toDate().toLocaleString()
  }

  const formatCurrency = (amount?: number) => {
    if (typeof amount !== 'number') return "₹0"
    return `₹${amount.toLocaleString()}`
  }

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
      case 'confirmed':
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800"><AlertCircle className="w-3 h-3 mr-1" />Confirmed</Badge>
      case 'in-progress':
        return <Badge className="bg-purple-100 text-purple-800"><AlertCircle className="w-3 h-3 mr-1" />In Progress</Badge>
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const getServiceInfo = (booking: BookingDoc): ServiceInfo => {
    const refPath = booking.subCategoryCart_id?.path || booking.subCategoryCart_id
    if (!refPath) return { serviceName: "Unknown Service" }
    return servicesMap[refPath] || { serviceName: "Unknown Service" }
  }

  const getServicesFromCheckoutItems = (booking: BookingDoc): string[] => {
    if (!booking.checkoutItems || !Array.isArray(booking.checkoutItems)) {
      const serviceInfo = getServiceInfo(booking)
      return serviceInfo.serviceName ? [serviceInfo.serviceName] : ["Unknown Service"]
    }
    
    return booking.checkoutItems.map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        return item.serviceName || item.service_name || `Service ${index + 1}`
      }
      return `Service ${index + 1}`
    })
  }

  // Filter and search logic
  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    
    return bookings.filter((booking) => {
      const services = getServicesFromCheckoutItems(booking)
      const serviceNames = services.join(" ")
      
      const text = [
        booking.id,
        booking.status,
        serviceNames,
        booking.otp?.toString(),
      ]
        .map(v => (v ?? "").toString().toLowerCase())
        .join(" ")

      const matchesSearch = !term || text.includes(term)
      const matchesStatus = statusFilter === "all" || booking.status?.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [bookings, searchTerm, statusFilter])

  // Pagination
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    const endIndex = startIndex + PAGE_SIZE
    return filteredBookings.slice(startIndex, endIndex)
  }, [filteredBookings, currentPage])

  const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  // Pagination handlers
  const goNext = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const goPrev = () => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1)
    }
  }

  // Calculate statistics
  const totalBookings = bookings.length
  const completedBookings = bookings.filter(b => b.status?.toLowerCase() === 'service_completed').length
  const totalSpent = bookings
    .filter(b => b.status?.toLowerCase() === 'service_completed')
    .reduce((sum, b) => sum + (b.amount_paid || 0), 0)

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <AdminSidebar />
          <div className="flex flex-col sm:gap-4 sm:py-4">
            <AdminHeader title="Customer Details" />
            <main className="flex-1 p-4 md:p-6">
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading customer details...</span>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !customer) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <AdminSidebar />
          <div className="flex flex-col sm:gap-4 sm:py-4">
            <AdminHeader title="Customer Details" />
            <main className="flex-1 p-4 md:p-6">
              <Card>
                <CardContent className="p-8 text-center">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-semibold mb-2">Customer Not Found</h3>
                  <p className="text-muted-foreground mb-4">{error || "The requested customer could not be found."}</p>
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
          <AdminHeader title="Customer Details" />
          <main className="flex-1 space-y-6 p-4 md:p-6">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Customers
              </Button>
            </div>

            {/* Customer Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar and Basic Info */}
                  <div className="flex flex-col items-center md:items-start gap-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={customer.photo_url} alt={customer.display_name || customer.customer_name} />
                      <AvatarFallback className="text-lg">
                        {getInitials(customer.display_name || customer.customer_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center md:text-left">
                      <h2 className="text-2xl font-bold">{customer.display_name || customer.customer_name || "Unknown Customer"}</h2>
                      <p className="text-muted-foreground">Customer ID: {customer.uid || customer.id}</p>
                      {customer.Subscription === "Active" && (
                        <Badge className="mt-2 bg-green-100 text-green-800">
                          <Star className="w-3 h-3 mr-1" />
                          Premium Member
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Separator orientation="vertical" className="hidden md:block" />

                  {/* Contact Information */}
                  <div className="flex-1 grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">{customer.email || "Not provided"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Phone</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.phone_number || (customer.contact_no ? String(customer.contact_no) : "Not provided")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Member Since</p>
                          <p className="text-sm text-muted-foreground">{formatDate(customer.created_time)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Referred By</p>
                          <p className="text-sm text-muted-foreground">{customer.referralBy || "Direct signup"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {customer.bio && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h4 className="font-medium mb-2">Bio</h4>
                      <p className="text-sm text-muted-foreground">{customer.bio}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Bookings</p>
                      <p className="text-2xl font-bold">{totalBookings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Completed</p>
                      <p className="text-2xl font-bold">{completedBookings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Spent</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Wallet className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Wallet Balance</p>
                      <p className="text-2xl font-bold">
                        {walletLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatCurrency(walletInfo?.credit_balance || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bookings History */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Booking History ({filteredBookings.length} total)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                  <div className="flex flex-1 items-center space-x-2">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search bookings, services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Results info */}
                {(searchTerm || statusFilter !== "all") && (
                  <div className="mb-4 text-sm text-muted-foreground">
                    Showing {filteredBookings.length} results
                    {searchTerm && ` for "${searchTerm}"`}
                    {statusFilter !== "all" && ` with status "${statusFilter}"`}
                  </div>
                )}

                {bookingsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Loading bookings...
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all" 
                        ? "No bookings found matching your criteria." 
                        : "No bookings found for this customer."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Booking ID</TableHead>
                            <TableHead>Services</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time Slot</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>OTP</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedBookings.map((booking) => {
                            const services = getServicesFromCheckoutItems(booking)
                            
                            return (
                              <TableRow key={booking.id}>
                                <TableCell className="font-medium">{booking.id}</TableCell>
                                <TableCell className="max-w-[200px]">
                                  <div className="space-y-1">
                                    {services.map((service, index) => (
                                      <div key={index} className="text-xs">
                                        <span className="font-medium">{service}</span>
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">{formatDate(booking.date)}</TableCell>
                                <TableCell className="text-sm">{formatDate(booking.timeSlot)}</TableCell>
                                <TableCell>{getStatusBadge(booking.status)}</TableCell>
                                <TableCell className="font-medium">{formatCurrency(booking.amount_paid)}</TableCell>
                                <TableCell className="font-mono">{booking.otp || "—"}</TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages || 1}
                        {filteredBookings.length > 0 && (
                          <span className="ml-2">
                            ({((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, filteredBookings.length)} of {filteredBookings.length})
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={goPrev} 
                          disabled={!hasPrevPage || bookingsLoading}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" /> 
                          Prev
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={goNext} 
                          disabled={!hasNextPage || bookingsLoading}
                        >
                          Next 
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}