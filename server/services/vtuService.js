const axios = require('axios');

const VTU_API_URL = process.env.VTU_API_URL;
const VTU_API_KEY = process.env.VTU_API_KEY;

async function dispenseAirtime(network, phone, amount) {
  console.log(`[VTU SERVICE] Dispensing ${network} airtime of ₦${amount} to ${phone}`);
  // In a real implementation, you would make an Axios POST request here
  // to the vtuafrica.com.ng API endpoint for airtime.
  // e.g.,
  // return axios.post(`${VTU_API_URL}airtime`, { network, phone, amount }, { headers: { Authorization: `Token ${VTU_API_KEY}` }});
  return { success: true, message: 'Airtime dispensed successfully (Mock)' };
}

async function dispenseExamPin(examType, quantity, email, phone) {
  console.log(`[VTU SERVICE] Dispensing ${quantity} ${examType} pin(s) to ${email}`);
  // Similar to airtime, make API call to VTU Africa for exam pins.
  return { success: true, message: 'Exam Pin sent successfully (Mock)', pins: ['MOCK_PIN_12345'] };
}

module.exports = { dispenseAirtime, dispenseExamPin };
