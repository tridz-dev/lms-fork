<template>
	<div>
		<LayoutHeader>
			<template #left-header>
				<Breadcrumbs class="h-7" :items="breadcrumbs" />
			</template>
			<template #right-header>
				<div class="flex items-center gap-2">
					<!-- View Toggle -->
					<TabButtons
						class="inline-block"
						:buttons="viewButtons"
						v-model="activeView"
					/>
					<Button
						:loading="regenerating"
						v-if="profile"
						@click="triggerRegenerate"
						variant="outline"
						class="text-xs font-semibold"
					>
						{{ __('Regenerate Slots') }}
					</Button>
				</div>
			</template>
		</LayoutHeader>

		<div class="mx-auto flex min-h-0 w-full flex-1 flex-col p-5 max-w-6xl">
			<!-- Loading State -->
			<div v-if="dashboardStore.dashboardData.loading" class="flex justify-center py-20">
				<LoadingIndicator class="w-10 h-10 text-gray-400" />
			</div>

			<!-- Empty State: No Profile -->
			<div v-else-if="!profile" class="text-center py-20 border rounded-md space-y-4 bg-surface-white">
				<div class="flex flex-col items-center justify-center space-y-2">
					<div class="p-3 bg-surface-gray-2 rounded-full">
						<CalendarIcon class="w-8 h-8 text-ink-gray-5 stroke-1.5" />
					</div>
					<h3 class="text-lg font-medium text-ink-gray-9">{{ __('No Tutor Profile linked to your account') }}</h3>
					<p class="text-sm text-ink-gray-7 max-w-sm">
						{{ __('Please create your tutor profile first to manage generated bookable slots.') }}
					</p>
				</div>
				<router-link
					:to="{ name: 'TutorProfile' }"
					class="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
				>
					{{ __('Create Tutor Profile') }}
				</router-link>
			</div>

			<!-- Main Content -->
			<div v-else class="space-y-5">
				<!-- Header row: title + status counts -->
				<div class="border-b pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div>
						<h2 class="text-xl font-semibold text-ink-gray-9">{{ __('Generated Availability Slots') }}</h2>
						<p class="text-sm text-ink-gray-5 mt-0.5">{{ __('Manage your available slots and view linked booking states.') }}</p>
					</div>
					<div class="flex items-center gap-3 text-xs text-ink-gray-5 shrink-0">
						<span class="flex items-center gap-1.5">
							<span class="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
							{{ __('Available') }} ({{ countByStatus('Available') }})
						</span>
						<span class="flex items-center gap-1.5">
							<span class="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
							{{ __('Booked') }} ({{ countByStatus('Booked') }})
						</span>
						<span class="flex items-center gap-1.5">
							<span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
							{{ __('Locked') }} ({{ countByStatus('Temporarily Locked') }})
						</span>
					</div>
				</div>

				<!-- ══════════════ WEEK VIEW ══════════════ -->
				<div v-if="activeView === 'week'" class="space-y-3">
					<!-- Week Navigation -->
					<div class="flex items-center justify-between">
						<Button variant="outline" class="text-xs font-semibold" @click="prevWeek">
							← {{ __('Prev') }}
						</Button>
						<span class="text-sm font-semibold text-ink-gray-9">
							{{ weekRangeLabel }}
						</span>
						<Button variant="outline" class="text-xs font-semibold" @click="nextWeek">
							{{ __('Next') }} →
						</Button>
					</div>

					<!-- Calendar Grid -->
					<div class="border rounded-md bg-surface-white overflow-hidden">
						<!-- Day header row -->
						<div class="grid border-b" :style="gridStyle">
							<!-- Gutter -->
							<div class="border-r bg-surface-gray-2 py-2 px-1 text-center text-[10px] text-ink-gray-4 uppercase tracking-wider">
								{{ __('Time') }}
							</div>
							<div
								v-for="day in weekDays"
								:key="day.format('YYYY-MM-DD')"
								class="py-2 px-1 text-center border-r last:border-r-0"
								:class="day.isSame(today, 'day') ? 'bg-blue-50' : 'bg-surface-gray-2'"
							>
								<div class="text-[10px] uppercase tracking-wider" :class="day.isSame(today, 'day') ? 'text-blue-600 font-bold' : 'text-ink-gray-4'">
									{{ day.format('ddd') }}
								</div>
								<div class="text-sm font-bold mt-0.5" :class="day.isSame(today, 'day') ? 'text-blue-700' : 'text-ink-gray-8'">
									{{ day.format('D') }}
								</div>
							</div>
						</div>

						<!-- Time rows — scroll wrapper for mobile -->
						<div class="overflow-x-auto">
							<div class="min-w-[640px]">
								<div
									v-for="hour in displayHours"
									:key="hour"
									class="grid border-b last:border-b-0"
									:style="gridStyle"
								>
									<!-- Hour label -->
									<div class="border-r py-1.5 px-1 text-[10px] text-ink-gray-4 text-right pr-2 min-h-[3.5rem] flex items-start pt-2 shrink-0">
										{{ formatHourLabel(hour) }}
									</div>
									<!-- Day cells -->
									<div
										v-for="day in weekDays"
										:key="day.format('YYYY-MM-DD') + '-' + hour"
										class="border-r last:border-r-0 py-0.5 px-0.5 min-h-[3.5rem] space-y-0.5"
										:class="day.isSame(today, 'day') ? 'bg-blue-50/30' : ''"
									>
										<button
											v-for="slot in getSlotsForCell(day, hour)"
											:key="slot.name"
											@click="openSlotDetail(slot)"
											class="w-full text-left rounded px-1.5 py-1 text-[10px] font-semibold leading-tight transition-opacity hover:opacity-80 truncate"
											:class="slotChipClass(slot.status)"
											:title="formatTime(slot.start_datetime) + ' – ' + formatTime(slot.end_datetime)"
										>
											{{ formatTime(slot.start_datetime) }}
											<span class="opacity-70 font-normal block truncate">{{ slot.status }}</span>
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Empty week state -->
					<div v-if="slotsInCurrentWeek.length === 0" class="text-center py-10 text-ink-gray-5 border rounded-md bg-surface-white">
						{{ __('No slots found in this week. Try navigating to another week or regenerating slots.') }}
					</div>
				</div>

				<!-- ══════════════ LIST VIEW ══════════════ -->
				<div v-else class="space-y-4">
					<!-- Status filter tabs -->
					<TabButtons class="inline-block" :buttons="tabButtons" v-model="activeTab" />

					<div v-if="sortedDates.length" class="space-y-6">
						<div
							v-for="date in sortedDates"
							:key="date"
							class="border rounded-md p-5 bg-surface-white space-y-4"
						>
							<h3 class="font-bold text-sm text-ink-gray-9 border-b pb-2">
								{{ formatDateFriendly(date) }}
							</h3>
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								<div
									v-for="slot in groupedSlots[date]"
									:key="slot.name"
									class="border rounded-md p-4 flex flex-col justify-between bg-surface-white hover:border-outline-gray-3 transition-colors space-y-3"
								>
									<div class="space-y-2">
										<!-- Time Range & Badge -->
										<div class="flex justify-between items-start">
											<span class="text-sm font-bold text-ink-gray-9">
												{{ formatTime(slot.start_datetime) }} - {{ formatTime(slot.end_datetime) }}
											</span>
											<Badge :theme="getStatusTheme(slot.status)" size="sm">
												{{ slot.status }}
											</Badge>
										</div>

										<!-- Linked Booking info if Booked or Locked -->
										<div
											v-if="getBookingForSlot(slot.name)"
											class="border-t pt-2.5 mt-2.5 space-y-1.5 text-xs text-ink-gray-7"
										>
											<div class="flex justify-between">
												<span class="text-ink-gray-4 font-medium">{{ __('Student') }}:</span>
												<span class="font-semibold text-ink-gray-8">{{ getBookingForSlot(slot.name).student }}</span>
											</div>
											<div class="flex justify-between">
												<span class="text-ink-gray-4 font-medium">{{ __('Subject') }}:</span>
												<span class="font-semibold text-ink-gray-8">{{ getBookingForSlot(slot.name).subject || '—' }}</span>
											</div>
											<div class="flex justify-between">
												<span class="text-ink-gray-4 font-medium">{{ __('Class') }}:</span>
												<span class="font-semibold text-ink-gray-8">
													{{ getBookingForSlot(slot.name).class || '—' }} ({{ getBookingForSlot(slot.name).board || '—' }})
												</span>
											</div>
											<div class="flex justify-between" v-if="getBookingForSlot(slot.name).amount">
												<span class="text-ink-gray-4 font-medium">{{ __('Price') }}:</span>
												<span class="font-semibold text-ink-gray-8">{{ getBookingForSlot(slot.name).amount }} INR</span>
											</div>
										</div>
									</div>

									<!-- Action Button -->
									<div class="flex justify-end pt-2 border-t mt-2">
										<Button
											v-if="slot.status === 'Available'"
											@click="deleteSlot(slot.name)"
											variant="outline"
											class="text-xs font-semibold text-red-600 hover:text-red-700"
										>
											{{ __('Remove Slot') }}
										</Button>
										<a
											v-else-if="slot.status === 'Booked' && getBookingForSlot(slot.name)?.meeting_link"
											:href="getBookingForSlot(slot.name).meeting_link"
											target="_blank"
											class="inline-block px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors"
										>
											{{ __('Join Class') }}
										</a>
										<span v-else-if="slot.status === 'Temporarily Locked'" class="text-xs text-ink-gray-4 italic">
											{{ __('Awaiting Payment...') }}
										</span>
										<span v-else class="text-xs text-ink-gray-4 italic">—</span>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div v-else class="text-center py-20 text-ink-gray-5 border rounded-md bg-surface-white">
						{{ __('No slots found matching this status filter.') }}
					</div>
				</div>
			</div>
		</div>

		<!-- ══════════════ SLOT DETAIL DIALOG ══════════════ -->
		<Dialog
			v-model="showSlotDialog"
			:options="{ title: __('Slot Details'), size: 'sm' }"
		>
			<template #body-content v-if="selectedSlot">
				<div class="space-y-4 text-sm p-1">
					<!-- Time & Status -->
					<div class="flex justify-between items-center border-b pb-3">
						<div>
							<p class="font-bold text-ink-gray-9">
								{{ formatTime(selectedSlot.start_datetime) }} – {{ formatTime(selectedSlot.end_datetime) }}
							</p>
							<p class="text-xs text-ink-gray-5 mt-0.5">{{ formatDateFriendly(convertToLocal(selectedSlot.start_datetime)?.format('YYYY-MM-DD') || '') }}</p>
						</div>
						<Badge :theme="getStatusTheme(selectedSlot.status)" size="md">
							{{ selectedSlot.status }}
						</Badge>
					</div>

					<!-- Booking Info -->
					<div v-if="getBookingForSlot(selectedSlot.name)" class="space-y-2 text-xs">
						<div class="grid grid-cols-2 gap-3">
							<div>
								<span class="text-ink-gray-4 uppercase tracking-wider text-[10px] block mb-0.5">{{ __('Student') }}</span>
								<span class="font-semibold text-ink-gray-8">{{ getBookingForSlot(selectedSlot.name).student }}</span>
							</div>
							<div>
								<span class="text-ink-gray-4 uppercase tracking-wider text-[10px] block mb-0.5">{{ __('Subject') }}</span>
								<span class="font-semibold text-ink-gray-8">{{ getBookingForSlot(selectedSlot.name).subject || '—' }}</span>
							</div>
							<div>
								<span class="text-ink-gray-4 uppercase tracking-wider text-[10px] block mb-0.5">{{ __('Class') }}</span>
								<span class="font-semibold text-ink-gray-8">{{ getBookingForSlot(selectedSlot.name).class || '—' }}</span>
							</div>
							<div>
								<span class="text-ink-gray-4 uppercase tracking-wider text-[10px] block mb-0.5">{{ __('Board') }}</span>
								<span class="font-semibold text-ink-gray-8">{{ getBookingForSlot(selectedSlot.name).board || '—' }}</span>
							</div>
						</div>
						<div v-if="getBookingForSlot(selectedSlot.name)?.meeting_link" class="pt-2 border-t">
							<a
								:href="getBookingForSlot(selectedSlot.name).meeting_link"
								target="_blank"
								class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors"
							>
								{{ __('Join Class') }}
							</a>
						</div>
					</div>

					<!-- Timezone note -->
					<p class="text-[10px] text-ink-gray-4 border-t pt-2">
						{{ __('Times shown in your local timezone') }}: {{ browserTimezone }}
					</p>

					<!-- Actions -->
					<div v-if="selectedSlot.status === 'Available'" class="flex justify-end border-t pt-3">
						<Button
							variant="outline"
							class="text-xs font-semibold text-red-600 hover:text-red-700"
							@click="deleteSlotFromDialog(selectedSlot.name)"
						>
							{{ __('Remove Slot') }}
						</Button>
					</div>
					<div v-else-if="selectedSlot.status === 'Temporarily Locked'" class="text-xs text-ink-gray-4 italic border-t pt-3">
						{{ __('Awaiting student payment...') }}
					</div>
				</div>
			</template>
		</Dialog>

		<Dialog
			v-model="showDeleteConfirmDialog"
			:options="{
				title: __('Confirm Deletion'),
				size: 'sm',
				actions: [
					{
						label: __('Delete'),
						variant: 'solid',
						theme: 'red',
						onClick: confirmDeleteSlot,
					},
				],
			}"
		>
			<template #body-content>
				<p class="text-sm text-ink-gray-7">
					{{ __('Are you sure you want to delete this available slot?') }}
				</p>
			</template>
		</Dialog>
	</div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Breadcrumbs, Button, LoadingIndicator, Badge, TabButtons, Dialog, call, toast } from 'frappe-ui'
import { useTutorDashboardStore } from '@/stores/useTutorDashboardStore'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { convertToLocal, getBrowserTimezone } from '@/utils/timezone'
import dayjs from '@/utils/dayjs'

const dashboardStore = useTutorDashboardStore()

// ── View state ────────────────────────────────────────────────────────────
const activeView = ref('week')        // 'week' | 'list'
const activeTab = ref('available')    // list view filter

const viewButtons = computed(() => [
	{ value: 'week', label: __('Week') },
	{ value: 'list', label: __('List') },
])

// ── Dialog state ──────────────────────────────────────────────────────────
const showSlotDialog = ref(false)
const selectedSlot = ref(null)

function openSlotDetail(slot) {
	selectedSlot.value = slot
	showSlotDialog.value = true
}

// ── Week navigation ───────────────────────────────────────────────────────
const today = dayjs()
// Start on Monday of the current week (ISO week)
const currentWeekStart = ref(dayjs().startOf('isoWeek'))

const weekDays = computed(() =>
	Array.from({ length: 7 }, (_, i) => currentWeekStart.value.add(i, 'day'))
)

const weekRangeLabel = computed(() => {
	const start = currentWeekStart.value
	const end = start.add(6, 'day')
	if (start.month() === end.month()) {
		return `${start.format('MMMM D')} – ${end.format('D, YYYY')}`
	}
	return `${start.format('MMM D')} – ${end.format('MMM D, YYYY')}`
})

function prevWeek() {
	currentWeekStart.value = currentWeekStart.value.subtract(1, 'week')
}
function nextWeek() {
	currentWeekStart.value = currentWeekStart.value.add(1, 'week')
}

// ── Display hours: 06:00 → 21:00 ─────────────────────────────────────────
const displayHours = Array.from({ length: 16 }, (_, i) => i + 6)   // [6,7,...,21]

function formatHourLabel(hour) {
	return dayjs().hour(hour).minute(0).format('hh A')
}

// Grid CSS: 1 gutter column + 7 equal day columns
const gridStyle = computed(() => ({
	gridTemplateColumns: `3.5rem repeat(7, 1fr)`,
}))

// ── Data ──────────────────────────────────────────────────────────────────
const regenerating = ref(false)

onMounted(async () => {
	await dashboardStore.dashboardData.submit()
})

const profile = computed(() => dashboardStore.dashboardData.data?.profile)
const slots = computed(() => dashboardStore.dashboardData.data?.slots || [])
const sessions = computed(() => dashboardStore.dashboardData.data?.sessions || [])

const browserTimezone = getBrowserTimezone()

const breadcrumbs = computed(() => [
	{ label: __('My Slots'), route: { name: 'SlotCalendar' } }
])

// ── Status helpers ────────────────────────────────────────────────────────
function countByStatus(status) {
	return slots.value.filter(s => s.status === status).length
}

// ── Week view: slot lookup per cell ──────────────────────────────────────
const slotsInCurrentWeek = computed(() => {
	const weekEnd = currentWeekStart.value.add(7, 'day')
	return slots.value.filter(s => {
		const d = convertToLocal(s.start_datetime)
		if (!d) return false
		return d.isSame(currentWeekStart.value, 'day') || (d.isAfter(currentWeekStart.value) && d.isBefore(weekEnd))
	})
})

function getSlotsForCell(day, hour) {
	return slotsInCurrentWeek.value.filter(s => {
		const d = convertToLocal(s.start_datetime)
		if (!d) return false
		return d.isSame(day, 'day') && d.hour() === hour
	})
}

function slotChipClass(status) {
	switch (status) {
		case 'Available':         return 'bg-green-100 text-green-800 hover:bg-green-200'
		case 'Booked':            return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
		case 'Temporarily Locked': return 'bg-amber-100 text-amber-800 hover:bg-amber-200'
		default:                  return 'bg-gray-100 text-gray-600 hover:bg-gray-200'
	}
}

// ── List view ─────────────────────────────────────────────────────────────
const tabButtons = computed(() => {
	const availCount = slots.value.filter(s => s.status === 'Available' || s.status === 'Temporarily Locked').length
	const bookedCount = slots.value.filter(s => s.status === 'Booked').length
	const expiredCount = slots.value.filter(s => s.status === 'Expired' || s.status === 'Cancelled' || s.status === 'Blocked').length
	return [
		{ value: 'available', label: `${__('Available')} (${availCount})` },
		{ value: 'booked',    label: `${__('Booked')} (${bookedCount})` },
		{ value: 'expired',   label: `${__('Expired')} (${expiredCount})` },
	]
})

const filteredSlots = computed(() => {
	if (activeTab.value === 'available') {
		return slots.value.filter(s => s.status === 'Available' || s.status === 'Temporarily Locked')
	} else if (activeTab.value === 'booked') {
		return slots.value.filter(s => s.status === 'Booked')
	} else {
		return slots.value.filter(s => s.status === 'Expired' || s.status === 'Cancelled' || s.status === 'Blocked')
	}
})

const groupedSlots = computed(() => {
	if (!filteredSlots.value) return {}
	const groups = {}
	filteredSlots.value.forEach((slot) => {
		const d = convertToLocal(slot.start_datetime)
		if (!d) return
		const localDate = d.format('YYYY-MM-DD')
		if (!groups[localDate]) groups[localDate] = []
		groups[localDate].push(slot)
	})
	return groups
})

const sortedDates = computed(() => Object.keys(groupedSlots.value).sort())

// ── Shared helpers ────────────────────────────────────────────────────────
function getBookingForSlot(slotName) {
	return sessions.value.find(s => s.slot === slotName)
}

function formatTime(utcTime) {
	const localObj = convertToLocal(utcTime)
	return localObj ? localObj.format('hh:mm A') : ''
}

function formatDateFriendly(dateStr) {
	if (!dateStr) return ''
	return dayjs(dateStr).format('dddd, MMMM D, YYYY')
}

function getStatusTheme(status) {
	switch (status) {
		case 'Available':          return 'green'
		case 'Booked':             return 'blue'
		case 'Temporarily Locked': return 'orange'
		default:                   return 'gray'
	}
}

// ── Slot regeneration ─────────────────────────────────────────────────────
async function triggerRegenerate() {
	if (!profile.value) return
	regenerating.value = true
	try {
		await call('smart_learning.services.slot_generation_service.regenerate_future_slots', {
			tutor_profile: profile.value.name,
		})
		toast.success(__('Slot regeneration triggered. Slots will update shortly.'))
		setTimeout(async () => {
			await dashboardStore.dashboardData.submit()
		}, 1000)
	} catch (e) {
		console.error('Slot regeneration failed:', e)
		toast.error(__('Slot regeneration failed.'))
	} finally {
		regenerating.value = false
	}
}

// ── Slot deletion ─────────────────────────────────────────────────────────
const showDeleteConfirmDialog = ref(false)
const slotToDelete = ref(null)

function deleteSlot(name) {
	slotToDelete.value = name
	showDeleteConfirmDialog.value = true
}

async function confirmDeleteSlot() {
	if (!slotToDelete.value) return
	const name = slotToDelete.value
	showDeleteConfirmDialog.value = false
	slotToDelete.value = null
	try {
		await call('frappe.client.delete_doc', {
			doctype: 'Tutor Availability Slot',
			name,
		})
		toast.success(__('Slot removed.'))
		await dashboardStore.dashboardData.submit()
	} catch (e) {
		console.error('Failed to delete slot:', e)
		toast.error(__('Failed to delete slot.'))
	}
}

async function deleteSlotFromDialog(name) {
	showSlotDialog.value = false
	deleteSlot(name)
}
</script>
