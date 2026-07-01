<template>
	<div>
		<LayoutHeader>
			<template #left-header>
				<Breadcrumbs class="h-7" :items="breadcrumbs" />
			</template>
			<template #right-header>
				<router-link :to="{ name: 'BookSession' }">
					<Button variant="solid">
						{{ __('Book a Tutor') }}
					</Button>
				</router-link>
			</template>
		</LayoutHeader>

		<div class="flex min-h-0 w-full flex-1 flex-col p-5 pb-10">
			<div class="space-y-6">
				<div class="border-b pb-4">
					<h2 class="text-2xl font-semibold text-ink-gray-9">{{ __('My Booked Sessions') }}</h2>
					<p class="text-sm text-ink-gray-5 mt-1">{{ __('View and manage your live tutoring sessions.') }}</p>
				</div>

				<!-- Section Tabs -->
				<div class="mb-4 overflow-x-auto whitespace-nowrap pb-1">
					<TabButtons
						class="inline-block"
						:buttons="tabButtons"
						v-model="activeTab"
					/>
				</div>

				<!-- Sessions List -->
				<div v-if="filteredSessions.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<SessionCard
						v-for="session in filteredSessions"
						:key="session.name"
						:session="session"
						@retryPayment="handleRetryPayment"
						@sessionCancelled="sessionStore.fetchHistory()"
					/>
				</div>

				<div v-else class="text-center py-20 border border-outline-gray-2 rounded-md bg-surface-white">
					<p class="text-sm text-ink-gray-5">{{ __('No sessions found matching this status filter.') }}</p>
				</div>
			</div>
		</div>

		<!-- Verifying payment overlay for the Pay Now retry flow -->
		<div
			v-if="verifyingPayment"
			class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-4"
		>
			<LoadingIndicator class="w-10 h-10 text-blue-600" />
			<p class="text-sm font-medium text-ink-gray-7">{{ __('Verifying payment…') }}</p>
			<p class="text-xs text-ink-gray-4">{{ __('Please do not close this tab.') }}</p>
		</div>

		<RazorpayCheckout
			v-if="checkoutDetails"
			:checkoutDetails="checkoutDetails"
			@success="onPaymentSuccess"
			@dismissed="onPaymentDismissed"
		/>
	</div>
</template>

<script setup>
import { computed, inject, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { Breadcrumbs, Button, TabButtons, LoadingIndicator, toast } from 'frappe-ui'
import { useSessionStore } from '@/stores/useSessionStore'
import { useBookingStore } from '@/stores/useBookingStore'
import SessionCard from '@/components/curiozee_customization/SessionCard.vue'
import RazorpayCheckout from '@/components/curiozee_customization/RazorpayCheckout.vue'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'
import { isSessionUpcoming } from '@/utils/timezone'

const sessionStore = useSessionStore()
const bookingStore = useBookingStore()
const socket = inject('$socket')

const checkoutDetails = ref(null)
const verifyingPayment = ref(false)
const activeTab = ref('upcoming')

let pollInterval = null

function startPollingIfNeeded() {
	if (pollInterval) return

	const hasPendingMeeting = sessionStore.sessions.some(
		s => s.booking_status === 'Confirmed' && !s.meeting_link
	)

	if (hasPendingMeeting) {
		pollInterval = setInterval(async () => {
			await sessionStore.fetchHistory()
			
			const stillPending = sessionStore.sessions.some(
				s => s.booking_status === 'Confirmed' && !s.meeting_link
			)
			if (!stillPending) {
				stopPolling()
			}
		}, 5000)
	}
}

function stopPolling() {
	if (pollInterval) {
		clearInterval(pollInterval)
		pollInterval = null
	}
}

watch(() => sessionStore.sessions, () => {
	startPollingIfNeeded()
}, { deep: true })

onMounted(() => {
	sessionStore.fetchHistory()
	
	if (socket) {
		socket.on('booking_meeting_updated', (data) => {
			if (data && data.booking) {
				const found = sessionStore.sessions.find(s => s.name === data.booking)
				if (found) {
					found.meeting_link = data.meeting_link
				}
			}
		})
	}
})

onBeforeUnmount(() => {
	stopPolling()
	if (socket) {
		socket.off('booking_meeting_updated')
	}
})

const breadcrumbs = computed(() => [
	{ label: __('Sessions'), route: { name: 'Sessions' } }
])

const tabButtons = computed(() => {
	const upcoming = sessionStore.sessions.filter(s =>
		(s.booking_status === 'Confirmed' || s.booking_status === 'Pending Payment' || s.booking_status === 'Payment Success' || s.booking_status === 'Failed') &&
		isSessionUpcoming(s.start_datetime)
	).length
	const confirmed = sessionStore.sessions.filter(s =>
		(s.booking_status === 'Confirmed' || s.booking_status === 'Pending Payment' || s.booking_status === 'Payment Success' || s.booking_status === 'Failed') &&
		!isSessionUpcoming(s.start_datetime)
	).length
	const completed = sessionStore.sessions.filter(s =>
		s.booking_status === 'Completed'
	).length
	const cancelled = sessionStore.sessions.filter(s => s.booking_status === 'Cancelled').length
	// const failed = sessionStore.sessions.filter(s => s.booking_status === 'Expired').length

	return [
		{ value: 'upcoming', label: `${__('Upcoming')} (${upcoming})` },
		{ value: 'confirmed', label: `${__('Confirmed')} (${confirmed})` },
		{ value: 'completed', label: `${__('Completed')} (${completed})` },
		{ value: 'cancelled', label: `${__('Cancelled')} (${cancelled})` },
		// { value: 'failed', label: `${__('Expired')} (${failed})` },
	]
})

const filteredSessions = computed(() => {
	if (!sessionStore.sessions) return []
	if (activeTab.value === 'upcoming') {
		return sessionStore.sessions.filter(s =>
			(s.booking_status === 'Confirmed' || s.booking_status === 'Pending Payment' || s.booking_status === 'Payment Success' || s.booking_status === 'Failed') &&
			isSessionUpcoming(s.start_datetime)
		)
	} else if (activeTab.value === 'confirmed') {
		return sessionStore.sessions.filter(s =>
			(s.booking_status === 'Confirmed' || s.booking_status === 'Pending Payment' || s.booking_status === 'Payment Success' || s.booking_status === 'Failed') &&
			!isSessionUpcoming(s.start_datetime)
		)
	} else if (activeTab.value === 'completed') {
		return sessionStore.sessions.filter(s =>
			s.booking_status === 'Completed'
		)
	} else if (activeTab.value === 'cancelled') {
		return sessionStore.sessions.filter(s => s.booking_status === 'Cancelled')
	}
})

async function handleRetryPayment(bookingName) {
	try {
		// retry_booking clears the stale Razorpay order and creates a fresh one
		// so the student pays on the same slot without re-selecting it.
		const res = await bookingStore.retryBooking(bookingName)
		if (res) checkoutDetails.value = res
	} catch (e) {
		console.error('Failed to initiate payment retry:', e)
		const msg = e?.message || e?.exc_type
			? __('Unable to retry payment. The booking may have expired. Please book a new session.')
			: __('Something went wrong. Please try again.')
		toast.error(msg)
	}
}

/**
 * onPaymentSuccess — fires from RazorpayCheckout handler() after payment succeeds.
 *
 * Must call confirm_payment() to verify the signature and trigger confirm_booking()
 * synchronously on the backend, then poll until the booking is Confirmed before
 * refreshing the sessions list. Without this, fetchHistory() races against the
 * backend and returns the stale "Pending Payment" state.
 */
async function onPaymentSuccess(paymentRes) {
	// Capture booking_name before clearing checkoutDetails
	const bookingName = checkoutDetails.value?.booking_name || null

	checkoutDetails.value = null
	verifyingPayment.value = true

	let paymentConfirmed = false
	try {
		await bookingStore.confirmPayment(paymentRes)
		paymentConfirmed = true
	} catch (e) {
		console.error('confirm_payment failed in Sessions.vue:', e)
		toast.error(e.messages?.[0] || e.message || __('Payment confirmation failed.'))
	}

	// Poll until Confirmed (or timeout after 30 s)
	if (paymentConfirmed && bookingName) {
		for (let i = 0; i < 15; i++) {
			await new Promise((r) => setTimeout(r, 2000))
			try {
				const result = await bookingStore.getBookingStatus(bookingName)
				if (result?.booking_status && result.booking_status !== 'Pending Payment') break
			} catch (_) { /* network glitch — keep polling */ }
		}
	} else if (!paymentConfirmed) {
		verifyingPayment.value = false
		sessionStore.fetchHistory()
		return
	} else {
		await new Promise((r) => setTimeout(r, 4000))
	}

	verifyingPayment.value = false
	sessionStore.fetchHistory()
}

/**
 * onPaymentDismissed — fires when the student explicitly closes the Razorpay modal.
 * Report the last failure to the backend only if a payment was actually attempted.
 */
async function onPaymentDismissed(errorData) {
	checkoutDetails.value = null
	if (errorData?.order_id) {
		try {
			await bookingStore.reportFailure(
				errorData.order_id,
				errorData.error_code,
				errorData.error_description
			)
		} catch (e) {
			console.error('Failed to report payment failure:', e)
		}
		toast.error(__('Payment failed. Please try again.'))
	}
	sessionStore.fetchHistory()
}
</script>
