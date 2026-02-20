import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || "freezer-poc";
    const databaseURL = `https://${projectId}-default-rtdb.firebaseio.com`;

    // 1. Try service account JSON file (local dev)
    const serviceAccountPath = path.join(
      process.cwd(),
      "freezer-poc-firebase-adminsdk-fbsvc-7a272ae53f.json"
    );

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, "utf8")
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL,
      });
    } else if (
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      // 2. Use env vars (App Hosting / Cloud Run)
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(
        /\\n/g,
        "\n"
      );
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
        databaseURL,
      });
    } else {
      console.warn(
        "Firebase Admin: No service account file or FIREBASE_* env vars found"
      );
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
}

export default admin;
