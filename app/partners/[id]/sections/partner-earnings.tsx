"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts"
import {
    collection,
    doc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
} from "firebase/firestore"
import { getFirestoreDb } from "@/lib/firebase"
import {
    DollarSign,
    TrendingUp,
    Calendar,
    Download,
    Loader2,
    ArrowUpIcon,
    ArrowDownIcon,
    CreditCard,
    Wallet,
    History
} from "lucide-react"

type EarningsData = {
    id: string
    amount: number
    date: Timestamp
    booking_id?: string
    type: 'booking' | 'bonus' | 'referral' | 'adjustment'
    status: 'completed' | 'pending' | 'cancelled'
    description?: string
    customer_name?: string
}

type PayoutData = {
    id: string
    amount: number
    date: Timestamp
    status: 'processed' | 'pending' | 'failed'
    method: 'bank_transfer' | 'upi' | 'check'
    reference?: string
}

interface PartnerEarningsSectionProps {
    partnerId: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export function PartnerEarningsSection({ partnerId }: PartnerEarningsSectionProps) {
    const db = getFirestoreDb()
    const [earnings, setEarnings] = useState<EarningsData[]>([])
    const [payouts, setPayouts] = useState<PayoutData[]>([])
    const [loading, setLoading] = useState(true)
    const [timeFilter, setTimeFilter] = useState("30")
    const [totalEarnings, setTotalEarnings] = useState(0)
    const [currentBalance, setCurrentBalance] = useState(0)
    const [pendingPayouts, setPendingPayouts] = useState(0)
    const [monthlyGrowth, setMonthlyGrowth] = useState(0)

    useEffect(() => {
        const fetchEarningsData = async () => {
            try {
                setLoading(true)

                const partnerRef = doc(db, "customer", partnerId)

                // Fetch wallet info
                const walletQuery = query(
                    collection(db, "Wallet_Overall"),
                    where("service_partner_id", "==", partnerRef)
                )
                const walletSnapshot = await getDocs(walletQuery)

                if (!walletSnapshot.empty) {
                    const walletData = walletSnapshot.docs[0]?.data()
                    if (walletData) {
                        setTotalEarnings(walletData.TotalAmountComeIn_Wallet || 0)
                        setCurrentBalance(walletData.total_balance || 0)
                        setPendingPayouts(walletData.pending_amount || 0)
                    }
                }

                // Fetch bookings for earnings
                let bookingsQuery
                try {
                    bookingsQuery = query(
                        collection(db, "bookings"),
                        where("provider_id", "==", partnerRef),
                        where("status", "==", "completed"),
                        orderBy("date", "desc")
                    )
                } catch {
                    bookingsQuery = query(
                        collection(db, "bookings"),
                        where("provider_id", "==", partnerRef),
                        where("status", "==", "completed")
                    )
                }

                const bookingsSnapshot = await getDocs(bookingsQuery)
                const earningsData: EarningsData[] = []
                const customerPromises: Promise<any>[] = []

                bookingsSnapshot.forEach(bookingDoc => {
                    const booking = bookingDoc.data()
                    if (booking.amount_paid && booking.amount_paid > 0) {
                        const partnerEarning = booking.amount_paid * 0.8
                        earningsData.push({
                            id: bookingDoc.id,
                            amount: partnerEarning,
                            date: booking.date || Timestamp.now(),
                            booking_id: bookingDoc.id,
                            type: 'booking',
                            status: 'completed',
                            description: `Service booking payment`
                        })

                        if (booking.customer_id) {
                            const customerPromise = getDocs(query(
                                collection(db, "customer"),
                                where("__name__", "==", booking.customer_id?.id || "")
                            )).then(snapshot => {
                                if (!snapshot.empty) {
                                    const customerData = snapshot.docs[0]?.data()
                                    return {
                                        bookingId: bookingDoc.id,
                                        name: customerData?.display_name || customerData?.customer_name || "Unknown"
                                    }
                                }
                                return { bookingId: bookingDoc.id, name: "Unknown" }
                            }).catch(() => ({ bookingId: bookingDoc.id, name: "Unknown" }))

                            customerPromises.push(customerPromise)
                        }
                    }
                })

                const customerResults = await Promise.all(customerPromises)
                const customerMap = customerResults.reduce((map, result) => {
                    map[result.bookingId] = result.name
                    return map
                }, {} as Record<string, string>)

                earningsData.forEach(earning => {
                    if (earning.booking_id && customerMap[earning.booking_id]) {
                        earning.customer_name = customerMap[earning.booking_id]
                        earning.description = `Service for ${customerMap[earning.booking_id]}`
                    }
                })

                earningsData.sort((a, b) => {
                    const dateA = a.date?.toDate?.() || new Date(0)
                    const dateB = b.date?.toDate?.() || new Date(0)
                    return dateB.getTime() - dateA.getTime()
                })

                const bonusEarnings: EarningsData[] = [
                    {
                        id: "bonus001",
                        amount: 500,
                        date: Timestamp.fromDate(new Date(Date.now() - 86400000 * 7)),
                        type: 'bonus',
                        status: 'completed',
                        description: 'Monthly performance bonus'
                    },
                    {
                        id: "referral001",
                        amount: 200,
                        date: Timestamp.fromDate(new Date(Date.now() - 86400000 * 14)),
                        type: 'referral',
                        status: 'completed',
                        description: 'New partner referral bonus'
                    }
                ]

                const allEarnings = [...earningsData, ...bonusEarnings]
                setEarnings(allEarnings)

                const mockPayouts: PayoutData[] = [
                    {
                        id: "payout001",
                        amount: 15000,
                        date: Timestamp.fromDate(new Date(Date.now() - 86400000 * 10)),
                        status: 'processed',
                        method: 'bank_transfer',
                        reference: 'TXN123456789'
                    },
                    {
                        id: "payout002",
                        amount: 8000,
                        date: Timestamp.fromDate(new Date(Date.now() - 86400000 * 40)),
                        status: 'processed',
                        method: 'upi',
                        reference: 'UPI987654321'
                    }
                ]

                setPayouts(mockPayouts)

                const currentMonth = allEarnings.filter(e => {
                    const earningDate = e.date.toDate()
                    const now = new Date()
                    return earningDate.getMonth() === now.getMonth() &&
                        earningDate.getFullYear() === now.getFullYear()
                }).reduce((sum, e) => sum + e.amount, 0)

                const lastMonth = allEarnings.filter(e => {
                    const earningDate = e.date.toDate()
                    const lastMonthDate = new Date()
                    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1)
                    return earningDate.getMonth() === lastMonthDate.getMonth() &&
                        earningDate.getFullYear() === lastMonthDate.getFullYear()
                }).reduce((sum, e) => sum + e.amount, 0)

                if (lastMonth > 0) {
                    setMonthlyGrowth(((currentMonth - lastMonth) / lastMonth) * 100)
                }

            } catch (error) {
                console.error("Error fetching earnings data:", error)
            } finally {
                setLoading(false)
            }
        }

        if (partnerId) {
            fetchEarningsData()
        }
    }, [partnerId, db, timeFilter])

    const generateMonthlyEarnings = (earnings: EarningsData[]) => {
        const monthlyData: { [key: string]: number } = {}
        earnings.forEach(earning => {
            const month = earning.date.toDate().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short'
            })
            monthlyData[month] = (monthlyData[month] || 0) + earning.amount
        })
        return Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })).slice(-6)
    }

    const generateEarningsBreakdown = (earnings: EarningsData[]) => {
        const breakdown = earnings.reduce((acc, earning) => {
            acc[earning.type] = (acc[earning.type] || 0) + earning.amount
            return acc
        }, {} as Record<string, number>)
        return Object.entries(breakdown).map(([type, amount]) => ({
            name: type.charAt(0).toUpperCase() + type.slice(1),
            value: amount
        }))
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (timestamp: Timestamp) => {
        return timestamp.toDate().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        })
    }

    const chartData = generateMonthlyEarnings(earnings)
    const pieData = generateEarningsBreakdown(earnings)

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading earnings data...
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Earnings Overview Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalEarnings)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    {monthlyGrowth >= 0 ? (
                                        <ArrowUpIcon className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <ArrowDownIcon className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className={`text-xs ${monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}% from last month
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Wallet className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                                <p className="text-2xl font-bold">{formatCurrency(currentBalance)}</p>
                                <p className="text-xs text-muted-foreground mt-1">Available for withdrawal</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <CreditCard className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pending Payouts</p>
                                <p className="text-2xl font-bold">{formatCurrency(pendingPayouts)}</p>
                                <p className="text-xs text-muted-foreground mt-1">Processing payments</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(
                                        earnings
                                            .filter(e => {
                                                const earningDate = e.date.toDate()
                                                const now = new Date()
                                                return earningDate.getMonth() === now.getMonth() &&
                                                    earningDate.getFullYear() === now.getFullYear()
                                            })
                                            .reduce((sum, e) => sum + e.amount, 0)
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Current month earnings</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Earnings Trend
                        </CardTitle>
                        <Select value={timeFilter} onValueChange={setTimeFilter}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">7 Days</SelectItem>
                                <SelectItem value="30">30 Days</SelectItem>
                                <SelectItem value="90">90 Days</SelectItem>
                                <SelectItem value="365">1 Year</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value) => [formatCurrency(value as number), "Earnings"]} />
                                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Earnings Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [formatCurrency(value as number)]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Earnings Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Recent Earnings
                    </CardTitle>
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </CardHeader>
                <CardContent>
                    {earnings.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No earnings data found for this partner.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {earnings.slice(0, 10).map((earning) => (
                                        <TableRow key={earning.id}>
                                            <TableCell className="font-mono text-sm">
                                                {formatDate(earning.date)}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{earning.description}</p>
                                                    {earning.booking_id && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Booking: {earning.booking_id.slice(0, 12)}...
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {earning.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={earning.status === 'completed' ? 'default' : 'secondary'}
                                                    className={
                                                        earning.status === 'completed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : earning.status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-red-100 text-red-800'
                                                    }
                                                >
                                                    {earning.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(earning.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payout History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Payout History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {payouts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No payout history found.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payouts.map((payout) => (
                                        <TableRow key={payout.id}>
                                            <TableCell className="font-mono text-sm">
                                                {formatDate(payout.date)}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatCurrency(payout.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {payout.method.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {payout.reference || "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        payout.status === 'processed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : payout.status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-red-100 text-red-800'
                                                    }
                                                >
                                                    {payout.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
