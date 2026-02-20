const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Initialize Firebase Admin
const serviceAccountPath = path.join(
  process.cwd(),
  "freezer-poc-firebase-adminsdk-fbsvc-7a272ae53f.json"
);

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function setUserRole(email, role) {
  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Set custom claims for role
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });
    
    // Create/update user document in Firestore
    await admin.firestore().collection("Users").doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        email: userRecord.email,
        role,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );
    
    console.log(`✅ Successfully set role "${role}" for user ${email}`);
    console.log(`   UID: ${userRecord.uid}`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error setting user role:`, error.message);
    process.exit(1);
  }
}

// Get arguments
const email = process.argv[2];
const role = process.argv[3];

if (!email || !role) {
  console.error("Usage: node setUserRole.js <email> <admin|superadmin|user>");
  process.exit(1);
}

if (!["admin", "superadmin", "user"].includes(role)) {
  console.error("Role must be one of: admin, superadmin, user");
  process.exit(1);
}

setUserRole(email, role);
