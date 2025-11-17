// internal imports
import User from '../models/user.model.js';

// fetch users from database
export async function getUsers(req, res, next) {
	try {
		const users = await User.find();

		res.status(200).json({
			success: true,
			data: users,
		});
	} catch (error) {
		next(error);
	}
}

// fetch single user from database
export async function getUser(req, res, next) {
	try {
		const user = await User.findById(req.params.id).select('-password');

		if (!user) {
			const error = new Error('User not found');
			error.statusCode = 404;
			throw error;
		}

		res.status(200).json({
			success: true,
			data: user,
		});
	} catch (error) {
		next(error);
	}
}

// create a user
export async function createUser(req, res) {
	try {
		const user = new User(req.body);
		await user.save();

		res.status(201).json({
			success: true,
			message: 'New user created successfully',
		});
	} catch (error) {
		const err = new Error('Failed to create user, please try again', { cause: error });
		err.statusCode = 400;
		throw err;
	}
}

// update user logic
export async function updateUser(req, res) {
	try {
		const user = await User.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});

		if (!user) {
			const error = new Error('User not found');
			error.statusCode = 404;
			throw error;
		}

		res.status(200).json({
			success: true,
			data: user,
		});
	} catch (error) {
		const err = new Error('Unable to update user this time', { cause: error });
		err.statusCode = 400;
		throw err;
	}
}

// delete a user
export async function deleteUser(req, res) {
	try {
		const user = await User.findByIdAndDelete(req.params.id);

		if (!user) {
			const error = new Error('User not found');
			error.statusCode = 404;
			throw error;
		}

		res.json({
			success: true,
			message: 'User deleted successfully',
		});
	} catch (error) {
		const err = new Error('failed to delete user', { cause: error });
		err.statusCode = 400;
		throw err;
	}
}
