import mongoose from "mongoose";
import { User } from "../server/src/models/User.js";

async function run() {
  try {
    await mongoose.connect("mongodb+srv://sarjeya:Jeyasarva18@cluster0.t9ohxze.mongodb.net/food-saver?appName=Cluster0");
    
    const count = await User.countDocuments();
    console.log(`Total users in DB: ${count}`);
    
    const users = await User.find({ email: { $in: ["sarjeya18@gmail.com", "sarjeya46@gmail.com", "sarjeya10@gmail.com"] } });
    
    console.log(`Found ${users.length} matching users.`);
    for (const user of users) {
      console.log(`\nEmail: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Banned until: ${user.claimBannedUntil}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
