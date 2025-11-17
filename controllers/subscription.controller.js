import dayjs from 'dayjs';

// internal imports
import { SERVER_URL } from '../config/env.js';
import { workflowClient } from '../config/upstash.js';
import Subscription from '../models/subscription.model.js';

// create subs
export async function createSubscription(req, res, next) {
	try {
		const subscription = await Subscription.create({
			...req.body,
			user: req.user._id,
		});

		const { workflowRunId } = await workflowClient.trigger({
			url: `${SERVER_URL}/api/v1/workflows/subscription/reminder`,
			body: {
				subscriptionId: subscription.id,
			},
			header: {
				'content-type': 'application/json',
			},
			retries: 0,
		});
		console.log('SERVER_URL:', SERVER_URL);

		res.status(201).json({
			success: true,
			data: { subscription, workflowRunId },
		});
	} catch (error) {
		next(error);
	}
}

// get all user subs
export async function getUserSubscriptions(req, res, next) {
	try {
		if (req.user.id != req.params.id) {
			const error = new Error('You are not the owner of this account');
			error.statusCode = 401;
			throw error;
		}

		const subscriptions = await Subscription.find({ user: req.params.id });

		res.status(200).json({
			success: true,
			data: subscriptions,
		});
	} catch (error) {
		next(error);
	}
}

// update subscription
export async function updateSubscription(req, res, next) {
	try {
		const { id: subscriptionId } = req.params;
		const subscription = await Subscription.findById(subscriptionId);

		if (!subscription) {
			const error = new Error('Subscription not found');
			error.statusCode = 404;
			throw error;
		}

		if (subscription.user.toString() !== req.user.id) {
			const error = new Error('Unauthorize');
			error.statusCode = 401;
			throw error;
		}

		Object.assign(subscription, req.body);
		await subscription.save();

		res.status(200).json({
			success: true,
			data: subscription,
		});
	} catch (error) {
		next(error);
	}
}

// get all subscriptions
export async function getAllSubscriptions(req, res, next) {
	try {
		const subscriptions = await Subscription.find().populate('user', 'name email');

		res.status(200).json({
			success: true,
			data: subscriptions,
		});
	} catch (error) {
		next(error);
	}
}

// get subscription details
export async function getSubscriptionDetails(req, res, next) {
	try {
		const { id: subscriptionId } = req.params;
		const subscription = await Subscription.findById(subscriptionId).populate('user', 'name email');

		if (!subscription) {
			const error = new Error('Subscription not found');
			error.statusCode = 404;
			throw error;
		}

		if (subscription.user._id.toString() !== req.user.id) {
			const error = new Error('Unauthorize');
			error.statusCode = 403;
			throw error;
		}

		res.status(200).json({
			success: true,
			data: subscription,
		});
	} catch (error) {
		next(error);
	}
}

// cancel subscription
export async function cancelSubscription(req, res, next) {
	try {
		const { id: subscriptionId } = req.params;
		const subscription = await Subscription.findById(subscriptionId);

		if (!subscription) {
			const error = new Error('Subscription not found');
			error.statusCode = 401;
			throw error;
		}

		if (subscription.user.toString() !== req.user.id) {
			const error = new Error('Unauthorized');
			error.statusCode = 401;
			throw error;
		}

		if (subscription.status == 'cancelled') {
			const error = new Error('Subscription already cancelled');
			error.statusCode = 400;
			throw error;
		}

		subscription.status = 'cancelled';
		subscription.cancelledAt = dayjs.toDate();
		await subscription.save();

		res.status(200).json({
			success: true,
			message: 'Subscription cancelled',
			data: subscription,
		});
	} catch (error) {
		next(error);
	}
}

// delete subscription
export async function deleteSubscription(req, res, next) {
	try {
		const { id: subscriptionId } = req.params;
		const subscription = await Subscription.findById(subscriptionId);

		if (!subscription) {
			const error = new Error('Subscription not found');
			error.statusCode = 404;
			throw error;
		}

		if (subscription.user.toString() !== req.user.id) {
			const error = new Error('Unauthorize');
			error.statusCode = 403;
			throw error;
		}

		await subscription.deleteOne();

		res.status(200).json({
			success: true,
			message: 'subscription deleted',
		});
	} catch (error) {
		next(error);
	}
}

// get upcoming renewals
export async function getUpcomingRenwals(req, res, next) {
	try {
		const userId = req.user.id;
		const now = dayjs();
		const in30Days = now.add(30, 'day');

		const subscriptions = await Subscription.find({
			user: userId,
			status: 'active',
			renewalDate: { $gte: now.toDate(), $lte: in30Days.toDate() },
		}).populate('user', 'name email');

		res.status(200).json({ success: true, data: subscriptions });
	} catch (error) {
		next(error);
	}
}
