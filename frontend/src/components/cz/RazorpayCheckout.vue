<template>
	<!-- Headless Razorpay integration wrapper -->
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
	checkoutDetails: {
		type: Object,
		default: null,
	},
})

const emit = defineEmits(['success', 'failure', 'dismissed'])

/**
 * Tracks whether a payment failure occurred during the current modal session.
 * Used to distinguish two ondismiss cases:
 *   A) User closed modal without attempting payment (no failure) → don't report
 *   B) User failed payment then closed modal               → report failure
 *
 * Reset to null whenever a fresh Razorpay modal is opened.
 */
const lastFailureError = ref(null)

function loadRazorpay() {
	return new Promise((resolve) => {
		if (window.Razorpay) {
			resolve(true)
			return
		}
		const script = document.createElement('script')
		script.src = 'https://checkout.razorpay.com/v1/checkout.js'
		script.onload = () => resolve(true)
		script.onerror = () => resolve(false)
		document.body.appendChild(script)
	})
}

async function startPayment() {
	if (!props.checkoutDetails) return

	const loaded = await loadRazorpay()
	if (!loaded) {
		emit('failure', {
			reason: 'Failed to load Razorpay SDK',
			dismissed: true,
		})
		return
	}

	// Reset failure tracking for this modal session.
	lastFailureError.value = null

	const options = {
		key: props.checkoutDetails.key_id,
		amount: props.checkoutDetails.amount,
		currency: props.checkoutDetails.currency,
		name: 'Curiozee Marketplace',
		description: props.checkoutDetails.description,
		order_id: props.checkoutDetails.order_id,

		/**
		 * handler() fires on PAYMENT SUCCESS — including after an internal retry.
		 * This is the ONLY path that should trigger confirmPayment() on the backend.
		 * The component must remain mounted until this fires, so we never null out
		 * checkoutDetails inside onPaymentFailure.
		 */
		handler: function (response) {
			emit('success', {
				razorpay_payment_id: response.razorpay_payment_id,
				razorpay_order_id: response.razorpay_order_id,
				razorpay_signature: response.razorpay_signature,
			})
		},

		modal: {
			/**
			 * ondismiss fires when the student explicitly CLOSES the Razorpay modal
			 * without completing a successful payment.
			 *
			 * Razorpay's built-in retry flow works as follows:
			 *   payment.failed  → Razorpay shows "Retry Payment" screen (modal stays open)
			 *   student retries → payment succeeds → handler() fires   (NOT ondismiss)
			 *   student retries → payment fails again                  (modal stays open)
			 *   student closes  → ondismiss fires                      (THIS handler)
			 *
			 * We report the failure to the backend ONLY here, not in payment.failed,
			 * because reporting in payment.failed would call RazorpayOrder.handle_failure()
			 * which corrupts the order state and blocks the retry from being confirmed.
			 */
			ondismiss: function () {
				emit('dismissed', lastFailureError.value || null)
			},
		},

		prefill: {
			email: props.checkoutDetails.student,
		},
		theme: {
			color: '#2563eb',
		},
	}

	const rzp = new window.Razorpay(options)

	/**
	 * payment.failed fires on EVERY failed payment attempt within this modal.
	 * When Razorpay's internal retry is active, the modal remains open and the
	 * student can attempt a different payment method.
	 *
	 * DO NOT emit 'failure' here — that would cause BookingFlow to:
	 *   1. Unmount this component (removing the handler() listener)
	 *   2. Call reportFailure() → RazorpayOrder.handle_failure() → corrupts order state
	 *
	 * We only store the error details so ondismiss can report them if needed.
	 */
	rzp.on('payment.failed', function (response) {
		lastFailureError.value = {
			order_id: props.checkoutDetails.order_id,
			error_code: response.error.code,
			error_description: response.error.description,
		}
	})

	rzp.open()
}

watch(
	() => props.checkoutDetails,
	(newDetails) => {
		if (newDetails) {
			startPayment()
		}
	},
	{ immediate: true }
)
</script>
