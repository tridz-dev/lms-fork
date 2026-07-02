<template>
	<div class="w-full">
		<!-- Banner Cover Image -->
		<div class="group relative h-[130px] w-full">
			<img
				v-if="tutor.cover_image"
				:src="tutor.cover_image"
				class="h-[130px] w-full object-cover object-center"
			/>
			<div
				v-else
				class="h-[130px] w-full bg-surface-gray-2"
			></div>
		</div>

		<!-- Main Layout Container -->
		<div class="mx-auto -mt-10 md:-mt-4 max-w-4xl w-full px-5">
			<!-- Tutor Profile Header -->
			<div class="flex flex-col md:flex-row items-center justify-between gap-6 pb-5">
				<div class="flex flex-col md:flex-row items-center">
					<div>
						<div class="relative">
							<img
								v-if="tutor.profile_photo"
								:src="tutor.profile_photo"
								class="object-cover h-[100px] w-[100px] rounded-full border-4 border-white shadow-sm"
							/>
							<div
								v-else
								class="flex items-center justify-center h-[100px] w-[100px] rounded-full border-4 border-white bg-surface-gray-2 text-3xl font-semibold text-ink-gray-7 shadow-sm"
							>
								{{ (tutor.tutor_name || 'T').charAt(0).toUpperCase() }}
							</div>
						</div>
					</div>
					<div class="text-center md:text-left md:ms-6 mt-5 md:mt-0 flex-1">
						<div class="flex flex-wrap items-center justify-center md:justify-start gap-3">
							<h2 class="text-3xl font-semibold text-ink-gray-9">
								{{ tutor.tutor_name }}
							</h2>
							<Badge
								v-if="tutor.verification_status"
								:theme="tutor.verification_status === 'Verified' ? 'green' : 'gray'"
								size="sm"
							>
								{{ tutor.verification_status }}
							</Badge>
						</div>
						<p class="text-sm text-ink-gray-5 mt-1">
							<span class="font-medium">{{ tutor.years_of_experience || 0 }} {{ __('Years of Experience') }}</span>
							<span class="mx-2 text-ink-gray-3">•</span>
							<span>{{ tutor.timezone || systemTimezone }}</span>
						</p>
					</div>
				</div>

				<!-- Hourly Rate -->
				<!-- <div class="text-center md:text-right shrink-0 bg-surface-white px-5 py-3 border border-outline-gray-2 rounded-xl shadow-sm">
					<span class="text-[10px] uppercase tracking-wider text-ink-gray-4 block mb-1">
						{{ __('Hourly Rate') }}
					</span>
					<span class="text-2xl font-black text-ink-gray-9">
						{{ TEST_BOOKING_AMOUNT }} {{ currency }}
					</span>
					<span class="text-xs text-ink-gray-5 block mt-0.5">/ {{ __('Hour') }}</span>
				</div> -->
			</div>

			<!-- Tabs Navigation -->
			<div class="mb-4 mt-10">
				<TabButtons class="inline-block" :buttons="profileTabs" v-model="activeTab" />
			</div>

			<!-- TAB: Profile Details -->
			<div v-show="activeTab === 'profile'" class="space-y-6 max-w-2xl mt-6 pb-10">
				<div class="space-y-6">
					<div class="space-y-4">
						<FormControl :modelValue="tutor.tutor_name" :disabled="true" type="text" :label="__('Display Name')" />
						<FormControl :modelValue="tutor.timezone" :disabled="true" type="text" :label="__('Timezone')" />
						<FormControl :modelValue="tutor.years_of_experience" :disabled="true" type="number" :label="__('Years of Experience')" />
					</div>

					<FormControl :modelValue="tutor.bio" :disabled="true" type="textarea" rows="4" :label="__('Biography')" />

					<!-- Subjects -->
					<div class="border-t pt-5">
						<div class="space-y-2">
							<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Subjects Taught') }}</label>
							<div class="flex flex-wrap gap-2">
								<Badge
									v-for="sub in tutor.subjects"
									:key="sub.subject"
									theme="gray"
									size="md"
								>
									{{ sub.subject }}
								</Badge>
								<p v-if="!tutor.subjects?.length" class="text-sm text-ink-gray-5">{{ __('No subjects specified.') }}</p>
							</div>
						</div>
					</div>

					<!-- Boards -->
					<div class="border-t pt-5">
						<div class="space-y-2">
							<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Boards Supported') }}</label>
							<div class="flex flex-wrap gap-2">
								<Badge
									v-for="brd in tutor.boards"
									:key="brd.board"
									theme="gray"
									size="md"
								>
									{{ brd.board }}
								</Badge>
								<p v-if="!tutor.boards?.length" class="text-sm text-ink-gray-5">{{ __('No boards specified.') }}</p>
							</div>
						</div>
					</div>

					<!-- Classes -->
					<div class="border-t pt-5">
						<div class="space-y-2">
							<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Classes Target') }}</label>
							<div class="flex flex-wrap gap-2">
								<Badge
									v-for="cls in tutor.classes"
									:key="cls.class"
									theme="gray"
									size="md"
								>
									{{ cls.class }}
								</Badge>
								<p v-if="!tutor.classes?.length" class="text-sm text-ink-gray-5">{{ __('No classes specified.') }}</p>
							</div>
						</div>
					</div>

					<!-- Qualifications -->
					<div class="border-t pt-5 space-y-4">
						<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Qualifications') }}</label>

						<div v-if="tutor.qualifications?.length" class="space-y-2.5">
							<div v-for="(q, idx) in tutor.qualifications" :key="idx"
								class="flex items-start justify-between border border-outline-gray-2 rounded-md px-4 py-3 text-sm text-ink-gray-7 bg-surface-white hover:border-outline-gray-3">
								<div class="space-y-1">
									<div class="flex flex-wrap gap-2 items-center text-ink-gray-9">
										<span class="font-semibold">{{ q.qualification }}</span>
										<span class="text-ink-gray-4">·</span>
										<span>{{ q.institution }}</span>
										<span class="text-ink-gray-4">·</span>
										<span class="font-medium text-ink-gray-5">{{ q.year_of_passing }}</span>
									</div>
									<div class="text-xs text-ink-gray-5 flex flex-wrap gap-x-3 gap-y-1">
										<span v-if="q.level"><strong>Level:</strong> {{ q.level }}</span>
										<span v-if="q.class_per"><strong>Class/Pct:</strong> {{ q.class_per }}</span>
										<span v-if="q.maj_opt_subj"><strong>Subjects:</strong> {{ q.maj_opt_subj }}</span>
									</div>
								</div>
							</div>
						</div>
						<div v-else
							class="text-sm text-ink-gray-5 bg-surface-gray-2 border border-outline-gray-2 border-dashed rounded-md p-4 text-center">
							{{ __('No qualifications specified.') }}
						</div>
					</div>
				</div>
			</div>

			<!-- TAB: Book Session -->
			<div v-show="activeTab === 'book'" class="space-y-6 mt-6 pb-10">
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
					class="bg-surface-gray-2 border border-outline-gray-2 rounded-md p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div class="space-y-1">
						<h4 class="font-semibold text-xs text-ink-gray-9 uppercase tracking-wider">
							{{ __('Booking Review') }}
						</h4>
						<p class="text-xs text-ink-gray-7">
							<span class="font-semibold text-ink-gray-5 mr-1 uppercase">{{ __('Selected Slot') }}:</span>
							<span class="font-medium text-ink-gray-9">{{ selectedSlotHighlight }}</span>
						</p>
						<p class="text-xs text-ink-gray-7">
							<span class="font-semibold text-ink-gray-5 mr-1 uppercase">{{ __('Price') }}:</span>
							<span class="font-medium text-ink-gray-9">{{ TEST_BOOKING_AMOUNT }} {{ currency }}</span>
						</p>
					</div>

					<Button :loading="bookingStore.loading" variant="solid" @click="startBooking">
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
	</div>
</template>

<script setup>
import { computed, inject, reactive, ref, watch } from 'vue'
import { Avatar, Badge, Button, FormControl, LoadingIndicator, Select, TabButtons, toast } from 'frappe-ui'
import { useTutorStore } from '@/stores/useTutorStore'
import { useBookingStore } from '@/stores/useBookingStore'
import { systemSettings } from '@/resources/bookTutor'
import SlotPicker from './SlotPicker.vue'
import RazorpayCheckout from './RazorpayCheckout.vue'
import { useRouter } from 'vue-router'
import { formatTimeRangeLocal, convertToLocal, getBrowserTimezone } from '@/utils/timezone'

// Tabs definition
const activeTab = ref('profile')
const profileTabs = computed(() => [
	{ value: 'profile', label: __('Profile Details') },
	{ value: 'book', label: __('Book Session') },
])

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
		toast.error(e.messages?.[0] || e.message || __('Booking initiation failed.'))
	}
}

/**
 * Poll the backend until the booking reaches a terminal confirmation state.
 */
async function pollBookingStatus(bookingName) {
	for (let i = 0; i < 15; i++) {
		await new Promise((r) => setTimeout(r, 2000))
		try {
			const result = await bookingStore.getBookingStatus(bookingName)
			if (result?.booking_status && result.booking_status !== 'Pending Payment') {
				return result
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

	let paymentConfirmed = false
	try {
		await bookingStore.confirmPayment(paymentRes)
		paymentConfirmed = true
	} catch (e) {
		console.error('confirm_payment API failed:', e)
		toast.error(e.messages?.[0] || e.message || __('Payment confirmation failed.'))
	}

	if (paymentConfirmed && bookingName) {
		await pollBookingStatus(bookingName)
	} else if (!paymentConfirmed) {
		verifyingPayment.value = false
		return
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
