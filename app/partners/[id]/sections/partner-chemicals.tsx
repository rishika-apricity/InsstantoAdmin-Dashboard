
"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    FileText,
    Download,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Upload,
    Loader2,
    AlertCircle
} from "lucide-react"

interface PartnerChemicalsSectionProps {
    partnerId: string
}

export function PartnerChemicalsSection({ partnerId }: PartnerChemicalsSectionProps) {
    const [loading, setLoading] = useState(false)

    // Mock chemical purchase data
    const chemicalPurchases = [
        {
            id: "chem001",
            productName: "Organic Pesticide - Neem Oil",
            category: "Pesticides",
            quantity: 50,
            unit: "liters",
            pricePerUnit: 120,
            totalAmount: 6000,
            purchaseDate: "2024-02-15",
            supplier: "GreenChem Supplies",
            status: "delivered"
        },
        {
            id: "chem002",
            productName: "NPK Fertilizer 16-16-16",
            category: "Fertilizers",
            quantity: 100,
            unit: "kg",
            pricePerUnit: 25,
            totalAmount: 2500,
            purchaseDate: "2024-02-10",
            supplier: "AgriTech Solutions",
            status: "delivered"
        },
        {
            id: "chem003",
            productName: "Fungicide - Copper Sulfate",
            category: "Fungicides",
            quantity: 25,
            unit: "kg",
            pricePerUnit: 80,
            totalAmount: 2000,
            purchaseDate: "2024-02-05",
            supplier: "ChemAg Industries",
            status: "pending"
        }
    ]

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'delivered':
                return <Badge className="bg-green-100 text-green-800">Delivered</Badge>
            case 'pending':
                return <Badge variant="outline">Pending</Badge>
            case 'cancelled':
                return <Badge variant="destructive">Cancelled</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const totalSpent = chemicalPurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0)
    const totalOrders = chemicalPurchases.length
    const deliveredOrders = chemicalPurchases.filter(p => p.status === 'delivered').length

    return (
        <div className="space-y-6">
            {/* Chemical Purchase Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-blue-600" />
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
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Total Orders</p>
                                <p className="text-2xl font-bold">{totalOrders}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Delivered</p>
                                <p className="text-2xl font-bold">{deliveredOrders}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Chemical Purchases Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Chemical Purchase History</CardTitle>
                </CardHeader>
                <CardContent>
                    {chemicalPurchases.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No chemical purchases found.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Price/Unit</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {chemicalPurchases.map((purchase) => (
                                        <TableRow key={purchase.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{purchase.productName}</p>
                                                    <p className="text-xs text-muted-foreground">{purchase.supplier}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{purchase.category}</Badge>
                                            </TableCell>
                                            <TableCell>{purchase.quantity} {purchase.unit}</TableCell>
                                            <TableCell>{formatCurrency(purchase.pricePerUnit)}</TableCell>
                                            <TableCell className="font-medium">{formatCurrency(purchase.totalAmount)}</TableCell>
                                            <TableCell>{purchase.purchaseDate}</TableCell>
                                            <TableCell>{getStatusBadge(purchase.status)}</TableCell>
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
