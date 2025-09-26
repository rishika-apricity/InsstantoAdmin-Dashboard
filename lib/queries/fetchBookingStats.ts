import {
    collection,
    getCountFromServer,
    query,
    where,
    doc,
    getDocs,
    Timestamp
} from "firebase/firestore"
import { getFirestoreDb } from "@/lib/firebase"  // Import the getFirestoreDb function

export type BookingStats = {
    totalBookings: number
    pendingBookings: number
    confirmedBookings: number
    completedBookings: number
    cancelledBookings: number
    cancelledByCustomer: number   // ✅ new field
    totalRevenue: number
    averageRating: number
    completionRate: number
}

export async function fetchBookingStats(): Promise<BookingStats> {
    const db = getFirestoreDb()

    const customerIds = [
        "mwBcGMWLwDULHIS9hXx7JLuRfCi1",
        "Dmoo33tCx0OU1HMtapISBc9Oeeq2",
        "VxxapfO7l8YM5f6xmFqpThc17eD3"
    ]

    const customerRefs = customerIds.map(id => doc(db, "customer", id))
    const bookingsCol = collection(db, "bookings")
    const from = Timestamp.fromDate(new Date('2025-08-01T00:00:00Z')) // August 1, 2025
    const to = Timestamp.fromDate(new Date('2025-08-30T23:59:59Z')) // August 30, 2025

    const totalBookingsQuery = query(
        bookingsCol,
        where("provider_id", "in", customerRefs),
    )

    const pendingQuery = query(bookingsCol, where("status", "==", "Pending"))

    const confirmedQuery = query(
        bookingsCol,
        where("provider_id", "in", customerRefs),
        where("status", "==", "Accepted")
    )

    const completedQuery = query(
        bookingsCol,
        where("provider_id", "in", customerRefs),
        where("status", "==", "Service_Completed")
    )

    const cancelledQuery = query(
        bookingsCol,
        where("provider_id", "in", customerRefs),
        where("status", "==", "Booking_Cancelled by true") // keep your old logic if still needed
    )

    // ✅ New query for customer cancellations
    const cancelledByCustomerQuery = query(
        bookingsCol,
        where("status", "==", "Cancelled")
    )

    const [
        totalSnapshot,
        pendingSnap,
        confirmedSnap,
        completedSnap,
        cancelledSnap,
        cancelledByCustomerSnap,
    ] = await Promise.all([
        getCountFromServer(totalBookingsQuery),
        getCountFromServer(pendingQuery),
        getCountFromServer(confirmedQuery),
        getCountFromServer(completedQuery),
        getCountFromServer(cancelledQuery),
        getCountFromServer(cancelledByCustomerQuery),
    ])

    const total = Number(totalSnapshot.data().count || 0)
    const pending = Number(pendingSnap.data().count || 0)
    const confirmed = Number(confirmedSnap.data().count || 0)
    const completed = Number(completedSnap.data().count || 0)
    const cancelled = Number(cancelledSnap.data().count || 0)
    const cancelledByCustomer = Number(cancelledByCustomerSnap.data().count || 0)

    // Calculate revenue from completed bookings
    const completedBookingsSnapshot = await getDocs(completedQuery)
    let totalRevenue = 0
    completedBookingsSnapshot.forEach(doc => {
        const data = doc.data()
        totalRevenue += (data.amount_paid || 0)
    })

    const averageRating = 5  // placeholder
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    return {
        totalBookings: total,
        pendingBookings: pending,
        confirmedBookings: confirmed,
        completedBookings: completed,
        cancelledBookings: cancelled,
        cancelledByCustomer,   // ✅ now included
        totalRevenue,
        averageRating,
        completionRate: Number(completionRate.toFixed(1)),
    }
}
