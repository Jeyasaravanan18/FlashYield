import { connectDatabase as connectDB, disconnectDatabase as disconnectDB } from "./src/config/database.js";
import { User } from "./src/models/User.js";
import bcrypt from "bcrypt";

async function run() {
  await connectDB();
  
  const email = "admin@flashyield.com";
  const password = "adminpassword123";

  try {
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`Admin user already exists: ${email}`);
    } else {
      const passwordHash = await bcrypt.hash(password, 12);
      await User.create({
        email,
        passwordHash,
        role: "admin",
        firstName: "System",
        lastName: "Administrator",
        emailVerified: true
      });
      console.log(`Admin created successfully!`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await disconnectDB();
  }
}

run();
