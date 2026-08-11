import mongoose from 'mongoose';
import axios from 'axios';
import { User } from './src/models/User.js';

async function run() {
  await mongoose.connect('mongodb+srv://sarjeya:Jeyasarva18@cluster0.t9ohxze.mongodb.net/food-saver?appName=Cluster0');
  
  try {
    await axios.post('http://localhost:3001/api/v1/auth/register', {
      email: 'testmerchant_verified4@example.com',
      password: 'Password123!',
      role: 'merchant',
      merchantProfile: {
        businessName: 'Malkudi',
        address: 'Kovilpatti',
        phone: '9345502563'
      }
    });
  } catch (e) {}

  await User.updateOne({ email: 'testmerchant_verified4@example.com' }, { $set: { emailVerified: true } });

  const loginRes = await axios.post('http://localhost:3001/api/v1/auth/login', {
    email: 'testmerchant_verified4@example.com',
    password: 'Password123!'
  });
  const token = loginRes.data.accessToken;
  console.log('Logged in, token:', token);

  try {
    const putRes = await axios.put('http://localhost:3001/api/v1/auth/me', {
      merchantProfile: {
        businessName: 'Malkudi Sweets',
        address: 'Kovilpatti',
        phone: '9345502563'
      }
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('PUT success:', putRes.data);
  } catch (err) {
    console.error('Error:', JSON.stringify(err.response?.data || err.message, null, 2));
  }
  
  process.exit(0);
}
run();
