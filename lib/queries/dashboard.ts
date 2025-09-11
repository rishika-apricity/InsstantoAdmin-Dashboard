import {
    collection,
    getCountFromServer,
    query,
    where,
    doc,
    getDocs,
    QueryConstraint,
} from "firebase/firestore"
import { getFirestoreDb } from "@/lib/firebase"

export type BookingStats = {
    totalBookings: number
    pendingBookings: number
    confirmedBookings: number
    completedBookings: number
    cancelledBookings: number
    totalRevenue: number
    averageRating: number
    completionRate: number
    totalOfferAmount: number
    netRevenue: number
    totalCustomers: number
    perOrderValue: number
}

export async function fetchBookingStats(
    from?: Date,
    to?: Date
): Promise<BookingStats> {
    const db = getFirestoreDb()

    const customerIds = [
        "mwBcGMWLwDULHIS9hXx7JLuRfCi1",
        "Dmoo33tCx0OU1HMtapISBc9Oeeq2",
        "VxxapfO7l8YM5f6xmFqpThc17eD3",
    ]
    const customerRefs = customerIds.map((id) => doc(db, "customer", id))

    const bookingsCol = collection(db, "bookings")

    // 🔹 date filters for bookings
    const bookingDateConstraints: QueryConstraint[] = []
    if (from) bookingDateConstraints.push(where("date", ">=", from))
    if (to) bookingDateConstraints.push(where("date", "<=", to))

    // queries for bookings
    const totalBookingsQuery = query(
        bookingsCol,
        where("provider_id", "in", customerRefs),
        ...bookingDateConstraints
    )

    const pendingQuery = query(
        bookingsCol,
        where("status", "==", "Pending"),
        ...bookingDateConstraints
    )

    const confirmedQuery = query(
        bookingsCol,
        where("provider_id", "in", customerRefs),
        where("status", "==", "Accepted"),
        ...bookingDateConstraints
    )

    const completedQuery = query(
        bookingsCol,
        where("provider_id", "in", customerRefs),
        where("status", "==", "Service_Completed"),
        ...bookingDateConstraints
    )

    const cancelledQuery = query(
        bookingsCol,
        where("provider_id", "in", customerRefs),
        where("status", "==", "Booking_Cancelled by true"),
        ...bookingDateConstraints
    )

    // run booking queries
    const [totalSnapshot, pendingSnap, confirmedSnap, completedSnap, cancelledSnap] =
        await Promise.all([
            getCountFromServer(totalBookingsQuery),
            getCountFromServer(pendingQuery),
            getCountFromServer(confirmedQuery),
            getCountFromServer(completedQuery),
            getCountFromServer(cancelledQuery),
        ])

    const total = Number(totalSnapshot.data().count || 0)
    const pending = Number(pendingSnap.data().count || 0)
    const confirmed = Number(confirmedSnap.data().count || 0)
    const completed = Number(completedSnap.data().count || 0)
    const cancelled = Number(cancelledSnap.data().count || 0)

    // 🔹 revenue & offers
    const completedBookingsSnapshot = await getDocs(completedQuery)
    let totalRevenue = 0
    let totalOfferAmount = 0
    let totalWalletUsed = 0
    let totalDiscount = 0

    completedBookingsSnapshot.forEach((docSnap) => {
        const data = docSnap.data()
        totalRevenue += data.amount_paid || 0
        totalWalletUsed += data.walletAmountUsed || 0
        totalDiscount += data.discount_amount || 0
        totalOfferAmount += (data.discount_amount || 0) + (data.walletAmountUsed || 0)
    })

    // 🔹 net revenue
    const netRevenue = totalRevenue - totalWalletUsed - totalDiscount

    // 🔹 per order value
    const perOrderValue = completed > 0 ? totalRevenue / completed : 0

    // 🔹 total customers (apply same date filter on created_time)
    const customerDateConstraints: QueryConstraint[] = [where("userType.customer", "==", true)]
    if (from) customerDateConstraints.push(where("created_time", ">=", from))
    if (to) customerDateConstraints.push(where("created_time", "<=", to))

    const customerQuery = query(collection(db, "customer"), ...customerDateConstraints)
    const customerSnap = await getCountFromServer(customerQuery)
    const totalCustomers = Number(customerSnap.data().count || 0)

    const averageRating = 5 // placeholder
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    return {
        totalBookings: total,
        pendingBookings: pending,
        confirmedBookings: confirmed,
        completedBookings: completed,
        cancelledBookings: cancelled,
        totalRevenue,
        averageRating,
        completionRate: Number(completionRate.toFixed(1)),
        totalOfferAmount,
        netRevenue,
        totalCustomers,
        perOrderValue: Number(perOrderValue.toFixed(2)),
    }
}
