// Run locally with: ts-node scripts/seed-roles.ts (requires firebase-admin creds)
import admin from "firebase-admin"

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require("./serviceAccountKey.json") as admin.ServiceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  })
}
const db = admin.firestore()

const roles = [
  {
    id: "superadmin",
    permissions: [
      "admin:users:view",
      "admin:users:write",
      "admin:roles:view",
      "admin:roles:write",
      "bookings:view",
      "bookings:write",
      "payments:view",
      "payments:write",
      "store:view",
      "store:write",
      "coupons:view",
      "coupons:write",
      "customers:view",
      "customers:write",
      "complaints:view",
      "complaints:write",
      "analytics:view",
      "partners:manage",
    ],
  },
  {
    id: "admin",
    permissions: [
      "bookings:view",
      "bookings:write",
      "payments:view",
      "store:view",
      "coupons:view",
      "customers:view",
      "complaints:view",
      "analytics:view",
      "partners:manage",
    ],
  },
  {
    id: "store_manager",
    permissions: ["store:view", "store:write"],
  },
  {
    id: "accounts_manager",
    permissions: ["payments:view", "payments:write", "bookings:view", "bookings:write"],
  },
  {
    id: "marketing_manager",
    permissions: ["coupons:view", "bookings:view", "customers:view_limited", "complaints:view"],
  },
]

async function run() {
  for (const r of roles) {
    await db.collection("roles").doc(r.id).set({ permissions: r.permissions })
    console.log("Seeded role:", r.id)
  }
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
