import * as admin from "firebase-admin";

// Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require("../scripts/serviceAccountKey.json")),
  });
}

async function setRole() {
  const uid = "whfUJyDtU3dsXlyKRMXacxC8Yvy1"; // Replace with real UID
  await admin.auth().setCustomUserClaims(uid, { role: "superadmin" });

  console.log(`✅ Role 'superadmin' assigned to user: ${uid}`);
  process.exit(0);
}

setRole().catch((err) => {
  console.error(err);
  process.exit(1);
});
