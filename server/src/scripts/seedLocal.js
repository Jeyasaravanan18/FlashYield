import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { User } from "../models/User.js";
import { MerchantProfile } from "../models/MerchantProfile.js";
import { Listing, LISTING_CATEGORIES } from "../models/Listing.js";
dotenv.config({ path: path.join(__dirname, "../../.env") });
const categoryImages = {
  bakery: [
  ],
  prepared_meals: [
  ],
  produce: [
  ],
  dairy: [
  ],
  beverages: [
  ],
  snacks: [
  ],
  mixed_bundle: [
  ],
  other: [
  ]
};
function getCategoryImage(category, index) {
  const pool = categoryImages[category] || categoryImages["other"];
  return pool[index % pool.length];
}
const DIETARY_TAGS = ["vegetarian", "vegan", "gluten-free", "nut-free", "dairy-free", "halal"];
function getRandomTags() {
  if (Math.random() > 0.5) return [];
  const shuffled = [...DIETARY_TAGS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * 2) + 1);
}
async function getLocation() {
  const args = process.argv.slice(2);
  let lat;
  let lng;
  for (const arg of args) {
    if (arg.startsWith("--lat=")) lat = parseFloat(arg.split("=")[1]);
    if (arg.startsWith("--lng=")) lng = parseFloat(arg.split("=")[1]);
  }
  if (lat !== void 0 && lng !== void 0) {
    return { lat, lng };
  }
  console.log("\u{1F30D} Fetching your current location automatically via IP...");
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    if (data.latitude && data.longitude) {
      console.log(`\u{1F4CD} Found location: ${data.city}, ${data.country_name} (${data.latitude}, ${data.longitude})`);
      return { lat: data.latitude, lng: data.longitude };
    }
  } catch (error) {
    console.error("Failed to get location via IP, falling back to default (Bengaluru).", error);
  }
  return { lat: 12.9716, lng: 77.5946 };
}
function randomizeCoordinate(coord, maxOffset = 0.045) {
  const offset = (Math.random() - 0.5) * 2 * maxOffset;
  return coord + offset;
}
async function runSeed() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/food-saver";
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("\u2705 Connected");
    const { lat, lng } = await getLocation();
    console.log("Cleaning up old local seed data...");
    const usersToDelete = await User.find({ email: { $regex: /shop\d+_.+@example\.com/ } });
    const userIds = usersToDelete.map((u) => u._id);
    if (userIds.length > 0) {
      const merchantsToDelete = await MerchantProfile.find({ userId: { $in: userIds } });
      const merchantIds = merchantsToDelete.map((m) => m._id);
      await Listing.deleteMany({ merchantId: { $in: merchantIds } });
      await MerchantProfile.deleteMany({ userId: { $in: userIds } });
      await User.deleteMany({ _id: { $in: userIds } });
    }
    const dummyUser = await User.findOne({ email: "localseed@example.com" });
    if (dummyUser) {
      const dummyMerchant = await MerchantProfile.findOne({ userId: dummyUser._id });
      if (dummyMerchant) {
        await Listing.deleteMany({ merchantId: dummyMerchant._id });
        await MerchantProfile.deleteOne({ _id: dummyMerchant._id });
      }
      await User.deleteOne({ _id: dummyUser._id });
    }
    console.log("Creating local merchant...");
    const user = await User.create({
      email: "localseed@example.com",
      passwordHash: "dummy_hash",
      // Not meant to be logged into
      role: "merchant",
      emailVerified: true
    });
    const merchant = await MerchantProfile.create({
      userId: user._id,
      businessName: "Local Seed Market",
      description: "A cluster of fresh local deals.",
      contactEmail: "localseed@example.com",
      phone: "+1234567890",
      address: "Near your current location",
      verificationStatus: "approved",
      location: {
        type: "Point",
        coordinates: [lng, lat]
      },
      operatingHours: [
        { day: "Monday", open: "08:00", close: "22:00" },
        { day: "Tuesday", open: "08:00", close: "22:00" },
        { day: "Wednesday", open: "08:00", close: "22:00" },
        { day: "Thursday", open: "08:00", close: "22:00" },
        { day: "Friday", open: "08:00", close: "22:00" },
        { day: "Saturday", open: "08:00", close: "22:00" },
        { day: "Sunday", open: "08:00", close: "22:00" }
      ],
      rating: 4.8,
      totalRatings: 42
    });
    console.log(`Generating 5 items for each of the ${LISTING_CATEGORIES.length} categories...`);
    const listings = [];
    const now = /* @__PURE__ */ new Date();
    for (const category of LISTING_CATEGORIES) {
      for (let i = 1; i <= 5; i++) {
        const itemLat = randomizeCoordinate(lat);
        const itemLng = randomizeCoordinate(lng);
        const mUser = await User.create({
          email: `shop${i}_${category}@example.com`,
          passwordHash: "dummy_hash",
          role: "merchant",
          emailVerified: true
        });
        const m = await MerchantProfile.create({
          userId: mUser._id,
          businessName: `${category.replace("_", " ").toUpperCase()} Shop ${i}`,
          description: `Best ${category} in town!`,
          contactEmail: `shop${i}_${category}@example.com`,
          phone: "+1234567890",
          address: "A few minutes away",
          verificationStatus: "approved",
          location: {
            type: "Point",
            coordinates: [itemLng, itemLat]
            // [longitude, latitude]
          },
          operatingHours: merchant.operatingHours,
          rating: 4 + Math.random(),
          totalRatings: Math.floor(Math.random() * 100)
        });
        listings.push({
          merchantId: m._id,
          title: `Surplus ${category.replace("_", " ")} Bundle ${i}`,
          description: "A great selection of items that need to go by end of day.",
          imageUrl: getCategoryImage(category, i - 1),
          category,
          dietaryTags: getRandomTags(),
          originalPrice: 20 + Math.floor(Math.random() * 30),
          discountedPrice: 5 + Math.floor(Math.random() * 10),
          quantityTotal: 10,
          quantityAvailable: Math.floor(Math.random() * 8) + 1,
          claimWindowStart: new Date(now.getTime() - 1e3 * 60 * 60 * 2),
          // 2 hours ago
          claimWindowEnd: new Date(now.getTime() + 1e3 * 60 * 60 * (4 + Math.random() * 8)),
          // 4-12 hours from now
          status: "active"
        });
      }
    }
    await Listing.insertMany(listings);
    console.log(`\u2705 Successfully inserted ${listings.length} live deals near your location!`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}
runSeed();
