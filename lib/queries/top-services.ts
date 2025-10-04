import { getFirestoreDb } from "@/lib/firebase"
import {
    collection,
    getDocs,
    getDoc,
    doc, // ✅ add this
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

        const allowedProviders = [
            "VxxapfO7l8YM5f6xmFqpThc17eD3",
            "mwBcGMWLwDULHIS9hXx7JLuRfCi1",
            "Dmoo33tCx0OU1HMtapISBc9Oeeq2",
        ]

        const serviceCount: Record<string, number> = {}
        const subCategoryRefs: Set<string> = new Set()
        const bookingsBySubCat: Record<string, number> = {}

        // First pass: collect subCategory ids
        for (const doc of snapshot.docs) {
            const booking = doc.data()
            const providerId =
                booking.provider_id?.id || booking.provider_id
            if (!allowedProviders.includes(providerId)) continue

            const subCategoryRef: DocumentReference<DocumentData> | undefined =
                booking.subCategoryCart_id
            if (!subCategoryRef) continue

            subCategoryRefs.add(subCategoryRef.path)
            bookingsBySubCat[subCategoryRef.path] =
                (bookingsBySubCat[subCategoryRef.path] || 0) + 1
        }

        // Batch fetch all subcategories in parallel
        const subCatDocs = await Promise.all(
            Array.from(subCategoryRefs).map(async (path) => {
                const ref = (await getDoc(doc(db, path))).data()
                return { path, data: ref }
            })
        )

        // Map subcategory names to booking counts
        for (const { path, data } of subCatDocs) {
            if (!data) continue
            const serviceName = data.service_name
            if (serviceName) {
                serviceCount[serviceName] =
                    (serviceCount[serviceName] || 0) +
                    bookingsBySubCat[path]
            }
        }

        // Sort and return top 5
        return Object.entries(serviceCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, bookings: count }))
    } catch (error) {
        console.error("Error fetching top services:", error)
        return []
    }
}
