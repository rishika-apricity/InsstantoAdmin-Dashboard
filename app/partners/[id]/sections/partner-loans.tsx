"use client"

import React, { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore"
import { getFirestoreDb } from "@/lib/firebase"
import {
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

type LoanBooking = {
  bookingName: string
  partnerfare: number
  bookingDate: Timestamp
  loanAmount: number
  loanPercentage: number
  bookingid: string
}

type LoanData = {
  id: string
  loanAmount: number
  loanStatus: string
  amountPaid: number
  loanRecoveryPercentage: number
  loanStartDate?: Timestamp
  kitName?: string
  kit_amount?: number
  bookingDetails?: LoanBooking[]
  LoanRemainingAmount: number
  loanRecoveredAmount: number
}

interface PartnerLoansSectionProps {
  partnerId: string
}

export function PartnerLoansSection({ partnerId }: PartnerLoansSectionProps) {
  const db = getFirestoreDb()
  const [loan, setLoan] = useState<LoanData | null>(null)
  const [loading, setLoading] = useState(true)

  // pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 8

  useEffect(() => {
    const fetchLoansData = async () => {
      try {
        setLoading(true)

        const partnerRef = doc(db, "customer", partnerId)
        const loansQuery = query(
          collection(db, "PartnerKitLoan"),
          where("partnerId", "==", partnerRef)
        )
        const snapshot = await getDocs(loansQuery)

        if (!snapshot.empty) {
          const [loanDoc] = snapshot.docs
          if (loanDoc) {
            const data = loanDoc.data() as any
            setLoan({
              id: loanDoc.id,
              loanAmount: data.loanAmount || 0,
              loanStatus: data.loanStatus || "active",
              amountPaid: data.amountPaid || 0,
              loanRecoveryPercentage: data.loanRecoveryPercentage || 0,
              loanStartDate: data.loanStartDate,
              kitName: data.kitName,
              kit_amount: data.kit_amount,
              bookingDetails: data.bookingDetails || [],
              LoanRemainingAmount: data.LoanRemainingAmount || 0,
              loanRecoveredAmount: data.loanRecoveredAmount || 0,
            })
          }
        }
      } catch (error) {
        console.error("Error fetching loan data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (partnerId) {
      fetchLoansData()
    }
  }, [partnerId, db])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)

  const formatDate = (timestamp?: Timestamp) =>
    timestamp?.toDate
      ? timestamp.toDate().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—"

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Active
          </Badge>
        )
      case "closed":
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Closed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Pending
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // sort bookings by date (latest first)
  const sortedBookings = useMemo(() => {
    if (!loan?.bookingDetails) return []
    return [...loan.bookingDetails].sort((a, b) => {
      const dateA = a.bookingDate?.toDate?.() || new Date(0)
      const dateB = b.bookingDate?.toDate?.() || new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
  }, [loan?.bookingDetails])

  // paginate sorted bookings
  const totalPages = Math.ceil(sortedBookings.length / rowsPerPage)
  const paginatedBookings = sortedBookings.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading loan data...
      </div>
    )
  }

  if (!loan) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No loan found for this partner.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Loan Status */}
      <div className="flex justify-end">
        {getStatusBadge(loan.loanStatus)}
      </div>

      {/* Loan Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Loan Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(loan.loanAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Recovered Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(loan.loanRecoveredAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Remaining Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(loan.LoanRemainingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Start Date & %</p>
                <p className="text-2xl font-bold">
                  {formatDate(loan.loanStartDate)} | {loan.loanRecoveryPercentage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan Deduction Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Deduction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {!sortedBookings.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No deduction records found.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {/* <TableHead>Booking Name</TableHead> */}
                      <TableHead>Date</TableHead>
                      <TableHead>Partner Fare</TableHead>
                      <TableHead>Loan Deducted</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Booking ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBookings.map((b, i) => (
                      <TableRow key={i}>
                        {/* <TableCell>{b.bookingName}</TableCell> */}
                        <TableCell>{formatDate(b.bookingDate)}</TableCell>
                        <TableCell>{formatCurrency(b.partnerfare)}</TableCell>
                        <TableCell>{formatCurrency(b.loanAmount)}</TableCell>
                        <TableCell>{b.loanPercentage}%</TableCell>
                        <TableCell>{b.bookingid}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
