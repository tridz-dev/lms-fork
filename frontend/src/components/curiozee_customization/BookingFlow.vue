<template>
	<div class="space-y-6">
		<!-- Tutor Profile Header -->
		<div class="flex flex-col md:flex-row items-center md:items-start gap-6 border-b border-outline-gray-2 pb-5">
			<Avatar
				:image="tutor.profile_photo"
				:label="tutor.tutor_name"
				size="3xl"
				class="avatar border border-outline-gray-2 shrink-0 h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover"
			/>
			<div class="flex-1 text-center md:text-left space-y-1.5">
				<div class="flex flex-wrap items-center justify-center md:justify-start gap-3">
					<h1 class="text-2xl sm:text-3xl font-extrabold text-ink-gray-9 leading-tight">
						{{ tutor.tutor_name }}
					</h1>
					<Badge
						v-if="tutor.verification_status === 'Verified' || true"
						label="Verified"
						theme="green"
						size="sm"
					>
						<template #prefix>
							<span class="mr-1">✔</span>
						</template>
					</Badge>
				</div>
				<p class="text-sm text-ink-gray-6 flex flex-wrap justify-center md:justify-start items-center gap-2">
					<span class="font-medium">{{ tutor.years_of_experience || 0 }} {{ __('Years Experience') }}</span>
					<span class="text-ink-gray-3">•</span>
					<span>{{ tutor.timezone || systemTimezone }}</span>
				</p>
			</div>
			<div class="text-center md:text-right shrink-0 md:border-l md:pl-6 border-outline-gray-2">
				<span class="text-[10px] uppercase tracking-wider text-ink-gray-4 block mb-1">
					{{ __('Hourly Rate') }}
				</span>
				<span class="text-2xl font-black text-ink-gray-9">
					{{ TEST_BOOKING_AMOUNT }} {{ currency }}
				</span>
				<span class="text-xs text-ink-gray-5 block mt-0.5">/ {{ __('Hour') }}</span>
			</div>
		</div>

		<!-- Biography Section -->
		<div v-if="tutor.bio" class="border border-outline-gray-2 rounded-xl p-4 bg-surface-white shadow-sm space-y-2">
			<h3 class="text-xs font-bold text-ink-gray-5 uppercase tracking-wider">
				{{ __('Biography') }}
			</h3>
			<p class="text-sm text-ink-gray-7 leading-relaxed whitespace-pre-line">
				{{ tutor.bio }}
			</p>
		</div>

		<!-- Tags Grid (Subjects, Boards, Classes) -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
			<!-- Subjects Card -->
			<div class="border border-outline-gray-2 rounded-xl p-4 bg-surface-white shadow-sm space-y-2">
				<h3 class="text-xs font-bold text-ink-gray-5 uppercase tracking-wider">
					{{ __('Subjects') }}
				</h3>
				<div v-if="tutor.subjects?.length" class="flex flex-wrap gap-1.5">
					<Badge
						v-for="sub in tutor.subjects"
						:key="sub.subject"
						:label="sub.subject"
						theme="gray"
						size="md"
					/>
				</div>
				<p v-else class="text-xs text-ink-gray-4">
					{{ __('No subjects listed.') }}
				</p>
			</div>

			<!-- Boards Card -->
			<div class="border border-outline-gray-2 rounded-xl p-4 bg-surface-white shadow-sm space-y-2">
				<h3 class="text-xs font-bold text-ink-gray-5 uppercase tracking-wider">
					{{ __('Boards') }}
				</h3>
				<div v-if="tutor.boards?.length" class="flex flex-wrap gap-1.5">
					<Badge
						v-for="b in tutor.boards"
						:key="b.board"
						:label="b.board"
						theme="blue"
						size="md"
					/>
				</div>
				<p v-else class="text-xs text-ink-gray-4">
					{{ __('No boards listed.') }}
				</p>
			</div>

			<!-- Classes Card -->
			<div class="border border-outline-gray-2 rounded-xl p-4 bg-surface-white shadow-sm space-y-2">
				<h3 class="text-xs font-bold text-ink-gray-5 uppercase tracking-wider">
					{{ __('Classes') }}
				</h3>
				<div v-if="tutor.classes?.length" class="flex flex-wrap gap-1.5">
					<Badge
						v-for="c in tutor.classes"
						:key="c.class"
						:label="c.class"
						theme="orange"
						size="md"
					/>
				</div>
				<p v-else class="text-xs text-ink-gray-4">
					{{ __('No classes listed.') }}
				</p>
			</div>
		</div>

		<!-- Qualifications Section -->
		<div class="space-y-3">
			<h3 class="text-sm font-bold text-ink-gray-8 uppercase tracking-wider">
				{{ __('Qualifications') }}
			</h3>
			<div v-if="tutor.qualifications?.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
				<div
					v-for="(q, idx) in tutor.qualifications"
					:key="idx"
					class="border border-outline-gray-2 rounded-xl p-4 bg-surface-white shadow-sm space-y-2 hover:shadow-md transition-shadow"
				>
					<h4 class="font-bold text-ink-gray-9 text-sm leading-snug flex items-center gap-1.5 border-b pb-1.5 mb-1.5">
						🎓 {{ q.qualification }}
					</h4>
					<div class="space-y-1 text-xs">
						<div v-if="q.level" class="flex items-start gap-1">
							<span class="text-ink-gray-5 inline-block min-w-[90px] shrink-0 font-medium">{{ __('Level') }}:</span>
							<span class="text-ink-gray-9 font-semibold">{{ q.level }}</span>
						</div>
						<div class="flex items-start gap-1">
							<span class="text-ink-gray-5 inline-block min-w-[90px] shrink-0 font-medium">{{ __('Institution') }}:</span>
							<span class="text-ink-gray-9 font-semibold">{{ q.institution }}</span>
						</div>
						<div class="flex items-start gap-1">
							<span class="text-ink-gray-5 inline-block min-w-[90px] shrink-0 font-medium">{{ __('Year of Passing') }}:</span>
							<span class="text-ink-gray-9 font-semibold">{{ q.year_of_passing }}</span>
						</div>
						<div v-if="q.class_per" class="flex items-start gap-1">
							<span class="text-ink-gray-5 inline-block min-w-[90px] shrink-0 font-medium">{{ __('Class / Pct') }}:</span>
							<span class="text-ink-gray-9 font-semibold">{{ q.class_per }}</span>
						</div>
						<div v-if="q.maj_opt_subj" class="flex items-start gap-1">
							<span class="text-ink-gray-5 inline-block min-w-[90px] shrink-0 font-medium">{{ __('Subjects') }}:</span>
							<span class="text-ink-gray-9 font-semibold">{{ q.maj_opt_subj }}</span>
						</div>
					</div>
				</div>
			</div>
			<div v-else class="text-sm text-ink-gray-5 py-6 border border-dashed border-outline-gray-2 rounded-xl bg-surface-gray-1 text-center">
				{{ __('No qualifications listed.') }}
			</div>
		</div>

		<!-- Booking Section -->
		<div class="border border-outline-gray-2 rounded-xl p-5 bg-surface-white shadow-sm space-y-5">
			<h3 class="text-sm font-bold text-ink-gray-8 uppercase tracking-wider border-b border-outline-gray-1 pb-2">
				{{ __('Book a Session') }}
			</h3>

			<!-- Session filters: Subject / Board / Class -->
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div>
					<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider mb-1">
						{{ __('Subject') }}
					</label>
					<Select v-model="filters.subject" :options="subjectOptions" :placeholder="__('Select Subject')" />
				</div>
				<div>
					<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider mb-1">
						{{ __('Board') }}
					</label>
					<Select v-model="filters.board" :options="boardOptions" :placeholder="__('Select Board')" />
				</div>
				<div>
					<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider mb-1">
						{{ __('Class') }}
					</label>
					<Select v-model="filters.class_name" :options="classOptions" :placeholder="__('Select Class')" />
				</div>
			</div>

			<!-- Slot picker -->
			<div v-if="slotsList.loading && slots.length === 0" class="flex justify-center py-10">
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
				class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
	</div>
</template>

<script setup>
import { computed, inject, reactive, ref, watch } from 'vue'
import { Avatar, Badge, Button, LoadingIndicator, Select, toast } from 'frappe-ui'
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
 * @param {string} bookingName
 * @param {number} maxAttempts
 * @returns {Promise<string>}
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
			// Network glitch
		}
	}
	return null
}

async function onPaymentSuccess(paymentRes) {
	const bookingName = checkoutDetails.value?.booking_name || null
	checkoutDetails.value = null
	verifyingPayment.value = true

	try {
		await bookingStore.confirmPayment(paymentRes)
	} catch (e) {
		console.error('confirm_payment API failed:', e)
	}

	if (bookingName) {
		await pollBookingStatus(bookingName)
	} else {
		await new Promise((r) => setTimeout(r, 4000))
	}

	verifyingPayment.value = false
	router.push({ name: 'Sessions' })
}

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
		toast.error(__('Payment failed. Please try again from My Sessions.'))
	}
}
</script>
