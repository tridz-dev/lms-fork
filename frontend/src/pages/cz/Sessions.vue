<template>
	<div>
		<LayoutHeader>
			<template #left-header>
				<Breadcrumbs class="h-7" :items="breadcrumbs" />
			</template>
			<template #right-header>
				<router-link :to="{ name: 'BookSession' }">
					<Button variant="solid" class="text-xs font-semibold">
						{{ __('Book a Tutor') }}
					</Button>
				</router-link>
			</template>
		</LayoutHeader>

		<div class="mx-auto flex min-h-0 w-full flex-1 flex-col p-5 max-w-6xl">
			<div class="space-y-6">
				<div class="border-b pb-4">
					<h2 class="text-xl font-semibold text-ink-gray-9">{{ __('My Booked Sessions') }}</h2>
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

				<div v-else class="text-center py-20 text-ink-gray-5 border rounded-md bg-surface-white">
					{{ __('No sessions found matching this status filter.') }}
				</div>
			</div>
		</div>

		<RazorpayCheckout
			v-if="checkoutDetails"
			:checkoutDetails="checkoutDetails"
			@success="onPaymentSuccess"
			@failure="onPaymentFailure"
		/>
	</div>
</template>

<script setup>
import { computed, inject, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { Breadcrumbs, Button, TabButtons, LoadingIndicator, toast } from 'frappe-ui'
import { useSessionStore } from '@/stores/useSessionStore'
import { useBookingStore } from '@/stores/useBookingStore'
import SessionCard from '@/components/cz/SessionCard.vue'
import RazorpayCheckout from '@/components/cz/RazorpayCheckout.vue'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'
import { isSessionUpcoming } from '@/utils/timezone'

const sessionStore = useSessionStore()
const bookingStore = useBookingStore()
const socket = inject('$socket')

const checkoutDetails = ref(null)
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
		(s.booking_status === 'Confirmed' || s.booking_status === 'Pending Payment' || s.booking_status === 'Payment Success') &&
		isSessionUpcoming(s.start_datetime)
	).length
	const completed = sessionStore.sessions.filter(s =>
		s.booking_status === 'Completed' ||
		((s.booking_status === 'Confirmed' || s.booking_status === 'Pending Payment' || s.booking_status === 'Payment Success') &&
		!isSessionUpcoming(s.start_datetime))
	).length
	const cancelled = sessionStore.sessions.filter(s => s.booking_status === 'Cancelled').length
	const failed = sessionStore.sessions.filter(s => s.booking_status === 'Expired' || s.booking_status === 'Failed').length

	return [
		{ value: 'upcoming', label: `${__('Upcoming')} (${upcoming})` },
		{ value: 'completed', label: `${__('Completed')} (${completed})` },
		{ value: 'cancelled', label: `${__('Cancelled')} (${cancelled})` },
		{ value: 'failed', label: `${__('Failed')} (${failed})` },
	]
})

const filteredSessions = computed(() => {
	if (!sessionStore.sessions) return []
	if (activeTab.value === 'upcoming') {
		return sessionStore.sessions.filter(s =>
			(s.booking_status === 'Confirmed' || s.booking_status === 'Pending Payment' || s.booking_status === 'Payment Success') &&
			isSessionUpcoming(s.start_datetime)
		)
	} else if (activeTab.value === 'completed') {
		return sessionStore.sessions.filter(s =>
			s.booking_status === 'Completed' ||
			((s.booking_status === 'Confirmed' || s.booking_status === 'Pending Payment' || s.booking_status === 'Payment Success') &&
			!isSessionUpcoming(s.start_datetime))
		)
	} else if (activeTab.value === 'cancelled') {
		return sessionStore.sessions.filter(s => s.booking_status === 'Cancelled')
	} else {
		return sessionStore.sessions.filter(s => s.booking_status === 'Expired' || s.booking_status === 'Failed')
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

function onPaymentSuccess() {
	checkoutDetails.value = null
	sessionStore.fetchHistory()
}

async function onPaymentFailure(errorRes) {
	checkoutDetails.value = null
	if (errorRes.order_id) {
		await bookingStore.reportFailure(
			errorRes.order_id,
			errorRes.error_code,
			errorRes.error_description
		)
	}
	sessionStore.fetchHistory()
}
</script>
