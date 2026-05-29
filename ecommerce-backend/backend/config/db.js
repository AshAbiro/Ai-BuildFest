const mongoose = require('mongoose');

// Vercel serverless doesn't need custom DNS, only apply locally
if (!process.env.VERCEL) {
    const dns = require('dns');
    // Force Google DNS to bypass ISP-level SRV record blocking
    dns.setDefaultResultOrder('ipv4first');
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
}

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        isConnected = true;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);

        // Only exit in non-serverless environments
        if (!process.env.VERCEL) {
            process.exit(1);
        }
        // In serverless, throw so the request gets an error response
        throw error;
    }
};

module.exports = connectDB;