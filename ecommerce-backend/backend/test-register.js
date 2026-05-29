const https = require('https');
const mongoose = require('mongoose');

async function run() {
  const email = 'mainshop@gmail.com';
  
  // 1. Send OTP
  const sendOtpData = JSON.stringify({ email });
  const req = https.request({
    hostname: 'backend-eight-lime-81.vercel.app',
    path: '/api/auth/send-otp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': sendOtpData.length }
  }, res => {
    res.on('data', d => console.log('OTP sent:', d.toString()));
    
    // 2. Fetch OTP from DB directly
    setTimeout(async () => {
      try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://shopAdmin:IamNeo1%40@cluster0.gbsdovl.mongodb.net/shop_for_all?retryWrites=true&w=majority&appName=Cluster0');
        const OTP = mongoose.model('OTP', new mongoose.Schema({email:String, otp:String, createdAt:Date}));
        const record = await OTP.findOne({email}).lean();
        console.log('Got OTP:', record.otp);
        
        // 3. Register shop
        const regData = JSON.stringify({
          shopName: "Main Shop",
          subdomain: "ecommerce-storefront-amber.vercel.app",
          email,
          password: "Password123!",
          fullName: "Main Admin",
          otp: record.otp
        });
        
        const regReq = https.request({
          hostname: 'backend-eight-lime-81.vercel.app',
          path: '/api/auth/register',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': regData.length }
        }, res2 => {
          let body = '';
          res2.on('data', d => body += d);
          res2.on('end', () => {
            console.log('Register response:', body);
            process.exit(0);
          });
        });
        regReq.on('error', e => console.error(e));
        regReq.write(regData);
        regReq.end();
        
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    }, 5000); // wait 5s for OTP to save
  });
  
  req.on('error', e => console.error(e));
  req.write(sendOtpData);
  req.end();
}

run();
