import * as admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

async function main() {
  const email = "dummy@gmail.com";   // change if you want
  const password = "SuperAdmin@123";     // strong password
  const name = "Super Admin";

  // 1. Create Firebase Auth user
  const user = await auth.createUser({
    email,
    password,
    displayName: name,
  });

  // 2. Set custom claim for superadmin
  await auth.setCustomUserClaims(user.uid, { roleId: "superadmin" });

  // 3. Add Firestore entry
  await db.collection("customer").doc(user.uid).set({
    email,
    name,
    roleId: "superadmin",
  });

  console.log(`✅ Superadmin created: ${email}`);
}

main().catch(console.error);


