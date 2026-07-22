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
				</div>
			</template>
		</LayoutHeader>

		<div class="flex min-h-0 w-full flex-1 flex-col p-5 pb-10">
			<!-- Loading State -->
			<div v-if="dashboardStore.dashboardData.loading" class="flex justify-center py-20">
				<Spinner class="w-10 h-10 text-gray-400" />
			</div>

			<!-- Empty State: No Profile -->
			<div v-else-if="!profile" class="text-center py-20 space-y-4">
				<div class="flex flex-col items-center justify-center space-y-2">
					<div class="p-3 bg-surface-gray-2 rounded-full">
						<CalendarIcon class="w-8 h-8 text-ink-gray-5 stroke-1.5" />
					</div>
					<h3 class="text-lg font-medium text-ink-gray-9">{{ __('No Tutor Profile linked to your account') }}</h3>
					<p class="text-sm text-ink-gray-7 max-w-sm">
						{{ __('Please create your tutor profile first to manage generated bookable slots.') }}
					</p>
				</div>
				<router-link :to="{ name: 'TutorProfileCreate' }" custom v-slot="{ navigate }">
					<Button variant="solid" @click="navigate" class="mt-2">
						{{ __('Create Tutor Profile') }}
					</Button>
				</router-link>
			</div>

			<!-- Main Content -->
			<div v-else class="space-y-5">
				<!-- Header row: title + status counts -->
				<div class="border-b pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div>
						<h2 class="text-2xl font-semibold text-ink-gray-9">{{ __('Generated Availability Slots') }}</h2>
						<p class="text-sm text-ink-gray-5 mt-0.5">{{ __('Manage your available slots and view linked booking states.') }}</p>
					</div>
					<div class="flex flex-wrap items-center gap-2 shrink-0">
						<Badge theme="green">
							{{ __('Available') }} ({{ countByStatus('Available') }})
						</Badge>
						<Badge theme="blue">
							{{ __('Booked') }} ({{ countByStatus('Booked') }})
						</Badge>
						<Badge theme="orange">
							{{ __('Locked') }} ({{ countByStatus('Temporarily Locked') }})
						</Badge>
						<Badge theme="red">
							{{ __('Blocked') }} ({{ countByStatus('Blocked') }})
						</Badge>
					</div>
				</div>

				<!-- ══════════════ WEEK VIEW ══════════════ -->
				<div v-if="activeView === 'calendar'" class="space-y-3">
					<div class="border border-outline-gray-2 rounded-xl p-6 bg-surface-white h-[750px]">
						<Calendar
							:events="calendarEvents"
							:config="calendarConfig"
						>
							<template #event-popover-content="{ calendarEvent, close }">
								<div v-if="getSlotByName(calendarEvent.id)" class="w-80 rounded-lg bg-surface-white p-4 border border-outline-gray-2 shadow-xl text-ink-gray-8 space-y-4">
									<!-- Header with Close button -->
									<div class="flex justify-between items-start">
										<Badge :theme="getStatusTheme(getSlotByName(calendarEvent.id).status)" size="sm">
											{{ getSlotByName(calendarEvent.id).status }}
										</Badge>
										<Button
											variant="ghost"
											icon="x"
											@click.stop="close"
										/>
									</div>

									<!-- Slot Date & Time details -->
									<div>
										<p class="font-semibold text-base text-ink-gray-9">
											{{ formatTime(getSlotByName(calendarEvent.id).start_datetime) }} – {{ formatTime(getSlotByName(calendarEvent.id).end_datetime) }}
										</p>
										<p class="text-xs text-ink-gray-5 mt-0.5">
											{{ formatDateFriendly(convertToLocal(getSlotByName(calendarEvent.id).start_datetime)?.format('YYYY-MM-DD') || '') }}
										</p>
									</div>

									<!-- Booking Info -->
									<div v-if="getBookingForSlot(calendarEvent.id)" class="space-y-3 pt-3 border-t border-outline-gray-2 text-xs">
										<div class="grid grid-cols-2 gap-2.5">
											<div>
												<span class="text-ink-gray-4 uppercase tracking-wider text-[9px] block mb-0.5">{{ __('Student') }}</span>
												<span class="font-semibold text-ink-gray-8">{{ getBookingForSlot(calendarEvent.id).student }}</span>
											</div>
											<div>
												<span class="text-ink-gray-4 uppercase tracking-wider text-[9px] block mb-0.5">{{ __('Subject') }}</span>
												<span class="font-semibold text-ink-gray-8">{{ getBookingForSlot(calendarEvent.id).subject || '—' }}</span>
											</div>
											<div>
												<span class="text-ink-gray-4 uppercase tracking-wider text-[9px] block mb-0.5">{{ __('Class') }}</span>
												<span class="font-semibold text-ink-gray-8">{{ getBookingForSlot(calendarEvent.id).class || '—' }}</span>
											</div>
											<div>
												<span class="text-ink-gray-4 uppercase tracking-wider text-[9px] block mb-0.5">{{ __('Board') }}</span>
												<span class="font-semibold text-ink-gray-8">{{ getBookingForSlot(calendarEvent.id).board || '—' }}</span>
											</div>
										</div>
										<div v-if="getBookingForSlot(calendarEvent.id)?.meeting_link" class="pt-1">
											<Button
												variant="solid"
												size="sm"
												class="w-full justify-center"
												@click="goToMeeting(getBookingForSlot(calendarEvent.id).meeting_link)"
											>
												{{ __('Join Class') }}
											</Button>
										</div>
									</div>

									<!-- Actions / Timezone -->
									<div class="pt-3 border-t border-outline-gray-2 flex flex-col gap-2">
										<p class="text-[10px] text-ink-gray-4">
											{{ __('Times shown in local timezone') }}: {{ browserTimezone }}
										</p>
										<div v-if="getSlotByName(calendarEvent.id).status === 'Available'" class="flex justify-end pt-1">
											<Button
												variant="outline"
												theme="red"
												size="sm"
												@click="deleteSlotFromPopover(calendarEvent.id, close)"
											>
												{{ __('Mark Unavailable') }}
											</Button>
										</div>
										<div v-else-if="getSlotByName(calendarEvent.id).status === 'Temporarily Locked'" class="text-xs text-ink-gray-4 italic pt-1">
											{{ __('Awaiting student payment...') }}
										</div>
									</div>
								</div>
							</template>
						</Calendar>
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
							class="border border-outline-gray-2 rounded-md p-5 bg-surface-white space-y-4"
						>
							<h3 class="font-semibold text-sm text-ink-gray-9 border-b pb-2">
								{{ formatDateFriendly(date) }}
							</h3>
							<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
								<div
									v-for="slot in groupedSlots[date]"
									:key="slot.name"
									class="border border-outline-gray-2 rounded-md p-5 flex flex-col justify-between bg-surface-white hover:border-outline-gray-3 transition-colors space-y-3"
								>
									<div class="space-y-2">
										<!-- Time Range & Badge -->
										<div class="flex justify-between items-start">
											<span class="text-sm font-semibold text-ink-gray-9">
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

									<!-- Action Button Row (Hidden for Blocked / Expired with no actions) -->
									<div
										v-if="
											slot.status === 'Available' ||
											(slot.status === 'Booked' && getBookingForSlot(slot.name)?.meeting_link) ||
											slot.status === 'Temporarily Locked'
										"
										class="flex justify-end pt-2 border-t mt-2"
									>
										<Button
											v-if="slot.status === 'Available'"
											@click="deleteSlot(slot.name)"
											variant="outline"
											theme="red"
										>
											{{ __('Mark Unavailable') }}
										</Button>
										<Button
											v-else-if="slot.status === 'Booked' && getBookingForSlot(slot.name)?.meeting_link"
											variant="solid"
											size="sm"
											@click="goToMeeting(getBookingForSlot(slot.name).meeting_link)"
										>
											{{ __('Join Class') }}
										</Button>
										<span v-else-if="slot.status === 'Temporarily Locked'" class="text-xs text-ink-gray-4 italic">
											{{ __('Awaiting Payment...') }}
										</span>
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

		<Dialog
			v-model="showDeleteConfirmDialog"
			:options="{
				title: __('Mark Unavailable'),
				size: 'sm',
			}"
		>
			<template #body-content>
				<p class="text-sm text-ink-gray-7">
					{{ __('Are you sure you want to mark this available slot as unavailable?') }}
				</p>
			</template>
			<template #actions="{ close }">
				<div class="flex justify-end gap-3 w-full">
					<Button variant="outline" @click="close">
						{{ __('Cancel') }}
					</Button>
					<Button variant="solid" theme="red" @click="confirmDeleteSlot">
						{{ __('Confirm') }}
					</Button>
				</div>
			</template>
		</Dialog>
	</div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Breadcrumbs, Button, Spinner, Badge, TabButtons, Dialog, Calendar, FeatherIcon, call, toast } from 'frappe-ui'
import { useTutorDashboardStore } from '@/stores/useTutorDashboardStore'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { convertToLocal, getBrowserTimezone } from '@/utils/timezone'
import dayjs from '@/utils/dayjs'

const dashboardStore = useTutorDashboardStore()

// ── View state ────────────────────────────────────────────────────────────
const activeView = ref('calendar')        // 'week' | 'list'
const activeTab = ref('available')    // list view filter

const viewButtons = computed(() => [
	{ value: 'calendar', label: __('Calendar') },
	{ value: 'list', label: __('List') },
])

const getSlotByName = (name) => slots.value.find(s => s.name === name)

// ── Frappe UI Calendar integration ────────────────────────────────────────
const calendarConfig = {
	defaultMode: 'Week',
	disableModes: [],
	timeFormat: '12h',
	hourHeight: 60,
	scrollToHour: 8,
}

const calendarEvents = computed(() => {
	return slots.value.map(slot => {
		const startLocal = convertToLocal(slot.start_datetime)
		const endLocal = convertToLocal(slot.end_datetime)
		if (!startLocal || !endLocal) return null
		return {
			id: slot.name,
			title: slot.status,
			fromDate: startLocal.format('YYYY-MM-DD'),
			toDate: endLocal.format('YYYY-MM-DD'),
			fromTime: startLocal.format('HH:mm:ss'),
			toTime: endLocal.format('HH:mm:ss'),
			color: getCalendarEventColor(slot.status),
		}
	}).filter(Boolean)
})

function deleteSlotFromPopover(name, close) {
	if (close) close()
	deleteSlot(name)
}

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



// ── List view ─────────────────────────────────────────────────────────────
const tabButtons = computed(() => {
	const availCount = slots.value.filter(s => s.status === 'Available' || s.status === 'Temporarily Locked').length
	const bookedCount = slots.value.filter(s => s.status === 'Booked').length
	const expiredCount = slots.value.filter(s => s.status === 'Expired' || s.status === 'Cancelled').length
	const blockedCount = slots.value.filter(s => s.status === 'Blocked').length
	return [
		{ value: 'available', label: `${__('Available')} (${availCount})` },
		{ value: 'booked',    label: `${__('Booked')} (${bookedCount})` },
		{ value: 'expired',   label: `${__('Expired')} (${expiredCount})` },
		{ value: 'blocked',   label: `${__('Blocked')} (${blockedCount})` },
	]
})

const filteredSlots = computed(() => {
	if (activeTab.value === 'available') {
		return slots.value.filter(s => s.status === 'Available' || s.status === 'Temporarily Locked')
	} else if (activeTab.value === 'booked') {
		return slots.value.filter(s => s.status === 'Booked')
	} else if (activeTab.value === 'blocked') {
		return slots.value.filter(s => s.status === 'Blocked')
	} else {
		return slots.value.filter(s => s.status === 'Expired' || s.status === 'Cancelled')
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
		case 'Blocked':             return 'red'
		default:                   return 'gray'
	}
}

function getCalendarEventColor(status) {
	switch (status) {
		case 'Available':          return 'green'
		case 'Booked':             return 'blue'
		case 'Temporarily Locked': return 'orange'
		case 'Blocked':             return 'pink' // maps to pink (red-ish)
		default:                   return 'violet' // maps to violet/gray
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
		await call('frappe.client.set_value', {
			doctype: 'Tutor Availability Slot',
			name,
			fieldname: 'status',
			value: 'Blocked',
		})
		toast.success(__('Slot marked unavailable.'))
		await dashboardStore.dashboardData.submit()
	} catch (e) {
		console.error('Failed to mark slot unavailable:', e)
		toast.error(__('Failed to mark slot unavailable.'))
	}
}

function goToMeeting(link) {
	if (link) {
		window.open(link, '_blank')
	}
}
</script>
