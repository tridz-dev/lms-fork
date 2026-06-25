<template>
	<div class="bg-surface-white border border-outline-gray-2 rounded-xl p-6 space-y-6 shadow-sm">
		<!-- Tutor header -->
		<div class="flex flex-col sm:flex-row justify-between gap-4 border-b border-outline-gray-1 pb-5">
			<div>
				<h3 class="text-xl font-bold text-ink-gray-9">
					{{ tutor.tutor_name }}
				</h3>
				<p class="text-xs text-ink-gray-5 mt-1">
					{{ tutor.years_of_experience || 0 }}
					{{ __('years of experience') }}
					<span class="mx-1">·</span>
					{{ tutor.timezone || systemTimezone }}
				</p>
			</div>
			<div class="text-left sm:text-right shrink-0">
				<span class="text-[10px] uppercase tracking-wider text-ink-gray-4 block">
					{{ __('Hourly Rate') }}
				</span>
				<span class="text-lg font-bold text-ink-gray-9">
					{{ TEST_BOOKING_AMOUNT }} {{ currency }}
				</span>
			</div>
		</div>

		<!-- Session filters: Subject / Board / Class -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<div>
				<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider mb-1.5">
					{{ __('Subject') }}
				</label>
				<Select v-model="filters.subject" :options="subjectOptions" :placeholder="__('Select Subject')" />
			</div>
			<div>
				<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider mb-1.5">
					{{ __('Board') }}
				</label>
				<Select v-model="filters.board" :options="boardOptions" :placeholder="__('Select Board')" />
			</div>
			<div>
				<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider mb-1.5">
					{{ __('Class') }}
				</label>
				<Select v-model="filters.class_name" :options="classOptions" :placeholder="__('Select Class')" />
			</div>
		</div>

		<!-- Slot picker -->
		<div v-if="slotsList.loading && slots.length === 0" class="flex justify-center py-12">
			<LoadingIndicator class="w-8 h-8 text-ink-gray-4" />
		</div>
		<div v-else>
			<SlotPicker
				:slots="slots"
				:selectedSlotName="selectedSlot?.name"
				:systemTimezone="systemTimezone"
				:loading-more="slotsList.loading"
				:has-more="tutorStore.hasMoreSlotsBackend"
				@selectSlot="onSelectSlot"
				@loadMore="tutorStore.loadMoreSlotsBackend"
			/>
		</div>

		<!-- Booking review bar -->
		<div v-if="selectedSlot"
			class="bg-blue-50 border border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
			<div class="space-y-1">
				<h4 class="font-bold text-xs text-blue-900 uppercase tracking-wider">
					{{ __('Booking Review') }}
				</h4>
				<p class="text-xs text-blue-800">
					<span class="font-semibold text-blue-700 mr-1 uppercase">{{ __('Selected Slot') }}:</span>
					<span class="font-medium text-blue-900">{{ selectedSlotHighlight }}</span>
				</p>
				<p class="text-xs text-blue-800">
					<span class="font-semibold text-blue-700 mr-1 uppercase">{{ __('Price') }}:</span>
					{{ TEST_BOOKING_AMOUNT }} {{ currency }}
				</p>
			</div>

			<Button :loading="bookingStore.loading" variant="solid" class="w-full sm:w-auto" @click="startBooking">
				{{ __('Proceed to Pay') }}
			</Button>
		</div>

		<!-- Payment verifying overlay -->
		<div
			v-if="verifyingPayment"
			class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-4"
		>
			<LoadingIndicator class="w-10 h-10 text-blue-600" />
			<p class="text-sm font-medium text-ink-gray-7">{{ __('Verifying payment…') }}</p>
			<p class="text-xs text-ink-gray-4">{{ __('Please do not close this tab.') }}</p>
		</div>

		<!-- Razorpay headless — kept mounted until success or explicit dismiss -->
		<RazorpayCheckout
			v-if="checkoutDetails"
			:checkoutDetails="checkoutDetails"
			@success="onPaymentSuccess"
			@dismissed="onPaymentDismissed"
		/>
	</div>
</template>

<script setup>
import { computed, inject, reactive, ref, watch } from 'vue'
import { Button, LoadingIndicator, Select, toast } from 'frappe-ui'
import { useTutorStore } from '@/stores/useTutorStore'
import { useBookingStore } from '@/stores/useBookingStore'
import { systemSettings } from '@/resources/bookTutor'
import SlotPicker from './SlotPicker.vue'
import RazorpayCheckout from './RazorpayCheckout.vue'
import { useRouter } from 'vue-router'
import { formatTimeRangeLocal, convertToLocal, getBrowserTimezone } from '@/utils/timezone'

// Temporary: centralized test booking amount — restore to tutor.hourly_rate when live
const TEST_BOOKING_AMOUNT = 500

const props = defineProps({
	tutor: { type: Object, required: true },
})

const dayjs = inject('$dayjs')
const router = useRouter()
const tutorStore = useTutorStore()
const bookingStore = useBookingStore()

// ── Dynamic currency + timezone from system settings ───────────────────────
const currency = computed(() => systemSettings.data?.currency || 'INR')
const systemTimezone = computed(() => systemSettings.data?.timezone || 'UTC')

// ── Per-booking filters ────────────────────────────────────────────────────
const filters = reactive({
	subject: props.tutor.subjects?.[0]?.subject || '',
	board: props.tutor.boards?.[0]?.board || '',
	class_name: props.tutor.classes?.[0]?.class || '',
})

// Build Select options from tutor child tables
const subjectOptions = computed(() =>
	(props.tutor.subjects || []).map((s) => ({ label: s.subject, value: s.subject }))
)
const boardOptions = computed(() =>
	(props.tutor.boards || []).map((b) => ({ label: b.board, value: b.board }))
)
const classOptions = computed(() =>
	(props.tutor.classes || []).map((c) => ({ label: c.class, value: c.class }))
)

const selectedSlot = ref(null)
const selectedSlotHighlight = computed(() => {
	if (!selectedSlot.value) return ''
	const startLocal = convertToLocal(selectedSlot.value.start_datetime)
	const endLocal = convertToLocal(selectedSlot.value.end_datetime)
	if (!startLocal || !endLocal) return ''
	const tz = getBrowserTimezone()
	return `date - ${startLocal.format('DD MMM YYYY')}, time - ${startLocal.format('hh:mm A')} – ${endLocal.format('hh:mm A')} (${tz})`
})
const checkoutDetails = ref(null)

/**
 * verifyingPayment is shown as an overlay while we poll the backend waiting
 * for the booking to transition from Pending Payment → Confirmed.
 * This handles the race between the frontend callback and the Razorpay webhook.
 */
const verifyingPayment = ref(false)

const slotsList = tutorStore.slotsList
const slots = computed(() => tutorStore.accumulatedSlots)

// Reset filters when tutor changes
watch(
	() => props.tutor.name,
	() => {
		filters.subject = props.tutor.subjects?.[0]?.subject || ''
		filters.board = props.tutor.boards?.[0]?.board || ''
		filters.class_name = props.tutor.classes?.[0]?.class || ''
	},
	{ immediate: true }
)

// Sync to tutorStore filters → triggers slot search
watch(
	filters,
	() => {
		selectedSlot.value = null
		tutorStore.filters.tutor = props.tutor.name
		tutorStore.filters.subject = filters.subject
		tutorStore.filters.board = filters.board
		tutorStore.filters.class_name = filters.class_name
	},
	{ immediate: true, deep: true }
)

function onSelectSlot(slot) {
	selectedSlot.value = slot
}

function formatSlotTime(start, end) {
	return formatTimeRangeLocal(start, end)
}

async function startBooking() {
	if (!selectedSlot.value) return
	if (!filters.subject || !filters.board || !filters.class_name) {
		toast.error(__('Please select a Subject, Board, and Class.'))
		return
	}
	try {
		const res = await bookingStore.initiateBooking({
			slot: selectedSlot.value.name,
			tutor: props.tutor.name,
			amount: TEST_BOOKING_AMOUNT,
			currency: currency.value,
			subject: filters.subject,
			board: filters.board,
			class_name: filters.class_name,
		})
		if (res) checkoutDetails.value = res
	} catch (e) {
		console.error('Booking initiation failed:', e)
	}
}

/**
 * Poll the backend until the booking reaches a terminal confirmation state.
 *
 * After Razorpay's handler() fires we call confirm_payment() which triggers
 * RazorpayOrder.handle_success → our on_update hook → confirm_booking().
 * However, there is a race: the webhook may arrive before or after the API
 * response. We poll to show the user accurate status rather than redirecting
 * to a page with stale Pending Payment data.
 *
 * @param {string} bookingName
 * @param {number} maxAttempts   Max polling iterations (default 15 × 2s = 30s)
 * @returns {Promise<string>}    Final booking_status observed
 */
async function pollBookingStatus(bookingName, maxAttempts = 15) {
	for (let i = 0; i < maxAttempts; i++) {
		await new Promise((r) => setTimeout(r, 2000))
		try {
			const result = await bookingStore.getBookingStatus(bookingName)
			const status = result?.booking_status
			if (status && status !== 'Pending Payment') {
				return status
			}
		} catch (_) {
			// Network glitch — keep polling
		}
	}
	// Timeout: webhook may still be in flight; return null to signal timeout
	return null
}

/**
 * onPaymentSuccess — fires from RazorpayCheckout handler() after SUCCESSFUL payment.
 *
 * Razorpay's built-in retry flow:
 *   attempt 1 → payment.failed (ignored by component)
 *   attempt 2 → payment succeeds → handler() fires → THIS function
 *
 * Flow:
 *   1. Tear down the checkout widget (order complete — modal is closed by Razorpay)
 *   2. Call confirm_payment() to verify signature & trigger hook → confirm_booking()
 *   3. Show "Verifying…" overlay while polling for confirmation
 *   4. Redirect to Sessions on confirmation (or timeout)
 */
async function onPaymentSuccess(paymentRes) {
	// Capture booking_name BEFORE clearing checkoutDetails — needed for polling
	// even when confirmPayment() throws.
	const bookingName = checkoutDetails.value?.booking_name || null

	// Razorpay modal is now closed. Safe to unmount the checkout component.
	checkoutDetails.value = null
	verifyingPayment.value = true

	try {
		await bookingStore.confirmPayment(paymentRes)
	} catch (e) {
		console.error('confirm_payment API failed:', e)
		// Webhook will still confirm the booking — proceed to poll anyway.
	}

	if (bookingName) {
		await pollBookingStatus(bookingName)
	} else {
		// Fallback: wait a few seconds for the webhook to process
		await new Promise((r) => setTimeout(r, 4000))
	}

	verifyingPayment.value = false
	router.push({ name: 'Sessions' })
}

/**
 * onPaymentDismissed — fires from RazorpayCheckout ondismiss handler.
 *
 * The student explicitly closed the Razorpay modal WITHOUT completing payment.
 * This is the ONLY path that should call reportFailure() on the backend,
 * because at this point we know the student has given up and is not retrying.
 *
 * errorData will be null if the student closed before attempting any payment,
 * or will contain the last payment error if they failed and then closed.
 *
 * Scenario B (fail → close): errorData present → report failure
 * Scenario C (open → close without attempt): errorData null → just clean up
 */
async function onPaymentDismissed(errorData) {
	checkoutDetails.value = null

	if (errorData?.order_id) {
		// Student attempted payment but failed, then closed → report to backend
		try {
			await bookingStore.reportFailure(
				errorData.order_id,
				errorData.error_code,
				errorData.error_description
			)
		} catch (e) {
			console.error('Failed to report payment failure:', e)
		}
		toast.error(__('Payment failed. Please try again from My Sessions.'))
	}
	// If errorData is null, student just closed without trying — no backend call needed.
}
</script>
