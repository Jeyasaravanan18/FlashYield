import axios from 'axios';
async function run() {
  try {
    const res = await axios.post('http://localhost:3001/api/v1/auth/register', {
      email: 'testmerchant_new2@example.com',
      password: 'Password123!',
      role: 'merchant',
      merchantProfile: {
        businessName: 'Malkudi',
        address: 'Kovilpatti',
        phone: '9345502563'
      }
    });
    const token = res.data.accessToken;
    console.log('Registered, token:', token);

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
    console.error('Error:', err.response?.data || err.message);
  }
}
run();
