import jwt from 'jsonwebtoken';

// internal imports
import { JWT_SECRET } from '../config/env.js';
import User from '../models/user.model.js';
import BlacklistToken from '../models/blacklistToken.model.js';

// protect routes
async function authorize(req, res, next) {
	try {
		let token;

		if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
			token = req.headers.authorization.split(' ')[1];
		}

		if (!token) {
			return res.status(401).json({ message: 'Unauthorize' });
		}

		const blacklist = await BlacklistToken.findOne({ token });
		if (blacklist) {
			return res.status(401).json({ message: 'Token has been invalidated' });
		}

		const decoded = jwt.verify(token, JWT_SECRET);

		const user = await User.findById(decoded.userId);

		if (!user) return res.status(401).json({ message: 'Unauthorized' });

		req.user = user;

		next();
	} catch (error) {
		res.status(401).json({
			message: 'Unauthorize',
			error: error.message,
		});
	}
}

export default authorize;
