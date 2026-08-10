import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { User } from "../models/User.js";
import { MerchantProfile } from "../models/MerchantProfile.js";
import { Listing } from "../models/Listing.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });
const SATTUR_LAT = 9.364;
const SATTUR_LNG = 77.914;
function offsetCoord(base, maxKm = 0.02) {
  return base + (Math.random() - 0.5) * 2 * maxKm;
}
const satturMerchants = [
  {
    name: "Shanmuga Sweets & Karasev Store",
    description: "World-famous Sattur Karasev and traditional Tamil Nadu sweets & savories.",
    address: "Main Road, Sattur, Tamil Nadu 626203",
    phone: "+91 98421 62603",
    lat: 9.3642,
    lng: 77.9145,
    items: [
      {
        title: "Sattur Special Garlic Karasev (500g)",
        description: "Crispy, spicy Sattur Karasev made with garlic, gram flour, and fresh spices.",
        imageUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&q=80&w=800",
        category: "snacks",
        dietaryTags: ["vegetarian", "gluten-free"],
        originalPrice: 180,
        discountedPrice: 90,
        quantityTotal: 15,
        quantityAvailable: 10
      },
      {
        title: "Sattur Sweet & Sev Evening Surprise Pack",
        description: "Assorted Halwa, Laddu, and Sattur Sev combo pack.",
        imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&q=80&w=800",
        category: "snacks",
        dietaryTags: ["vegetarian"],
        originalPrice: 250,
        discountedPrice: 120,
        quantityTotal: 12,
        quantityAvailable: 8
      }
    ]
  },
  {
    name: "Sri Shanmugavel Bakery",
    description: "Freshly baked breads, buns, vegetable puffs, and tea cakes.",
    address: "Bus Stand Complex, Sattur, Tamil Nadu 626203",
    phone: "+91 94432 62603",
    lat: 9.365,
    lng: 77.9138,
    items: [
      {
        title: "Fresh Veg Puffs & Bun Butter Pack",
        description: "End-of-day surplus of freshly baked vegetable puffs and sweet cream buns.",
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800",
        category: "bakery",
        dietaryTags: ["vegetarian"],
        originalPrice: 140,
        discountedPrice: 60,
        quantityTotal: 20,
        quantityAvailable: 15
      },
      {
        title: "Butter Sponge Cake & Milk Bread Bundle",
        description: "Soft milk bread loaf with slice of vanilla butter sponge cake.",
        imageUrl: "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&q=80&w=800",
        category: "bakery",
        dietaryTags: ["vegetarian"],
        originalPrice: 160,
        discountedPrice: 75,
        quantityTotal: 10,
        quantityAvailable: 6
      }
    ]
  },
  {
    name: "Annapoorna Hotel & Tiffin Center",
    description: "Authentic South Indian tiffin, Virudhunagar style parottas, and meals.",
    address: "NH 44 Service Road, Sattur, Tamil Nadu 626203",
    phone: "+91 97860 62603",
    lat: 9.363,
    lng: 77.916,
    items: [
      {
        title: "Virudhunagar Parotta & Kurma Box",
        description: "Flaky layered parottas served with rich vegetable kurma and salna.",
        imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800",
        category: "prepared_meals",
        dietaryTags: ["vegetarian"],
        originalPrice: 150,
        discountedPrice: 70,
        quantityTotal: 15,
        quantityAvailable: 11
      },
      {
        title: "Evening South Indian Tiffin Combo",
        description: "Hot Idlis, Medu Vada, and Mini Masala Dosa with sambar and chutneys.",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
        category: "prepared_meals",
        dietaryTags: ["vegetarian"],
        originalPrice: 130,
        discountedPrice: 65,
        quantityTotal: 18,
        quantityAvailable: 14
      }
    ]
  },
  {
    name: "Sattur Organic Greens & Produce Market",
    description: "Farm-fresh vegetables, organic greens, and fresh fruits from Sattur farms.",
    address: "Bazaar Street, Sattur, Tamil Nadu 626203",
    phone: "+91 96290 62603",
    lat: 9.3638,
    lng: 77.9125,
    items: [
      {
        title: "Fresh Farm Vegetable Surplus Basket (3kg)",
        description: "Selection of fresh tomatoes, onions, brinjal, drumsticks, and green chillies.",
        imageUrl: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=800",
        category: "produce",
        dietaryTags: ["vegan", "gluten-free"],
        originalPrice: 200,
        discountedPrice: 85,
        quantityTotal: 12,
        quantityAvailable: 9
      },
      {
        title: "Local Tropical Fruit Combo Box",
        description: "Fresh local bananas, guavas, and seasonal fruits harvested daily.",
        imageUrl: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=800",
        category: "produce",
        dietaryTags: ["vegan", "gluten-free"],
        originalPrice: 180,
        discountedPrice: 80,
        quantityTotal: 10,
        quantityAvailable: 7
      }
    ]
  },
  {
    name: "VVR Fresh Milk & Cool Drinks Bar",
    description: "Fresh dairy products, chilled Badam milk, Rose milk, and natural juices.",
    address: "Taluk Office Road, Sattur, Tamil Nadu 626203",
    phone: "+91 91590 62603",
    lat: 9.3655,
    lng: 77.915,
    items: [
      {
        title: "Chilled Badam Milk & Elaneer Combo (4 Pack)",
        description: "Refreshingly cool almond milk and fresh tender coconut juice bottles.",
        imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&q=80&w=800",
        category: "beverages",
        dietaryTags: ["vegetarian"],
        originalPrice: 160,
        discountedPrice: 70,
        quantityTotal: 16,
        quantityAvailable: 12
      },
      {
        title: "Pure Farm Paneer & Curd Pack (500g)",
        description: "Fresh cottage cheese and thick unpasteurized farm curd.",
        imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800",
        category: "dairy",
        dietaryTags: ["vegetarian"],
        originalPrice: 190,
        discountedPrice: 95,
        quantityTotal: 10,
        quantityAvailable: 8
      }
    ]
  }
];
async function seedSatturItems() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/food-saver";
    console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log("\u2705 Connected to MongoDB");
    const now = /* @__PURE__ */ new Date();
    const createdListings = [];
    for (let idx = 0; idx < satturMerchants.length; idx++) {
      const mData = satturMerchants[idx];
      const email = `sattur_merchant_${idx + 1}@satturdeals.com`;
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          email,
          passwordHash: "dummy_sattur_hash",
          role: "merchant",
          emailVerified: true
        });
      }
      let merchant = await MerchantProfile.findOne({ userId: user._id });
      if (!merchant) {
        merchant = await MerchantProfile.create({
          userId: user._id,
          businessName: mData.name,
          description: mData.description,
          contactEmail: email,
          phone: mData.phone,
          address: mData.address,
          verificationStatus: "approved",
          location: {
            type: "Point",
            coordinates: [mData.lng, mData.lat]
            // [longitude, latitude]
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
          rating: 4.8 + Math.random() * 0.2,
          totalRatings: 35 + Math.floor(Math.random() * 50)
        });
      } else {
        merchant.location = {
          type: "Point",
          coordinates: [mData.lng, mData.lat]
        };
        await merchant.save();
      }
      for (const item of mData.items) {
        await Listing.deleteMany({ merchantId: merchant._id, title: item.title });
        const listing = await Listing.create({
          merchantId: merchant._id,
          title: item.title,
          description: item.description,
          imageUrl: item.imageUrl,
          category: item.category,
          dietaryTags: item.dietaryTags,
          originalPrice: item.originalPrice,
          discountedPrice: item.discountedPrice,
          quantityTotal: item.quantityTotal,
          quantityAvailable: item.quantityAvailable,
          claimWindowStart: new Date(now.getTime() - 1e3 * 60 * 30),
          // 30 mins ago
          claimWindowEnd: new Date(now.getTime() + 1e3 * 60 * 60 * 12),
          // 12 hours from now
          status: "active"
        });
        createdListings.push(listing);
      }
    }
    console.log(`
\u{1F389} Successfully added ${createdListings.length} Sattur items across ${satturMerchants.length} merchants!`);
    console.log(`\u{1F4CD} Location centered around Sattur, Tamil Nadu (Pincode: 626203, Lat: ${SATTUR_LAT}, Lng: ${SATTUR_LNG})`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding Sattur items:", error);
    process.exit(1);
  }
}
seedSatturItems();
