import { getFirestoreDb } from "@/lib/firebase"
import {
    collection,
    getDocs,
    getDoc,
    DocumentReference,
    DocumentData,
    query,
    where,
} from "firebase/firestore"

export type CustomerInsight = {
    customerId: string
    isFirstTime: boolean
}

export async function fetchNewVsRepeatCustomers(year: string, month: string): Promise<CustomerInsight[]> {
    try {
        const db = getFirestoreDb()

        // Month window (UTC)
        const startDate = new Date(`${year}-${month}-01T00:00:00.000Z`)
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + 1)

        // Query to fetch bookings in the target month with status "Service_Completed"
        const bookingsQuery = query(
            collection(db, "bookings"),
            where("status", "==", "Service_Completed"),
            where("date", ">=", startDate),
            where("date", "<", endDate)
        )

        const snapshot = await getDocs(bookingsQuery)

        const customerIds = new Set<string>()
        const customerFirstBooking: Record<string, Date> = {}

        // Process each booking to determine customer first-time or repeat status
        snapshot.docs.forEach((doc) => {
            const booking = doc.data()
            const customerRef: DocumentReference<DocumentData> | string = booking.customer_id
            const customerId = customerRef instanceof DocumentReference ? customerRef.id : customerRef

            customerIds.add(customerId)

            // Track the first booking date for each customer
            if (!customerFirstBooking[customerId]) {
                customerFirstBooking[customerId] = booking.date.toDate()
            }
        })

        // Determine new vs repeat customers based on their first booking
        const customerInsights: CustomerInsight[] = []

        for (const customerId of customerIds) {
            const firstBookingDate = customerFirstBooking[customerId]

            // If the first booking date falls in the current month, it's a first-time customer
            const isFirstTime = firstBookingDate >= startDate && firstBookingDate < endDate

            customerInsights.push({
                customerId,
                isFirstTime,
            })
        }

        return customerInsights
    } catch (error) {
        console.error("Error fetching new vs repeat customers:", error)
        return []
    }
}
