import axios from 'axios';

async function run() {
  try {
    // 1. Log in to get token (using an admin account if one exists, or we just trust our previous DB script)
    // Wait, earlier I found that there is no admin in the DB easily guessable.
    // Instead of HTTP, I will use mongoose again but correctly connect.
    const mongoose = await import('mongoose');
    await mongoose.connect('mongodb+srv://sarjeya:Jeyasarva18@cluster0.t9ohxze.mongodb.net/food-saver?appName=Cluster0');
    
    const { User } = await import('../server/src/models/User.js');

    const total = await User.countDocuments({});
    console.log("Total Users in DB:", total);

    const limit = 20;
    const totalPages = Math.ceil(total / limit);
    console.log("Total Pages:", totalPages);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
