import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, TrendingUp, RefreshCw, AlertCircle, DollarSign } from "lucide-react"
import type { PaymentStats } from "@/types/payment"

interface PaymentStatsProps {
  stats: PaymentStats
}

export function PaymentStatsCards({ stats }: PaymentStatsProps) {
  const successRate = ((stats.successfulPayments / stats.totalPayments) * 100).toFixed(1)
  const refundRate = ((stats.refundedPayments / stats.totalPayments) * 100).toFixed(1)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          <CreditCard className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.totalPayments.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">All payment transactions</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Successful</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.successfulPayments.toLocaleString()}</div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {successRate}%
            </Badge>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.failedPayments.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Failed transactions</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Refunded</CardTitle>
          <RefreshCw className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.refundedPayments.toLocaleString()}</div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {refundRate}%
            </Badge>
            <p className="text-xs text-muted-foreground">Refund rate</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          <DollarSign className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">₹{stats.totalAmount.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Total transaction value</p>
        </CardContent>
      </Card>
    </div>
  )
}
