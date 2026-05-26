const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS to bypass ISP-level SRV record blocking
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);

        // Exit the process with failure code (1) if the connection fails
        // This stops the server from running if there's no database
        process.exit(1);
    }
};

module.exports = connectDB;