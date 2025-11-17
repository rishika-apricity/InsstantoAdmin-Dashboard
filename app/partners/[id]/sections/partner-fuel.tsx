"use client"

import React, { useEffect, useState } from "react"
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore"
import { getFirestoreDb } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Fuel,
  Calendar,
  IndianRupee,
  FileText,
  Loader2,
  AlertCircle,
  Download,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type FuelExpense = {
  id: string
  bookingId: string
  bookingDate: Date
  partnerName: string
  billImage: string
  billAmount: number
  note: string
  billNumber: number
}

type PartnerFuelSectionProps = {
  partnerId: string
  fromDate?: string
  toDate?: string
}

export function PartnerFuelSection({ partnerId, fromDate, toDate }: PartnerFuelSectionProps) {
  const [expenses, setExpenses] = useState<FuelExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [totalExpense, setTotalExpense] = useState(0)
  const db = getFirestoreDb()

  useEffect(() => {
    const fetchFuelExpenses = async () => {
      if (!partnerId) return

      try {
        setLoading(true)
        setError("")
        const partnerRef = doc(db, "customer", partnerId)

        // Build query with date filters if provided
        let queryConstraints: any[] = [where("provider_id", "==", partnerRef)]

        if (fromDate && toDate) {
          const startDate = new Date(`${fromDate}T00:00:00`)
          const endDate = new Date(`${toDate}T23:59:59`)
          queryConstraints.push(where("date", ">=", Timestamp.fromDate(startDate)))
          queryConstraints.push(where("date", "<=", Timestamp.fromDate(endDate)))
        }

        const bookingsQuery = query(collection(db, "bookings"), ...queryConstraints)
        const bookingsSnapshot = await getDocs(bookingsQuery)

        const allExpenses: FuelExpense[] = []
        let total = 0

        bookingsSnapshot.forEach((bookingDoc) => {
          const bookingData = bookingDoc.data()
          const partnerFuel = bookingData.partnerFuel

          if (partnerFuel && Array.isArray(partnerFuel) && partnerFuel.length > 0) {
            const bookingDate = bookingData.timeSlot?.toDate() || new Date()
            const partnerName = bookingData.provider_name || "Unknown Partner"

            partnerFuel.forEach((fuel: any, index: number) => {
              if (fuel) {
                // First Bill
                if (fuel.FirstBill || fuel.FirstBillAmount) {
                  allExpenses.push({
                    id: `${bookingDoc.id}-${index}-1`,
                    bookingId: bookingDoc.id,
                    bookingDate,
                    partnerName,
                    billImage: fuel.FirstBill || "",
                    billAmount: fuel.FirstBillAmount || 0,
                    note: fuel.FirstNote || "",
                    billNumber: 1,
                  })
                  total += fuel.FirstBillAmount || 0
                }
                // Second Bill
                if (fuel.SecondBill || fuel.SecondBillAmount) {
                  allExpenses.push({
                    id: `${bookingDoc.id}-${index}-2`,
                    bookingId: bookingDoc.id,
                    bookingDate,
                    partnerName,
                    billImage: fuel.SecondBill || "",
                    billAmount: fuel.SecondBillAmount || 0,
                    note: fuel.SecondNote || "",
                    billNumber: 2,
                  })
                  total += fuel.SecondBillAmount || 0
                }
              }
            })
          }
        })

        // Sort by date
        allExpenses.sort((a, b) => b.bookingDate.getTime() - a.bookingDate.getTime())

        setExpenses(allExpenses)
        setTotalExpense(total)
      } catch (err: any) {
        console.error("Failed to fetch fuel expenses:", err)
        setError(err.message || "Failed to load fuel expenses")
      } finally {
        setLoading(false)
      }
    }

    fetchFuelExpenses()
  }, [partnerId, fromDate, toDate, db])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

  const handleViewBill = (imageUrl: string) => {
    if (imageUrl) window.open(imageUrl, "_blank")
  }

  // ✅ Export to CSV
  const handleExport = () => {
    if (expenses.length === 0) return

    const csvHeader = [
      "Date",
      "Booking ID",
      "Partner Name",
      "Bill #",
      "Amount",
      "Note",
      "Bill Image URL",
    ]
    const csvRows = expenses.map((exp) =>
      [
        formatDate(exp.bookingDate),
        exp.bookingId,
        exp.partnerName,
        exp.billNumber,
        exp.billAmount,
        `"${exp.note?.replace(/"/g, '""') || ""}"`,
        exp.billImage,
      ].join(",")
    )
    const csvContent = [csvHeader.join(","), ...csvRows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `PartnerFuelExpenses_${partnerId}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading fuel expenses...</span>
      </div>
    )

  if (error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Fuel className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Fuel Expenses
                </p>
                <p className="text-2xl font-bold">{formatCurrency(totalExpense)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bills</p>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <IndianRupee className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Average Per Bill
                </p>
                <p className="text-2xl font-bold">
                  {expenses.length > 0
                    ? formatCurrency(totalExpense / expenses.length)
                    : "₹0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Export Button + Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Fuel className="w-5 h-5" />
            Fuel Expense Details
          </CardTitle>

          {expenses.length > 0 && (
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <Fuel className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Fuel Expenses Found</h3>
              <p className="text-muted-foreground">
                {fromDate && toDate
                  ? "No fuel expenses recorded in the selected date range."
                  : "This partner has not submitted any fuel expenses yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-sm">Date</th>
                    <th className="text-left p-4 font-medium text-sm">Booking ID</th>
                    <th className="text-left p-4 font-medium text-sm">Bill #</th>
                    <th className="text-left p-4 font-medium text-sm">Amount</th>
                    <th className="text-left p-4 font-medium text-sm">Note</th>
                    <th className="text-right p-4 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {formatDate(expense.bookingDate)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {expense.bookingId.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">Bill {expense.billNumber}</Badge>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold">
                          {formatCurrency(expense.billAmount)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {expense.note || "—"}
                      </td>
                      <td className="p-4 text-right">
                        {expense.billImage ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBill(expense.billImage)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Bill
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No bill image
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}