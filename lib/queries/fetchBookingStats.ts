import {  
    collection,
    getCountFromServer,
    query,
    where,
    doc,
    getDocs,
    Timestamp
} from "firebase/firestore"
import { getFirestoreDb } from "@/lib/firebase"

export type BookingStats = {
    totalBookings: number
    pendingBookings: number
    confirmedBookings: number
    completedBookings: number
    cancelledBookings: number
    cancelledByCustomer: number
    totalRevenue: number
    averageRating: number
    totalRatingsCount: number
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
    const reviewsCol = collection(db, "reviews")

    // Queries
    const totalBookingsQuery = query(
        bookingsCol,
        where("provider_id", "in", customerRefs)
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
        where("status", "==", "Cancelled")
    )
    const cancelledByCustomerQuery = query(
        bookingsCol,
        where("provider_id", "in", customerRefs),
        where("status", "==", "Cancelled_By_Customer")
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

    // 💰 Calculate revenue
    const completedBookingsSnapshot = await getDocs(completedQuery)
    let totalRevenue = 0
    completedBookingsSnapshot.forEach(d => {
        const data = d.data() as { amount_paid?: number }
        totalRevenue += data.amount_paid || 0
    })

    // ⭐ Fetch real partner ratings
    const reviewsQuery = query(
        reviewsCol,
        where("partnerId", "in", customerRefs)
    )
    const reviewSnap = await getDocs(reviewsQuery)

    let totalRating = 0
    let ratingCount = 0

    reviewSnap.forEach(r => {
        const data = r.data() as { partnerRating?: number }
        if (data.partnerRating && data.partnerRating > 0) {
            totalRating += data.partnerRating
            ratingCount++
        }
    })

    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    return {
        totalBookings: total,
        pendingBookings: pending,
        confirmedBookings: confirmed,
        completedBookings: completed,
        cancelledBookings: cancelled,
        cancelledByCustomer,
        totalRevenue,
        averageRating: Number(averageRating.toFixed(2)),
        totalRatingsCount: ratingCount,
        completionRate: Number(completionRate.toFixed(1)),
    }
}
