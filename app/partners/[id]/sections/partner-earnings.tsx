"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LabelList
} from "recharts"
import {
    collection,
    doc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    limit
} from "firebase/firestore"
import { getFirestoreDb } from "@/lib/firebase"
import {
    DollarSign,
    TrendingUp,
    CreditCard,
    Wallet,
    History,
    Loader2,
    ArrowUpIcon,
    ArrowDownIcon,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
// import { formatDate } from "date-fns/format"

type WalletTransaction = {
    id: string
    amount: number
    date: Timestamp
    partnerId: string
    user_type: string
    status?: string
    description?: string
    customer_name?: string
    bookingId?: string
}

interface PartnerEarningsSectionProps {
    partnerId: string
}

export function PartnerEarningsSection({ partnerId }: PartnerEarningsSectionProps) {
    const db = getFirestoreDb()
    const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [totalEarnings, setTotalEarnings] = useState(0)
    const [currentBalance, setCurrentBalance] = useState(0)
    const [pendingPayouts, setPendingPayouts] = useState(0)
    const [monthlyGrowth, setMonthlyGrowth] = useState(0)
    const [thisMonthEarnings, setThisMonthEarnings] = useState(0)
    const [page, setPage] = useState(1)
    const [monthOffset, setMonthOffset] = useState(0) // 👈 Offset in months for chart navigation

    const pageSize = 10
    const totalPages = Math.ceil(walletTransactions.length / pageSize)
    const paginatedTransactions = walletTransactions.slice((page - 1) * pageSize, page * pageSize)
    const [loanRecoveredAmount, setLoanRecoveredAmount] = useState(0)
    const [netEarnings, setNetEarnings] = useState(0)
    const formatDate = (timestamp: Timestamp) =>
        timestamp.toDate().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
 
    useEffect(() => {
        const fetchEarningsData = async () => {
            try {
                setLoading(true)
                const partnerRef = doc(db, "customer", partnerId)

                const walletQuery = query(collection(db, "Wallet_Overall"), where("service_partner_id", "==", partnerRef))
                const walletSnapshot = await getDocs(walletQuery)
                if (!walletSnapshot.empty) {
                    const walletData = walletSnapshot.docs[0]?.data()
                    if (walletData) {
                        setTotalEarnings(walletData.TotalAmountComeIn_Wallet || 0)
                        setCurrentBalance(walletData.total_balance || 0)
                        setPendingPayouts(walletData.pending_amount || 0)
                    }

                    const loanQuery = query(collection(db, "PartnerKitLoan"), where("partnerId", "==", partnerRef))
                    const loanSnap = await getDocs(loanQuery)
                    let recovered = 0
                    if (!loanSnap.empty) {
                        recovered = loanSnap.docs[0].data().loanRecoveredAmount || 0
                    }
                    setLoanRecoveredAmount(recovered)
                    setNetEarnings((walletData?.TotalAmountComeIn_Wallet || 0) + recovered)
                }

                // Wallet transactions
                let walletTransactionsQuery
                try {
                    walletTransactionsQuery = query(
                        collection(db, "Wallet_In_record"),
                        where("partnerId", "==", partnerRef),
                        orderBy("Timestamp", "desc"),
                        limit(200)
                    )
                } catch {
                    walletTransactionsQuery = query(
                        collection(db, "Wallet_In_record"),
                        where("partnerId", "==", partnerRef),
                        limit(200)
                    )
                }

                const walletTransactionsSnapshot = await getDocs(walletTransactionsQuery)
                const transactionsData: WalletTransaction[] = []

                walletTransactionsSnapshot.forEach((transactionDoc) => {
                    const transaction = transactionDoc.data()
                    if (transaction.payment_in_wallet && transaction.payment_in_wallet > 0) {
                        transactionsData.push({
                            id: transactionDoc.id,
                            amount: transaction.payment_in_wallet,
                            date: transaction.Timestamp || Timestamp.now(),
                            partnerId: transaction.partnerId?.id || partnerId,
                            user_type: transaction.user_type || "customer",
                            status: "Completed",
                            description: "Wallet credit",
                            customer_name: "Unknown",
                            bookingId:
                                typeof transaction.bookingId === "string"
                                    ? transaction.bookingId
                                    : transaction.bookingId?.id,
                        })
                    }
                })

                // Sort
                transactionsData.sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime())
                setWalletTransactions(transactionsData)

                const now = new Date()
                const currentMonthEarnings = transactionsData
                    .filter((t) => {
                        const d = t.date.toDate()
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                    })
                    .reduce((sum, t) => sum + t.amount, 0)

                setThisMonthEarnings(currentMonthEarnings)

                const lastMonth = new Date()
                lastMonth.setMonth(lastMonth.getMonth() - 1)
                const lastMonthEarnings = transactionsData
                    .filter((t) => {
                        const d = t.date.toDate()
                        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear()
                    })
                    .reduce((sum, t) => sum + t.amount, 0)

                if (lastMonthEarnings > 0)
                    setMonthlyGrowth(((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100)
                else if (currentMonthEarnings > 0) setMonthlyGrowth(100)
            } catch (error) {
                console.error("Error fetching earnings data:", error)
            } finally {
                setLoading(false)
            }
        }

        if (partnerId) fetchEarningsData()
    }, [partnerId, db])

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount)

    // 🔄 Generates last 6 months (or shifted by monthOffset)
    const generateMonthlyEarnings = (transactions: WalletTransaction[], offset: number) => {
        const monthlyData: { [key: string]: number } = {}
        const months: string[] = []

        const currentDate = new Date()
        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate)
            date.setMonth(currentDate.getMonth() - i - offset)
            const key = date.toLocaleDateString("en-US", { year: "numeric", month: "short" })
            months.push(key)
            monthlyData[key] = 0
        }
        transactions.forEach((t) => {
            const key = t.date.toDate().toLocaleDateString("en-US", { year: "numeric", month: "short" })
            if (months.includes(key)) monthlyData[key] += t.amount
        })

        return months.map((m) => ({ month: m, amount: monthlyData[m] || 0 }))
    }

    const chartData = generateMonthlyEarnings(walletTransactions, monthOffset)

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
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <CreditCard className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Earnings (before loan deductions)</p>
                                <p className="text-2xl font-bold">{formatCurrency(netEarnings)}</p>
                                <span className="text-xs text-muted-foreground">
                                    Includes ₹{formatCurrency(loanRecoveredAmount)} recovered from loans
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg"><DollarSign className="w-6 h-6 text-green-600" /></div>
                            <div>
                                <p className="text-sm text-muted-foreground">Net Earnings</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalEarnings)}</p>
                                <span className="text-xs text-muted-foreground">
                                    Income after loan deductions
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg"><CreditCard className="w-6 h-6 text-orange-600" /></div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Payouts</p>
                                <p className="text-2xl font-bold">{formatCurrency(currentBalance)}</p>
                                <span className="text-xs text-muted-foreground">
                                    Available Balance in wallet
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg"><TrendingUp className="w-6 h-6 text-purple-600" /></div>
                            <div>
                                <p className="text-sm text-muted-foreground">This Month</p>
                                <p className="text-2xl font-bold">{formatCurrency(thisMonthEarnings)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    {monthlyGrowth >= 0 ? <ArrowUpIcon className="w-4 h-4 text-green-500" /> : <ArrowDownIcon className="w-4 h-4 text-red-500" />}
                                    <span className={`text-xs ${monthlyGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                                        {monthlyGrowth >= 0 ? "+" : ""}{monthlyGrowth.toFixed(1)}% from last month
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Earnings Chart */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Earnings Trend ({monthOffset === 0 ? "Last 6 Months" : `Months -${monthOffset}`})
                    </CardTitle>

                    {/* 👇 Month navigation buttons */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setMonthOffset((prev) => prev + 6)}
                            title="Show previous 6 months"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setMonthOffset((prev) => (prev > 0 ? prev - 6 : 0))}
                            disabled={monthOffset === 0}
                            title="Show newer months"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="earningsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: "#10b981", stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: "#ffffff", stopOpacity: 0.6 }} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => [formatCurrency(v as number), "Earnings"]} />
                            <Bar dataKey="amount" barSize={30} radius={[10, 10, 0, 0]} fill="url(#earningsGradient)">
                                <LabelList
                                    dataKey="amount"
                                    position="top"
                                    fill="#333"
                                    fontSize={12}
                                    fontWeight="bold"
                                    formatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Transactions */}
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Recent Transactions</CardTitle></CardHeader>
                <CardContent>
                    {walletTransactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No wallet transactions found for this partner.</p>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedTransactions.map((transaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell>{formatDate(transaction.date)}</TableCell>
                                                <TableCell>{transaction.description}</TableCell>
                                                <TableCell>{transaction.customer_name || "N/A"}</TableCell>
                                                <TableCell><Badge className="bg-green-100 text-green-800">{transaction.status}</Badge></TableCell>
                                                <TableCell className="text-right font-medium">+ {formatCurrency(transaction.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex justify-between items-center mt-4">
                                <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                                <span className="text-sm">Page {page} of {totalPages}</span>
                                <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}