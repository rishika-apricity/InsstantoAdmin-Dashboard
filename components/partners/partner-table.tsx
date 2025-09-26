"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, MoreHorizontal, Eye, Edit, CheckCircle, XCircle, DollarSign, Pause } from "lucide-react"
import Link from "next/link"
import { collection, getDocs, query, where, doc } from "firebase/firestore"
import { getFirestoreDb } from "@/lib/firebase"

// Define Partner type
type Partner = {
  id: string
  display_name: string
  phone_number: string
  type: "provider" | "agency"
  city: string
  services: string[]
  joinDate: string
  rating: number
  reviewCount: number
  earnings: number
  pendingPayouts: number
  kycStatus: "verified" | "pending" | "rejected"
  status: "active" | "pending" | "suspended" | "rejected"
}

export function PartnerTable() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const db = getFirestoreDb()

        // Fetch partners
        const q1 = query(
          collection(db, "customer"),
          where("userType.provider", "==", true),
          where("partner_status", "==", "Onboarded")
        )
        const q2 = query(
          collection(db, "customer"),
          where("userType.AgencyPartner", "==", true),
          where("partner_status", "==", "Onboarded")
        )

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)])

        // Fetch Wallet data
        const walletSnap = await getDocs(collection(db, "Wallet_Overall"))
        const walletMap: Record<string, any> = {}
        walletSnap.forEach((doc) => {
          const d = doc.data()
          if (d.service_partner_id?.id) {
            walletMap[d.service_partner_id.id] = {
              earnings: d.TotalAmountComeIn_Wallet || 0,
              pendingPayouts: d.total_balance || 0,
            }
          }
        })

        const partnersData: Partner[] = []

        // Helper: compute average rating + count for a partner
        const getPartnerRating = async (partnerId: string) => {
          const reviewsQuery = query(
            collection(db, "reviews"),
            where("partnerId", "==", doc(db, "customer", partnerId))
          )
          const reviewsSnap = await getDocs(reviewsQuery)
          if (reviewsSnap.empty) return { avg: 0, count: 0 }

          let total = 0
          let count = 0
          reviewsSnap.forEach((review) => {
            const r = review.data()
            if (r.partnerRating) {
              total += r.partnerRating
              count++
            }
          })

          return { avg: count > 0 ? total / count : 0, count }
        }

        const pushPartner = async (doc: any, type: "provider" | "agency") => {
          const d = doc.data()
          const wallet = walletMap[doc.id] || { earnings: 0, pendingPayouts: 0 }

          const { avg, count } = await getPartnerRating(doc.id)

          partnersData.push({
            id: doc.id,
            display_name: d.display_name || "Unknown",
            phone_number: d.phone_number || "N/A",
            type,
            city: d.city || "N/A",
            services: d.services || [],
            joinDate: d.created_time || new Date().toISOString(),
            rating: avg,
            reviewCount: count,
            earnings: wallet.earnings,
            pendingPayouts: wallet.pendingPayouts,
            kycStatus: d.kyc_status || "pending",
            status: d.partner_status || "pending",
          })
        }

        // Process providers and agencies
        for (const doc of snap1.docs) {
          await pushPartner(doc, "provider")
        }
        for (const doc of snap2.docs) {
          await pushPartner(doc, "agency")
        }

        // Filter only allowed IDs
        const allowedIds = [
          "mwBcGMWLwDULHIS9hXx7JLuRfCi1",
          "Dmoo33tCx0OU1HMtapISBc9Oeeq2",
          "VxxapfO7l8YM5f6xmFqpThc17eD3",
        ]
        setPartners(partnersData.filter((p) => allowedIds.includes(p.id)))
      } catch (error) {
        console.error("Error fetching partners:", error)
      }
    }

    fetchPartners()
  }, [])

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      partner.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.phone_number.includes(searchTerm)

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "provider" && partner.type === "provider") ||
      (statusFilter === "agency" && partner.type === "agency")

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: Partner["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>
      case "rejected":
        return <Badge variant="outline">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getKycBadge = (status: Partner["kycStatus"]) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Partner Management</CardTitle>
        <CardDescription>Manage and monitor all service partners</CardDescription>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 pt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search partners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Filter: {statusFilter === "all" ? "All" : statusFilter === "provider" ? "Provider" : "Agency Partner"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("provider")}>Provider</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("agency")}>Agency Partner</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => (
                <TableRow key={partner.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{partner.display_name}</div>
                      <div className="text-sm text-muted-foreground">{partner.city}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{partner.phone_number}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {partner.services.slice(0, 2).map((service) => (
                        <Badge key={service} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                      {partner.services.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{partner.services.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(partner.joinDate)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Rating: {partner.rating.toFixed(1)}</span>
                        {partner.rating > 0 && <span className="text-yellow-500">★</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{partner.reviewCount} reviews</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{formatCurrency(partner.earnings)}</div>
                      {partner.pendingPayouts > 0 && (
                        <div className="text-xs text-secondary">Pending: {formatCurrency(partner.pendingPayouts)}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getKycBadge(partner.kycStatus)}</TableCell>
                  <TableCell>{getStatusBadge(partner.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/partners/${partner.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Partner
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Process Payout
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {partner.status === "pending" && (
                          <>
                            <DropdownMenuItem className="text-green-600">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve Partner
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject Partner
                            </DropdownMenuItem>
                          </>
                        )}
                        {partner.status === "active" && (
                          <DropdownMenuItem className="text-destructive">
                            <Pause className="mr-2 h-4 w-4" />
                            Suspend Partner
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredPartners.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No partners found matching your search criteria.</div>
        )}
      </CardContent>
    </Card>
  )
}
