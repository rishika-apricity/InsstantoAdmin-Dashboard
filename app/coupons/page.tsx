"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Plus, Search, Percent, DollarSign, Calendar, Users } from "lucide-react"
import { mockCoupons } from "@/lib/queries/coupons"

export default function CouponsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCoupons = mockCoupons.filter(
    (coupon) =>
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalCoupons = mockCoupons.length
  const activeCoupons = mockCoupons.filter((c) => c.isActive).length
  const totalUsage = mockCoupons.reduce((sum, c) => sum + c.usedCount, 0)
  const totalSavings = mockCoupons.reduce((sum, c) => sum + c.usedCount * (c.type === "fixed" ? c.value : 100), 0)

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coupons & Offers</h1>
            <p className="text-gray-600">Manage promotional codes and discount offers</p>
          </div>
          <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Coupon
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Percent className="w-8 h-8 text-blue-600" />
                <Badge variant="secondary">{totalCoupons}</Badge>
              </div>
              <CardTitle className="text-2xl font-bold text-blue-900">{totalCoupons}</CardTitle>
              <CardDescription className="text-blue-700">Total Coupons</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <DollarSign className="w-8 h-8 text-green-600" />
                <Badge variant="secondary">{activeCoupons}</Badge>
              </div>
              <CardTitle className="text-2xl font-bold text-green-900">{activeCoupons}</CardTitle>
              <CardDescription className="text-green-700">Active Coupons</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Users className="w-8 h-8 text-purple-600" />
                <Badge variant="secondary">{totalUsage}</Badge>
              </div>
              <CardTitle className="text-2xl font-bold text-purple-900">{totalUsage}</CardTitle>
              <CardDescription className="text-purple-700">Total Usage</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Calendar className="w-8 h-8 text-orange-600" />
                <Badge variant="secondary">₹{totalSavings.toLocaleString()}</Badge>
              </div>
              <CardTitle className="text-2xl font-bold text-orange-900">₹{totalSavings.toLocaleString()}</CardTitle>
              <CardDescription className="text-orange-700">Customer Savings</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{coupon.title}</div>
                      <div className="text-sm text-gray-500">{coupon.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {coupon.type === "percentage"
                        ? "Percentage"
                        : coupon.type === "fixed"
                          ? "Fixed Amount"
                          : "Free Service"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {coupon.type === "percentage" ? `${coupon.value}%` : `₹${coupon.value}`}
                    {coupon.maxDiscount && <div className="text-xs text-gray-500">Max: ₹{coupon.maxDiscount}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{coupon.usedCount}</span>
                        <span>{coupon.usageLimit}</span>
                      </div>
                      <Progress value={(coupon.usedCount / coupon.usageLimit) * 100} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>{new Date(coupon.validUntil).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={coupon.isActive ? "default" : "secondary"}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
