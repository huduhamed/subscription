// do this to single allow a require statement, as we're sticked to using import modules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import dayjs from 'dayjs';

// internal imports
import Subscription from '../models/subscription.model.js';
import { sendReminderEmail } from '../config/utils/send-email.js';

const { serve } = require('@upstash/workflow/express');

const REMINDERS = [7, 5, 2, 1];

// responsible for sending reminders
export const sendReminders = serve(async (context) => {
	const { subscriptionId } = context.requestPayload;
	const subscription = await fetchSubscription(context, subscriptionId);

	if (!subscription || subscription.status != 'active') return;

	const renewalDate = dayjs(subscription.renewalDate);

	if (renewalDate.isBefore(dayjs())) {
		console.log(`Renewal date has passed for subscription ${subscriptionId}. Stopping workflow`);
	}

	for (const daysBefore of REMINDERS) {
		const reminderDate = renewalDate.subtract(daysBefore, 'day');

		if (reminderDate.isAfter(dayjs())) {
			await sleepUntilReminder(context, `Reminder ${daysBefore} days before`, reminderDate);
		}

		if (dayjs().isSame(reminderDate, 'day')) {
			await triggerReminder(context, `${daysBefore} days before reminder`, subscription);
		}
	}
});

// fetchSubscription func
async function fetchSubscription(context, subscriptionId) {
	return await context.run('get subscription', async () => {
		return Subscription.findById(subscriptionId).populate('user', 'name email');
	});
}

// sleep func
async function sleepUntilReminder(context, label, date) {
	console.log(`Sleeping until ${label} reminder at ${date}`);
	await context.sleepUntil(label, date.toDate());
}

// trigger reminder func
async function triggerReminder(context, label, subscription) {
	return await context.run(label, async () => {
		console.log(`Triggering ${label} reminder`);

		await sendReminderEmail({
			to: subscription.user.email,
			type: label,
			subscription,
		});
	});
}
