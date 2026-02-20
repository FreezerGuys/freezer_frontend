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

async function createUser(email, password, role = "user") {
  try {
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`User already exists: ${email}`);
      console.log(`UID: ${userRecord.uid}`);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        // Create new user
        userRecord = await admin.auth().createUser({
          email,
          password,
        });
        console.log(`✅ User created: ${email}`);
        console.log(`   UID: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    // Set custom claims for role
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });
    console.log(`✅ Role set to "${role}"`);

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
    console.log(`✅ User document created/updated in Firestore`);

    process.exit(0);
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    process.exit(1);
  }
}

// Get arguments
const email = process.argv[2];
const password = process.argv[3];
const role = process.argv[4] || "user";

if (!email || !password) {
  console.error("Usage: node createUser.js <email> <password> [role]");
  console.error("Example: node createUser.js skinny4ever21@gmail.com Joseph21! admin");
  process.exit(1);
}

createUser(email, password, role);
