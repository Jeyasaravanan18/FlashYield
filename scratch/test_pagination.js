import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('../server/.env') });

async function run() {
  try {
    // We need to login as an admin first. Let's create an admin token directly if we can't login.
    // Actually, I can just hit the database directly with the exact same query code.
    const mongoose = await import('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    const { User } = await import('../server/src/models/User.js');

    const page = 1;
    const limit = 20;
    const query = {};

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const pagination = { page, limit, total, totalPages: Math.ceil(total / limit) };
    
    console.log("Pagination object:", pagination);
    console.log("Users returned:", users.length);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
