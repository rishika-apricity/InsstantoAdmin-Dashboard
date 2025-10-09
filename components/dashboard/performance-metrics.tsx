"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Star, TrendingUp } from "lucide-react"
import { fetchTopServices, type TopService } from "@/lib/queries/top-services"
import { fetchMostBookedSlots, type TimeSlot } from "@/lib/queries/most-booked-slots"
import { fetchNewVsRepeatCustomers } from "@/lib/queries/customer-insights"  // import the helper function

type TimeSlotWithPercentage = TimeSlot & { percentage: number }

const customerMetrics = [
  { label: "Customer Satisfaction", value: "4.8/5", count: "2,156 reviews" },
]

export function PerformanceMetrics() {
  const [topServices, setTopServices] = useState<TopService[]>([])
  const [peakHours, setPeakHours] = useState<TimeSlotWithPercentage[]>([])
  const [repeatCustomerCount, setRepeatCustomerCount] = useState<number>(0)
  const [newCustomerCount, setNewCustomerCount] = useState<number>(0)
  const [averageRating, setaverageRating] = useState<number>(0)
  const [totalRatings, settotalRatings] = useState<number>(0)

  useEffect(() => {
    const loadServices = async () => {
      const services = await fetchTopServices()
      setTopServices(services)
    }

    const loadSlots = async () => {
      const slots = await fetchMostBookedSlots()

      // total of all bookings across slots
      const totalBookings = slots.reduce((sum, s) => sum + s.bookings, 0) || 1

      const slotsWithPercent: TimeSlotWithPercentage[] = slots.map(s => ({
        ...s,
        percentage: Math.round((s.bookings / totalBookings) * 100),
      }))

      setPeakHours(slotsWithPercent)
    }

    const loadCustomerCounts = async () => {
      try {
        const data = await fetchNewVsRepeatCustomers() // fetch counts
        setRepeatCustomerCount(data.repeatCustomerCount)
        setNewCustomerCount(data.newCustomerCount)
        setaverageRating(data.averageRating)
        settotalRatings(data.totalRatings)
      } catch (error) {
        console.error("Error fetching customer counts:", error)
      }
    }

    loadServices()
    loadSlots()
    loadCustomerCounts()  // fetch the counts for repeat and new customers
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Peak Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-secondary" />
            Peak Hours
          </CardTitle>
          <CardDescription>Most active booking times today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {peakHours.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              peakHours.slice(0, 5).map((hour, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{hour.time}</span>
                  <div className="flex items-center gap-3">
                    <Progress value={hour.percentage} className="w-16 h-2" />
                    <span className="text-sm text-muted-foreground w-8">{hour.percentage}%</span>
                    <Badge variant="outline" className="text-xs">
                      {hour.bookings}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-chart-3" />
            Top Services
          </CardTitle>
          <CardDescription>By booking volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topServices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings found</p>
            ) : (
              topServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <Badge variant="outline">{service.bookings}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Customer Insights
          </CardTitle>
          <CardDescription>Customer behavior and satisfaction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add dynamic data for Repeat and New Customers */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Repeat Customers</p>
                <p className="text-xs text-muted-foreground">{repeatCustomerCount}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{Math.round((repeatCustomerCount / (repeatCustomerCount + newCustomerCount)) * 100)}%</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">New Customers</p>
                <p className="text-xs text-muted-foreground">{newCustomerCount}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{Math.round((newCustomerCount / (repeatCustomerCount + newCustomerCount)) * 100)}%</p>
              </div>
            </div>
            {/* Static customer satisfaction metric */}
            {customerMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{metric.label}</p>
                  <p className="text-xs text-muted-foreground">{totalRatings}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{averageRating}/5</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
