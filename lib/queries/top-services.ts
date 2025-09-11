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

export type TopService = {
    name: string
    bookings: number
}

export async function fetchTopServices(): Promise<TopService[]> {
    try {
        const db = getFirestoreDb()

        // Query only completed bookings
        const q = query(
            collection(db, "bookings"),
            where("status", "==", "Service_Completed")
        )

        const snapshot = await getDocs(q)

        // Allowed providers
        const allowedProviders = [
            "VxxapfO7l8YM5f6xmFqpThc17eD3",
            "mwBcGMWLwDULHIS9hXx7JLuRfCi1",
            "Dmoo33tCx0OU1HMtapISBc9Oeeq2",
        ]

        const serviceCount: Record<string, number> = {}

        // Process bookings
        for (const doc of snapshot.docs) {
            const booking = doc.data()

            const providerId =
                booking.provider_id?.id || booking.provider_id // Handles both ref and string
            if (!allowedProviders.includes(providerId)) continue

            const subCategoryRef: DocumentReference<DocumentData> | undefined =
                booking.subCategoryCart_id
            if (!subCategoryRef) continue

            try {
                const subCategorySnap = await getDoc(subCategoryRef)
                if (!subCategorySnap.exists()) continue

                const serviceName = subCategorySnap.data()?.service_name
                if (serviceName) {
                    serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1
                }
            } catch (err) {
                console.error("Error fetching subCategory:", err)
            }
        }

        // Sort services by bookings & take top 5
        const sorted = Object.entries(serviceCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)

        return sorted.map(([name, count]) => ({
            name,
            bookings: count,
        }))
    } catch (error) {
        console.error("Error fetching top services:", error)
        return []
    }
}
