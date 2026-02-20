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

const db = admin.firestore();

async function addSampleInventory() {
  try {
    const sampleItems = [
      {
        name: "Sodium Chloride",
        company: "Sigma-Aldrich",
        volume: 500,
        volumeUnit: "g",
        quantity: 10,
        category: "4C",
        barcode: "123456789",
        qrCode: "QR001",
        status: "available",
        batchNumber: "BATCH-2024-001",
        serialNumber: "SN-001",
        casNumber: "7647-14-5",
        storageLocation: "Cabinet A1",
        expiryDate: new Date("2026-12-31"),
        createdBy: "TMWj1b4o7bcqEvKazrKqxKBDvQG3",
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      },
      {
        name: "Potassium Iodide",
        company: "Fisher Scientific",
        volume: 250,
        volumeUnit: "g",
        quantity: 5,
        category: "-20C",
        barcode: "987654321",
        qrCode: "QR002",
        status: "available",
        batchNumber: "BATCH-2024-002",
        serialNumber: "SN-002",
        casNumber: "7681-11-0",
        storageLocation: "Cabinet B2",
        expiryDate: new Date("2027-06-30"),
        createdBy: "TMWj1b4o7bcqEvKazrKqxKBDvQG3",
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      },
      {
        name: "Ethanol",
        company: "VWR",
        volume: 1000,
        volumeUnit: "mL",
        quantity: 20,
        category: "4C",
        barcode: "111222333",
        qrCode: "QR003",
        status: "available",
        batchNumber: "BATCH-2024-003",
        serialNumber: "SN-003",
        casNumber: "64-17-5",
        storageLocation: "Flammable Cabinet",
        expiryDate: new Date("2025-12-31"),
        createdBy: "TMWj1b4o7bcqEvKazrKqxKBDvQG3",
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      },
    ];

    for (const item of sampleItems) {
      await db.collection("Inventory").add(item);
      console.log(`✅ Added: ${item.name}`);
    }

    console.log(`\n✅ Sample inventory added successfully`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error adding inventory:`, error.message);
    process.exit(1);
  }
}

addSampleInventory();
