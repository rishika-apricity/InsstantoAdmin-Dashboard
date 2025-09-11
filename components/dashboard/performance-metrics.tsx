"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Star, TrendingUp } from "lucide-react"
import { fetchTopServices, type TopService } from "@/lib/queries/top-services"
import { fetchMostBookedSlots, type TimeSlot } from "@/lib/queries/most-booked-slots"
import { getFirestoreDb } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc, DocumentReference } from "firebase/firestore"

type TimeSlotWithPercentage = TimeSlot & { percentage: number }

const customerMetrics = [
  { label: "Customer Satisfaction", value: "4.8/5", count: "2,156 reviews" },
]

export type CustomerInsight = {
  customerId: string
  isFirstTime: boolean
}

export const fetchNewVsRepeatCustomers = async (): Promise<{
  customerInsights: CustomerInsight[]
  newCustomerCount: number
  repeatCustomerCount: number
}> => {
  try {
    const db = getFirestoreDb()

    // Fetch all completed bookings from the "bookings" collection
    const bookingsQuery = collection(db, "bookings")
    const snapshot = await getDocs(bookingsQuery)

    const customerIds = new Set<string>()
    snapshot.docs.forEach((doc) => {
      const booking = doc.data()
      const customerRef = booking.customer_id
      const customerId = customerRef instanceof DocumentReference ? customerRef.id : customerRef
      customerIds.add(customerId)
    })

    // Now, for each customer, determine if they are new or repeat
    const customerInsights: CustomerInsight[] = []

    let newCustomerCount = 0
    let repeatCustomerCount = 0

    // Fetching customer documents to determine if they are first-time or repeat
    for (const customerId of customerIds) {
      const customerDocRef = doc(db, "customers", customerId) // Corrected to use `doc()` for individual documents
      const customerDoc = await getDoc(customerDocRef)

      if (!customerDoc.exists()) {
        customerInsights.push({ customerId, isFirstTime: true })
        newCustomerCount++
        continue
      }

      const customerData = customerDoc.data()
      const customerFirstBookingDate = customerData?.firstBookingDate?.toDate()

      // If no first booking date exists or it's the first booking, classify as new
      if (!customerFirstBookingDate || customerFirstBookingDate === undefined) {
        customerInsights.push({ customerId, isFirstTime: true })
        newCustomerCount++
      } else {
        customerInsights.push({ customerId, isFirstTime: false })
        repeatCustomerCount++
      }
    }

    return {
      customerInsights,
      newCustomerCount,
      repeatCustomerCount,
    }
  } catch (error) {
    console.error("Error fetching new vs repeat customers:", error)
    return {
      customerInsights: [],
      newCustomerCount: 0,
      repeatCustomerCount: 0,
    }
  }
}

export function PerformanceMetrics() {
  const [topServices, setTopServices] = useState<TopService[]>([])
  const [peakHours, setPeakHours] = useState<TimeSlotWithPercentage[]>([])
  const [newCustomerCount, setNewCustomerCount] = useState<number>(0)
  const [repeatCustomerCount, setRepeatCustomerCount] = useState<number>(0)

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

    // Fetch New vs Repeat Customer Data
    const loadCustomerInsights = async () => {
      const { customerInsights, newCustomerCount, repeatCustomerCount } = await fetchNewVsRepeatCustomers()

      // Update the state with new and repeat customer counts
      setNewCustomerCount(newCustomerCount)
      setRepeatCustomerCount(repeatCustomerCount)

      // Optionally, you can use `customerInsights` to display more detailed customer data
      console.log("Customer Insights:", customerInsights)
    }

    loadServices()
    loadSlots()
    loadCustomerInsights()
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
            {customerMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{metric.label}</p>
                  <p className="text-xs text-muted-foreground">{metric.count}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{metric.value}</p>
                </div>
              </div>
            ))}

            {/* New and Repeat Customer Metrics */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Repeat Customers</p>
                <p className="text-xs text-muted-foreground">{repeatCustomerCount} customers</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{Math.round((repeatCustomerCount / (newCustomerCount + repeatCustomerCount)) * 100)}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">New Customers</p>
                <p className="text-xs text-muted-foreground">{newCustomerCount} customers</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{Math.round((newCustomerCount / (newCustomerCount + repeatCustomerCount)) * 100)}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
