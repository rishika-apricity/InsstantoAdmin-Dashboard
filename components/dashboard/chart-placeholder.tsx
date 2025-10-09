import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from "recharts"
import { doc, collection, query, where, getDocs } from "firebase/firestore"
import { getFirestoreDb } from "@/lib/firebase" // Ensure this imports the Firestore initialization

interface ChartPlaceholderProps {
  title: string
  description: string
  icon: LucideIcon
  iconColor?: string
  children?: React.ReactNode
  className?: string
}

interface BookingData {
  month: string
  bookings: number
}

export function ChartPlaceholder({
  title,
  description,
  icon: Icon,
  iconColor = "text-primary/50",
  children,
  className = "",
}: ChartPlaceholderProps) {
  const [bookingsData, setBookingsData] = useState<BookingData[]>([])

  // Function to fetch bookings data for the last 6 months for specific customer IDs
  const fetchBookingsData = async () => {
    const db = getFirestoreDb()  // Initialize Firestore

    // Customer IDs (already provided)
    const customerIds = [
      "mwBcGMWLwDULHIS9hXx7JLuRfCi1",
      "Dmoo33tCx0OU1HMtapISBc9Oeeq2",
      "VxxapfO7l8YM5f6xmFqpThc17eD3"
    ]

    // Get the references from the customer collection based on customer IDs
    const customerRefs = customerIds.map(id => doc(db, "customer", id))  // Note: using "customer" not "customers"

    // Get current date and last 5 months
    const currentDate = new Date()
    const monthsAgo = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(currentDate)
      date.setMonth(currentDate.getMonth() - i)
      return date
    })

    // Format months in short names (e.g., Jan, Feb, Mar)
    const months = monthsAgo.map((date) => {
      const monthName = date.toLocaleString("default", { month: "short" })
      return monthName
    })

    // Reverse the array so that the current month is last
    const reversedMonths = [...months].reverse()

    const bookingsCol = collection(db, "bookings")

    // Prepare the queries for each month
    const bookingsQuery = query(
      bookingsCol,
      where("provider_id", "in", customerRefs),
      where("status", "==", "Service_Completed")
    )

    const snapshot = await getDocs(bookingsQuery)

    // Initialize an array to count bookings per month
    const bookingsCount = reversedMonths.map((month) => ({
      month,
      bookings: 0,
    }))

    // Count bookings for each month
    snapshot.forEach((doc) => {
      const data = doc.data()
      const bookingDate = data.date.toDate()  // Make sure 'date' is a Firestore Date
      const monthName = bookingDate.toLocaleString("default", { month: "short" })
      
      // Update the booking count for the matching month
      const monthIndex = reversedMonths.indexOf(monthName)
      if (monthIndex !== -1) {
        bookingsCount[monthIndex].bookings += 1
      }
    })

    // Set the data to state
    setBookingsData(bookingsCount)
  }

  useEffect(() => {
    fetchBookingsData()
  }, [])

  return (

<Card className={`border-l-4 border-gray-300 bg-white shadow-sm transition-transform hover:scale-[1.02] hover:shadow-md ${className}`}>
<CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconColor.replace("/50", "")}`} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children || (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingsData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                {/* Gradient Definition with lighter bottom */}
                <defs>
                  <linearGradient id="gradientColor" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#6a11cb", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "#ffffff", stopOpacity: 0.6 }} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" barSize={30} radius={[10, 10, 0, 0]} fill="url(#gradientColor)">
                  <LabelList dataKey="bookings" position="top" fill="#333" fontSize={14} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
