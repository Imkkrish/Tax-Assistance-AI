import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const testConnection = async () => {
    console.log('🧪 Testing MongoDB Connection...');
    console.log(`📌 URI provided (length): ${process.env.MONGO_URI ? process.env.MONGO_URI.length : 0}`);

    if (!process.env.MONGO_URI) {
        console.error('❌ Error: MONGO_URI is not defined in .env file');
        process.exit(1);
    }

    // Check if it's potentially using the wrong variable name (MONGODB_URI vs MONGO_URI)
    // Docker compose used MONGODB_URI maps to MONGO_URI, but local .env might have either.

    const uri = process.env.MONGO_URI;

    try {
        await mongoose.connect(uri);
        console.log('✅ Success! Connected to MongoDB Atlas.');
        console.log('Host:', mongoose.connection.host);
        console.log('Database Name:', mongoose.connection.name);

        // Close connection
        await mongoose.connection.close();
        console.log('🔌 Connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection Failed!');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);

        if (error.message.includes('bad auth')) {
            console.log('💡 Tip: Check your username and password in the URI. Special characters might need encoding.');
        } else if (error.message.includes('querySrv')) {
            console.log('💡 Tip: DNS query failed. This might be a network firewall blocking SRV records or invalid connection string format.');
        } else if (error.message.includes('capabilities mismatch')) {
            console.log('💡 Tip: SSL/TLS issue. Ensure your IP is whitelisted on MongoDB Atlas.');
        }

        process.exit(1);
    }
};

testConnection();
