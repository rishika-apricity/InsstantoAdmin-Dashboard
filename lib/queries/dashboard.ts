import {
    collection,
    query,
    where,
    getDocs,
    Timestamp,
    doc
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

export async function fetchBookingStats(): Promise<BookingStats> {
    const db = getFirestoreDb()
    const from = Timestamp.fromDate(new Date('2025-08-01T00:00:00Z')) // August 1, 2025
    const to = Timestamp.fromDate(new Date('2025-08-30T23:59:59Z')) // August 30, 2025

    // Provider IDs you want to filter by
    const providerIds = [
        "mwBcGMWLwDULHIS9hXx7JLuRfCi1",
        "Dmoo33tCx0OU1HMtapISBc9Oeeq2",
        "VxxapfO7l8YM5f6xmFqpThc17eD3",
    ]
    const providerRefs = providerIds.map((id) => doc(db, "customer", id))

    const bookingsCol = collection(db, "bookings")

    // Base filter (date + provider)
    const baseFilters = [
        where("provider_id", "in", providerRefs),
        // where("booking_date", ">=", from),
        // where("booking_date", "<=", to),
    ]

    // Total bookings
    const queryRef = query(bookingsCol, ...baseFilters)
    const snapshot = await getDocs(queryRef)
    const totalBookings = snapshot.size

    // Pending bookings
    const pendingQuery = query(bookingsCol, ...baseFilters, where("status", "==", "Pending"))
    const pendingSnapshot = await getDocs(pendingQuery)
    const pendingBookings = pendingSnapshot.size

    // Confirmed bookings
    const confirmedQuery = query(bookingsCol, ...baseFilters, where("status", "==", "Accepted"))
    const confirmedSnapshot = await getDocs(confirmedQuery)
    const confirmedBookings = confirmedSnapshot.size

    // Completed bookings
    const completedQuery = query(bookingsCol, ...baseFilters, where("status", "==", "Service_Completed"))
    const completedSnapshot = await getDocs(completedQuery)
    const completedBookings = completedSnapshot.size

    // Cancelled bookings
    const cancelledQuery = query(bookingsCol, ...baseFilters, where("status", "==", "Booking_Cancelled by true"))
    const cancelledSnapshot = await getDocs(cancelledQuery)
    const cancelledBookings = cancelledSnapshot.size

    // Revenue calculations
    let totalRevenue = 0
    let totalOfferAmount = 0
    let totalWalletUsed = 0
    let totalDiscount = 0

    completedSnapshot.forEach((docSnap) => {
        const data = docSnap.data()
        totalRevenue += data.amount_paid || 0
        totalWalletUsed += data.walletAmountUsed || 0
        totalDiscount += data.discount_amount || 0
        totalOfferAmount += (data.discount_amount || 0) + (data.walletAmountUsed || 0)
    })

    const netRevenue = totalRevenue - totalWalletUsed - totalDiscount
    const perOrderValue = completedBookings > 0 ? totalRevenue / completedBookings : 0

    // Total customers (with same date filter)
    const customerQuery = query(
        collection(db, "customer"),
        where("userType.customer", "==", true),
        // where("created_time", ">=", from),
        // where("created_time", "<=", to)
    )
    const customerSnap = await getDocs(customerQuery)
    const totalCustomers = customerSnap.size

    const averageRating = 5 // placeholder
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0

    return {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        averageRating,
        completionRate: Number(completionRate.toFixed(1)),
        totalOfferAmount,
        netRevenue,
        totalCustomers,
        perOrderValue: Number(perOrderValue.toFixed(2)),
    }
}