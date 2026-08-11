import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', userSchema);

const profileSchema = new mongoose.Schema({}, { strict: false, collection: 'merchantprofiles' });
const MerchantProfile = mongoose.model('MerchantProfile', profileSchema);

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const user = await User.findOne({ email: 'sarjeya46@gmail.com' });
    if (!user) {
        console.log("User not found!");
        return;
    }
    
    console.log("User ID:", user._id);
    console.log("User role:", user.get('role'));
    
    const profile = await MerchantProfile.findOne({ userId: user._id });
    console.log("Profile linked to this User ID?", !!profile);
    
    if (!profile) {
        // Did the profile get linked to a different ID?
        const allProfiles = await MerchantProfile.find({});
        for (const p of allProfiles) {
             const uid = p.get('userId');
             const u = await User.findById(uid);
             console.log(`Profile ${p._id} linked to User ${uid}, User exists? ${!!u}`);
             if (!u) {
                  // Profile is orphaned
                  console.log("Found orphaned profile! Relinking to the kept user...");
                  await MerchantProfile.findByIdAndUpdate(p._id, { userId: user._id });
                  console.log("Relinked successfully.");
             }
        }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
