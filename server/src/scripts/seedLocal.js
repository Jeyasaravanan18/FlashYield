import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { User } from "../models/User.js";
import { MerchantProfile } from "../models/MerchantProfile.js";
import { Listing, LISTING_CATEGORIES } from "../models/Listing.js";
dotenv.config({ path: path.join(__dirname, "../../.env") });
const categoryImages = {
  bakery: [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1549931319-a545753467c8?auto=format&fit=crop&q=80&w=800"
  ],
  prepared_meals: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=800"
  ],
  produce: [
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1573246123716-6b1782bfc499?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800"
  ],
  dairy: [
    "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1559598467-f8b76c8155d0?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&q=80&w=800"
  ],
  beverages: [
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800"
  ],
  snacks: [
    "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1604085572504-a392541c0a6b?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1479767574301-a3ab9dba4e5b?auto=format&fit=crop&q=80&w=800"
  ],
  mixed_bundle: [
    "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800"
  ],
  other: [
    "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1550461716-dbf266b2a840?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800"
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
