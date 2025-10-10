// app/admin/customers/[id]/sections/customer-referrals.tsx
"use client"

import React, { useEffect, useState, useMemo } from "react"
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore"
import { getFirestoreDb } from "@/lib/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar,
  Loader2,
  Users,
  DollarSign,
  Search,
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
  referralCode?: string
  Subscription?: string
}

type BookingDoc = {
  id: string
  customer_id?: any
  provider_id?: any
  status?: string
  date?: Timestamp
  timeSlot?: Timestamp
  subCategoryCart_id?: any
  service_id?: string
  package_id?: string
  amount_paid?: number
  otp?: number
  address?: any
  checkoutItems?: any[]
  cartClone_id?: any
  itemOptions_id?: string
}

const PAGE_SIZE = 5

interface CustomerReferralsTabProps {
  customer: CustomerDoc
}

export function CustomerReferralsTab({ customer }: CustomerReferralsTabProps) {
  const db = getFirestoreDb()
  
  const [referredCustomers, setReferredCustomers] = useState<CustomerDoc[]>([])
  const [referredBookings, setReferredBookings] = useState<Record<string, BookingDoc[]>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch referred customers and their bookings
  useEffect(() => {
    const fetchReferrals = async () => {
      if (!customer?.id) return

      try {
        setLoading(true)
        
        // Get this customer's referral code
        const referralCode = customer.referralCode
        
        if (!referralCode) {
          console.log("Customer has no referral code")
          setReferredCustomers([])
          setLoading(false)
          return
        }
        
        // Fetch customers who used this customer's referral code
        const referralsQuery = query(
          collection(db, "customer"),
          where("referralBy", "==", referralCode)
        )

        const snapshot = await getDocs(referralsQuery)
        const referred = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CustomerDoc[]
        
        setReferredCustomers(referred)

        // Fetch bookings for each referred customer
        const bookingsMap: Record<string, BookingDoc[]> = {}
        
        await Promise.all(
          referred.map(async (ref) => {
            try {
              const refCustomerRef = doc(db, "customer", ref.id)
              const bookingsQuery = query(
                collection(db, "bookings"),
                where("customer_id", "==", refCustomerRef)
              )
              
              const bookingsSnapshot = await getDocs(bookingsQuery)
              bookingsMap[ref.id] = bookingsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as BookingDoc[]
            } catch (err) {
              console.error(`Failed to fetch bookings for ${ref.id}:`, err)
              bookingsMap[ref.id] = []
            }
          })
        )
        
        setReferredBookings(bookingsMap)
        
      } catch (err: any) {
        console.error("Failed to load referral data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchReferrals()
  }, [customer?.id, customer?.referralCode, db])

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp?.toDate) return "—"
    return timestamp.toDate().toLocaleString()
  }

  const formatCurrency = (amount?: number) => {
    if (typeof amount !== 'number') return "₹0"
    return `₹${amount.toLocaleString()}`
  }

  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  // Calculate referral statistics
  const totalReferrals = referredCustomers.length
  const totalReferralBookings = Object.values(referredBookings).reduce((sum, bookings) => sum + bookings.length, 0)
  const totalReferralEarnings = Object.values(referredBookings)
    .flat()
    .filter(b => b.status?.toLowerCase() === 'completed' || b.status?.toLowerCase() === 'service_completed')
    .reduce((sum, b) => sum + (b.amount_paid || 0), 0)

  // Filter referred customers
  const filteredReferredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    
    if (!term) return referredCustomers
    
    return referredCustomers.filter((refCustomer) => {
      const text = [
        refCustomer.id,
        refCustomer.display_name,
        refCustomer.customer_name,
        refCustomer.email,
        refCustomer.phone_number,
        refCustomer.contact_no?.toString(),
      ]
        .map(v => (v ?? "").toString().toLowerCase())
        .join(" ")

      return text.includes(term)
    })
  }, [referredCustomers, searchTerm])

  // Pagination
  const paginatedReferredCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    const endIndex = startIndex + PAGE_SIZE
    return filteredReferredCustomers.slice(startIndex, endIndex)
  }, [filteredReferredCustomers, currentPage])

  const totalPages = Math.ceil(filteredReferredCustomers.length / PAGE_SIZE)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Referral Summary</h3>
      </div>

      {/* Referral Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Referrals</p>
                <p className="text-2xl font-bold">{totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Referral Bookings</p>
                <p className="text-2xl font-bold">{totalReferralBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Referral Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalReferralEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      {referredCustomers.length > 0 && (
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search referred customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      )}

      {/* Results info */}
      {searchTerm && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredReferredCustomers.length} results for "{searchTerm}"
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading referrals...
        </div>
      ) : referredCustomers.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            This customer hasn't referred anyone yet.
          </p>
        </div>
      ) : filteredReferredCustomers.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No referred customers found matching your search.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedReferredCustomers.map((refCustomer) => {
              const customerBookings = referredBookings[refCustomer.id] || []
              const completedCount = customerBookings.filter(b => 
                b.status?.toLowerCase() === 'completed' || b.status?.toLowerCase() === 'service_completed'
              ).length
              const totalSpent = customerBookings
                .filter(b => b.status?.toLowerCase() === 'completed' || b.status?.toLowerCase() === 'service_completed')
                .reduce((sum, b) => sum + (b.amount_paid || 0), 0)

              return (
                <Card key={refCustomer.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={refCustomer.photo_url} alt={refCustomer.display_name || refCustomer.customer_name} />
                          <AvatarFallback>
                            {getInitials(refCustomer.display_name || refCustomer.customer_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">
                            {refCustomer.display_name || refCustomer.customer_name || "Unknown Customer"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {refCustomer.email || "No email"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {refCustomer.phone_number || (refCustomer.contact_no ? String(refCustomer.contact_no) : "No phone")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Joined: {formatDate(refCustomer.created_time)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center md:text-right">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Bookings</p>
                          <p className="text-lg font-bold">{customerBookings.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Completed</p>
                          <p className="text-lg font-bold text-green-600">{completedCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Spent</p>
                          <p className="text-lg font-bold">{formatCurrency(totalSpent)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
                {filteredReferredCustomers.length > 0 && (
                  <span className="ml-2">
                    ({((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, filteredReferredCustomers.length)} of {filteredReferredCustomers.length})
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => hasPrevPage && setCurrentPage(p => p - 1)} 
                  disabled={!hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> 
                  Prev
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => hasNextPage && setCurrentPage(p => p + 1)}
                  disabled={!hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}