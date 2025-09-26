"use client"

import React, { useEffect, useState } from "react"
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
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  Plus,
  Minus,
  Loader2,
  AlertCircle
} from "lucide-react"

type CreditTransaction = {
  id: string
  credit_balance?: number
  user_type?: any
  expiryDate?: Timestamp
  WalletBonusStatus?: string
  transaction_date?: Timestamp
  amount?: number
  type?: 'purchase' | 'spend' | 'bonus' | 'refund'
  description?: string
}

interface PartnerCreditsSectionProps {
  partnerId: string
}

export function PartnerCreditsSection({ partnerId }: PartnerCreditsSectionProps) {
  const db = getFirestoreDb()
  const [creditData, setCreditData] = useState<CreditTransaction | null>(null)
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCreditsData = async () => {
      try {
        setLoading(true)

        const partnerRef = doc(db, "customer", partnerId)

        // Fetch current credit balance
        const creditsQuery = query(
          collection(db, "partner_overall_credits"),
          where("service_partner_id", "==", partnerRef)
        )
        const creditsSnapshot = await getDocs(creditsQuery)

        if (!creditsSnapshot.empty) {
          const creditDoc = creditsSnapshot.docs[0]
          if (creditDoc) {
            const data = creditDoc.data()
            setCreditData({
              id: creditDoc.id,
              credit_balance: data.credit_balance || 0,
              user_type: data.user_type,
              expiryDate: data.expiryDate,
              WalletBonusStatus: data.WalletBonusStatus,
              transaction_date: data.Timestamp
            })
          }
        }

        // Mock credit transaction history
        const mockHistory: CreditTransaction[] = [
          {
            id: "ct001",
            amount: 5000,
            type: 'purchase',
            description: 'Credit purchase via online payment',
            transaction_date: Timestamp.fromDate(new Date(Date.now() - 86400000 * 2))
          },
          {
            id: "ct002",
            amount: -1200,
            type: 'spend',
            description: 'Chemical purchase - Pesticides',
            transaction_date: Timestamp.fromDate(new Date(Date.now() - 86400000 * 5))
          },
          {
            id: "ct003",
            amount: 1000,
            type: 'bonus',
            description: 'Welcome bonus credits',
            transaction_date: Timestamp.fromDate(new Date(Date.now() - 86400000 * 10))
          },
          {
            id: "ct004",
            amount: -800,
            type: 'spend',
            description: 'Chemical purchase - Fertilizers',
            transaction_date: Timestamp.fromDate(new Date(Date.now() - 86400000 * 15))
          }
        ]

        setCreditHistory(mockHistory)

      } catch (error) {
        console.error("Error fetching credits data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (partnerId) {
      fetchCreditsData()
    }
  }, [partnerId, db])

  const formatCurrency = (amount?: number) => {
    if (typeof amount !== 'number') return "₹0"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Math.abs(amount))
  }

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp?.toDate) return "—"
    return timestamp.toDate().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (type?: string, amount?: number) => {
    if (!amount) return <CreditCard className="w-4 h-4 text-gray-500" />
    if (amount > 0) return <Plus className="w-4 h-4 text-green-600" />
    return <Minus className="w-4 h-4 text-red-600" />
  }

  const getTransactionBadge = (type?: string) => {
    switch (type) {
      case 'purchase':
        return <Badge className="bg-blue-100 text-blue-800">Purchase</Badge>
      case 'spend':
        return <Badge className="bg-red-100 text-red-800">Spend</Badge>
      case 'bonus':
        return <Badge className="bg-green-100 text-green-800">Bonus</Badge>
      case 'refund':
        return <Badge className="bg-yellow-100 text-yellow-800">Refund</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const totalPurchases = creditHistory.filter(t => (t.amount || 0) > 0).reduce((sum, t) => sum + (t.amount || 0), 0)
  const totalSpends = Math.abs(creditHistory.filter(t => (t.amount || 0) < 0).reduce((sum, t) => sum + (t.amount || 0), 0))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading credits data...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Credits Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(creditData?.credit_balance || 0)}</p>
                {creditData?.expiryDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Expires: {formatDate(creditData.expiryDate)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPurchases)}</p>
                <p className="text-xs text-muted-foreground mt-1">Credits bought</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spends</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpends)}</p>
                <p className="text-xs text-muted-foreground mt-1">Credits used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Status */}
      {creditData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Credit Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Account Type</span>
                  <Badge variant="outline">
                    {creditData.user_type?.provider ? "Provider" :
                      creditData.user_type?.AgencyPartner ? "Agency" : "Unknown"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Bonus Status</span>
                  <Badge
                    variant={creditData.WalletBonusStatus === "Active" ? "default" : "secondary"}
                    className={creditData.WalletBonusStatus === "Active" ? "bg-green-100 text-green-800" : ""}
                  >
                    {creditData.WalletBonusStatus || "Inactive"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Credit Balance</span>
                  <span className="font-bold text-lg">{formatCurrency(creditData.credit_balance || 0)}</span>
                </div>
                {creditData.expiryDate && (
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Expiry Date</span>
                    <span className="text-sm">{formatDate(creditData.expiryDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Credit Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {creditHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No credit transactions found.</p>
              <p className="text-xs mt-2">Credit purchase and spending history will appear here.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance Effect</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditHistory.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(transaction.transaction_date)}
                      </TableCell>
                      <TableCell>{getTransactionBadge(transaction.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.type, transaction.amount)}
                          <span>{transaction.description || "Credit transaction"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(transaction.amount || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={(transaction.amount || 0) > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                          {(transaction.amount || 0) > 0 ? "+" : ""}{formatCurrency(transaction.amount || 0)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Management Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Credits
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Adjust Balance
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Extend Expiry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
