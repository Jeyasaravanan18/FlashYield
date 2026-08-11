import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("No MONGODB_URI found in .env");
  process.exit(1);
}

// Minimal Schema to query
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', userSchema);

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB");

    // Drop old indexes first
    try {
      await User.collection.dropIndex("email_1_role_1");
      console.log("Dropped email_1_role_1 index");
    } catch (err) {
      console.log("Index email_1_role_1 does not exist or already dropped");
    }

    try {
      await User.collection.dropIndex("googleSubject_1_role_1");
      console.log("Dropped googleSubject_1_role_1 index");
    } catch (err) {
      console.log("Index googleSubject_1_role_1 does not exist or already dropped");
    }

    // Find duplicates by email
    const users = await User.find({});
    const emailMap = new Map();

    for (const u of users) {
      const email = u.get('email');
      if (!email) continue;
      if (!emailMap.has(email)) emailMap.set(email, []);
      emailMap.get(email).push(u);
    }

    for (const [email, accounts] of emailMap.entries()) {
      if (accounts.length > 1) {
        console.log(`Found duplicate email: ${email} with ${accounts.length} accounts.`);
        
        const merchant = accounts.find(a => a.get('role') === 'merchant');
        const customer = accounts.find(a => a.get('role') === 'customer');
        const others = accounts.filter(a => a.get('role') !== 'merchant' && a.get('role') !== 'customer');

        let accountToKeep = null;
        if (merchant) {
          accountToKeep = merchant;
        } else if (customer) {
          accountToKeep = customer;
        } else if (accounts.length > 0) {
          accountToKeep = accounts[0];
        }

        console.log(`Keeping account ID: ${accountToKeep._id} (role: ${accountToKeep.get('role')})`);

        for (const acc of accounts) {
          if (acc._id.toString() !== accountToKeep._id.toString()) {
             console.log(`Deleting duplicate account ID: ${acc._id}`);
             await User.findByIdAndDelete(acc._id);
          }
        }
      }
    }

    // Now for googleSubject
    const gsMap = new Map();
    for (const u of users) {
      const gs = u.get('googleSubject');
      if (!gs) continue;
      if (!gsMap.has(gs)) gsMap.set(gs, []);
      gsMap.get(gs).push(u);
    }

    for (const [gs, accounts] of gsMap.entries()) {
       // Filter out accounts that were already deleted above
       let validAccounts = [];
       for (const acc of accounts) {
          const exists = await User.findById(acc._id);
          if (exists) validAccounts.push(exists);
       }
       if (validAccounts.length > 1) {
           console.log(`Found duplicate googleSubject: ${gs} with ${validAccounts.length} accounts.`);
           const merchant = validAccounts.find(a => a.get('role') === 'merchant');
           const customer = validAccounts.find(a => a.get('role') === 'customer');

           let accountToKeep = null;
           if (merchant) accountToKeep = merchant;
           else if (customer) accountToKeep = customer;
           else accountToKeep = validAccounts[0];

           for (const acc of validAccounts) {
              if (acc._id.toString() !== accountToKeep._id.toString()) {
                 console.log(`Deleting duplicate account ID: ${acc._id}`);
                 await User.findByIdAndDelete(acc._id);
              }
           }
       }
    }

    // Now that duplicates are clear, we will create new indexes in the main codebase when server starts
    console.log("Cleanup complete!");

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from DB");
  }
}

run();
