import { getFirestore } from "firebase/firestore";  // Ensure correct Firestore import
import { getDocs, collection } from "firebase/firestore";  // Import necessary Firestore methods

export async function fetchNewVsRepeatCustomers(): Promise<{ newCustomerCount: number, repeatCustomerCount: number }> {
    const db = getFirestore();  // Initialize Firestore using the modular SDK

    try {
        // Query Firestore for all bookings
        const bookingsSnap = await getDocs(collection(db, "bookings"));  // Correct Firestore method for fetching documents

        const customersMap: Record<string, number> = {};  // to store customer booking count

        // Loop through all bookings and count unique customers
        bookingsSnap.forEach((doc) => {  // doc has type `QueryDocumentSnapshot`
            const booking = doc.data();
            const customerId = booking.customer_id;  // Assuming customer_id is a field in bookings

            if (customerId) {
                // Count the number of bookings per customer
                customersMap[customerId] = (customersMap[customerId] || 0) + 1;
            }
        });

        // Separate new and repeat customers based on their booking count
        let newCustomerCount = 0;
        let repeatCustomerCount = 0;

        // Count customers based on booking count
        for (const customerId in customersMap) {
            if (customersMap[customerId] === 1) {
                newCustomerCount += 1;
            } else {
                repeatCustomerCount += 1;
            }
        }

        // Return the counts
        return { newCustomerCount, repeatCustomerCount };
    } catch (error) {
        console.error("Error fetching new vs repeat customers:", error);
        throw error;
    }
}
