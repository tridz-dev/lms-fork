<template>
	<div class="bg-surface-white border border-outline-gray-2 rounded-xl p-6 space-y-6 shadow-sm">
		<!-- Tutor header -->
		<div class="flex flex-col sm:flex-row justify-between gap-4 border-b border-outline-gray-1 pb-5">
			<div>
				<h3 class="text-xl font-bold text-ink-gray-9">
					{{ tutor.tutor_name }}
				</h3>
				<p class="text-xs text-ink-gray-5 mt-1">
					{{ tutor.years_of_experience || tutor.years_of_experience || 0 }}
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

		<!-- Razorpay headless -->
		<RazorpayCheckout v-if="checkoutDetails" :checkoutDetails="checkoutDetails" @success="onPaymentSuccess"
			@failure="onPaymentFailure" />
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

async function onPaymentSuccess(paymentRes) {
	checkoutDetails.value = null
	try {
		await bookingStore.confirmPayment(paymentRes)
	} catch (e) {
		console.error('Failed to confirm payment:', e)
	}
	router.push({ name: 'Sessions' })
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
	toast.error(__('Payment failed. Please try again.'))
}
</script>
