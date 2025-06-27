import admin from "firebase-admin";
const serviceAccount = require("freezer-poc-firebase-adminsdk-fbsvc-7a272ae53f.json"); // Adjust the path to your service account key

if (!admin.apps.length) {
  admin.initializeApp({
     credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://freezer-poc-default-rtdb.firebaseio.com"
    })
}

export default admin;
