import mongoose from 'mongoose';

// internal imports
import { DB_URI, NODE_ENV } from '../config/env.js';

if (!DB_URI) {
	throw new Error('Please define DB_URI in dotenv');
}

// connect to database
async function connectToDatabase() {
	try {
		await mongoose.connect(DB_URI);

		console.log(`connected to database in ${NODE_ENV} mode`);
	} catch (error) {
		console.error('Error connecting to databse', error);

		process.exit(1);
	}
}

export default connectToDatabase;
