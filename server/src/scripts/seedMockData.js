import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { User } from "../models/User.js";
import { Claim } from "../models/Claim.js";
import { Listing } from "../models/Listing.js";
import bcrypt from "bcrypt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function seedData() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // 1. Create Customers
    const customersData = [
      { firstName: "Alice", lastName: "Smith", email: "alice.smith@example.com", phone: "555-0101" },
      { firstName: "Bob", lastName: "Johnson", email: "bob.j@example.com", phone: "555-0102" },
      { firstName: "Charlie", lastName: "Brown", email: "cbrown@example.com", phone: "555-0103" },
      { firstName: "Diana", lastName: "Prince", email: "diana.p@example.com", phone: "555-0104" },
      { firstName: "Evan", lastName: "Wright", email: "evan.w@example.com", phone: "555-0105" }
    ];

    const passwordHash = await bcrypt.hash("password123", 10);
    const createdUsers = [];

    for (const c of customersData) {
      let user = await User.findOne({ email: c.email });
      if (!user) {
        user = await User.create({
          ...c,
          passwordHash,
          role: "customer",
          emailVerified: true
        });
      }
      createdUsers.push(user);
    }
    console.log(`Ensured ${createdUsers.length} customers exist.`);

    // 2. Create Claims
    // Get some listings
    const listings = await Listing.find({ status: "active" }).limit(3);
    if (listings.length === 0) {
      console.log("No active listings found to create claims for. Please run seedSattur.js first.");
      process.exit(0);
    }

    const claimStatuses = ["reserved", "collected", "cancelled", "expired"];
    let claimCount = 0;

    for (let i = 0; i < 8; i++) {
      const user = createdUsers[i % createdUsers.length];
      const listing = listings[i % listings.length];
      const status = claimStatuses[i % claimStatuses.length];
      
      const idempotencyKey = crypto.randomUUID();
      const token = crypto.randomBytes(16).toString("hex");

      const existingClaim = await Claim.findOne({ idempotencyKey });
      if (!existingClaim) {
        await Claim.create({
          listingId: listing._id,
          customerId: user._id,
          quantity: 1,
          token,
          status,
          idempotencyKey,
          claimedAt: new Date(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
          collectedAt: status === "collected" ? new Date() : null
        });
        claimCount++;
      }
    }

    console.log(`Created ${claimCount} new claims for testing.`);
    process.exit(0);

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedData();
