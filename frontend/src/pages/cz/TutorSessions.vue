<template>
	<div>
		<LayoutHeader>
			<template #left-header>
				<Breadcrumbs class="h-7" :items="breadcrumbs" />
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
						<Video class="w-8 h-8 text-ink-gray-5 stroke-1.5" />
					</div>
					<h3 class="text-lg font-medium text-ink-gray-9">{{ __('No Tutor Profile linked to your account') }}</h3>
					<p class="text-sm text-ink-gray-7 max-w-sm">
						{{ __('Please create your tutor profile first to view booked sessions.') }}
					</p>
				</div>
				<router-link
					:to="{ name: 'TutorProfile' }"
					class="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
				>
					{{ __('Create Tutor Profile') }}
				</router-link>
			</div>

			<!-- Sessions Content -->
			<div v-else class="space-y-6">
				<div class="border-b pb-4">
					<h2 class="text-xl font-semibold text-ink-gray-9">{{ __('My Tutoring Sessions') }}</h2>
					<p class="text-sm text-ink-gray-5 mt-1">{{ __('Manage your tutoring sessions and launch classes.') }}</p>
				</div>

				<!-- Section Tabs -->
				<div class="mb-4">
					<TabButtons
						class="inline-block"
						:buttons="tabButtons"
						v-model="activeTab"
					/>
				</div>

				<!-- Sessions List -->
				<div v-if="filteredSessions.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div
						v-for="b in filteredSessions"
						:key="b.name"
						class="border rounded-md p-4 bg-surface-white hover:border-outline-gray-3 transition-colors flex flex-col justify-between"
					>
						<div class="space-y-3">
							<!-- Header: Student Name & Badges -->
							<div class="flex justify-between items-start pb-3 border-b">
								<div>
									<h4 class="font-bold text-ink-gray-9 text-base">{{ b.student }}</h4>
									<p class="text-xs text-ink-gray-5 mt-1">
										<span class="font-semibold text-ink-gray-4 uppercase tracking-wider text-[10px] mr-1">{{ __('Scheduled') }}:</span>
										{{ formatTime(b.start_datetime) }}
									</p>
								</div>
								<div class="flex flex-col items-end gap-1.5">
									<Badge :label="b.booking_status" :theme="getBookingStatusTheme(b.booking_status)" size="sm" />
								</div>
							</div>

							<!-- Subject/Board/Class Details -->
							<div class="grid grid-cols-3 gap-2 text-xs pt-1 text-ink-gray-7">
								<div>
									<span class="text-ink-gray-4 block mb-0.5 uppercase tracking-wider text-[10px]">{{ __('Subject') }}</span>
									<span class="font-semibold text-ink-gray-8">{{ b.subject || '—' }}</span>
								</div>
								<div>
									<span class="text-ink-gray-4 block mb-0.5 uppercase tracking-wider text-[10px]">{{ __('Board') }}</span>
									<span class="font-semibold text-ink-gray-8">{{ b.board || '—' }}</span>
								</div>
								<div>
									<span class="text-ink-gray-4 block mb-0.5 uppercase tracking-wider text-[10px]">{{ __('Class') }}</span>
									<span class="font-semibold text-ink-gray-8">{{ b.class || '—' }}</span>
								</div>
							</div>
						</div>

						<!-- Action Buttons (Launch meeting & Mark Completed) -->
						<div class="flex justify-end items-center pt-3 border-t mt-4">
							<div class="flex items-center gap-2">
								<template v-if="b.booking_status === 'Confirmed'">
									<a
										v-if="b.meeting_link"
										:href="b.meeting_link"
										target="_blank"
										class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-150 animate-fade-in"
									>
										<Video class="w-3.5 h-3.5" />
										{{ __('Launch Class') }}
									</a>
									<span v-else class="text-xs text-ink-gray-4 italic mr-2">
										{{ __('Meeting generating...') }}
									</span>

									<!-- Actions Dropdown -->
									<Dropdown
										v-if="profile"
										:options="[
											{
												label: __('Mark Completed'),
												onClick: () => promptCompletion(b),
											},
											{
												label: __('Cancel Session'),
												onClick: () => promptCancellation(b),
											},
										]"
									>
										<template v-slot="{ open }">
											<Button class="p-2 hover:bg-surface-gray-2 rounded-md transition-colors border border-outline-gray-2 flex items-center justify-center">
												<MoreHorizontal class="w-4 h-4 text-ink-gray-7" />
											</Button>
										</template>
									</Dropdown>
								</template>

								<span v-else-if="b.booking_status === 'Completed'" class="text-xs text-green-600 font-medium italic">
									{{ __('Class concluded') }}
								</span>
								<span v-else-if="b.booking_status === 'Cancelled'" class="text-xs text-red-500 font-medium italic">
									{{ __('Cancelled') }}
								</span>
							</div>
						</div>
					</div>
				</div>

				<div v-else class="text-center py-20 text-ink-gray-5 border rounded-md bg-surface-white">
					{{ __('No sessions found matching this status filter.') }}
				</div>
			</div>
		</div>

		<!-- Complete Session Confirmation Dialog -->
		<Dialog
			v-model="showCompleteDialog"
			:options="{
				title: __('Complete Session'),
				size: 'md',
			}"
		>
			<template #body-content>
				<p class="text-sm text-ink-gray-7 leading-relaxed">
					{{ __('Are you sure you want to mark this session as completed?') }}
					<br />
					<span class="text-red-500 font-semibold mt-1 block">{{ __('This action cannot be undone.') }}</span>
				</p>
			</template>
			<template #actions>
				<div class="flex gap-2 justify-end">
					<Button
						variant="minimal"
						@click="showCompleteDialog = false"
					>
						{{ __('Cancel') }}
					</Button>
					<Button
						variant="solid"
						:loading="dashboardStore.sessionCompleter.loading"
						@click="confirmCompletion"
					>
						{{ __('Confirm') }}
					</Button>
				</div>
			</template>
		</Dialog>

		<!-- Cancel Session Confirmation Dialog -->
		<Dialog
			v-model="showCancelDialog"
			:options="{
				title: __('Cancel Session'),
				size: 'md',
			}"
		>
			<template #body-content>
				<p class="text-sm text-ink-gray-7 leading-relaxed">
					{{ __('Are you sure you want to cancel this session?') }}
					<br />
					<span class="text-red-500 font-semibold mt-1 block">{{ __('This action will cancel the booking and release the slot.') }}</span>
				</p>
			</template>
			<template #actions>
				<div class="flex gap-2 justify-end">
					<Button
						variant="minimal"
						@click="showCancelDialog = false"
					>
						{{ __('Cancel') }}
					</Button>
					<Button
						variant="solid"
						theme="red"
						:loading="dashboardStore.sessionCanceller.loading"
						@click="confirmCancellation"
					>
						{{ __('Confirm') }}
					</Button>
				</div>
			</template>
		</Dialog>
	</div>
</template>

<script setup>
import { computed, inject, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { Breadcrumbs, LoadingIndicator, Badge, TabButtons, Button, Dialog, Dropdown, toast } from 'frappe-ui'
import { useTutorDashboardStore } from '@/stores/useTutorDashboardStore'
import { sessionStore } from '@/stores/session'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'
import { Video, MoreHorizontal } from 'lucide-vue-next'
import { convertToLocal, isSessionUpcoming, isSessionEnded } from '@/utils/timezone'

const dashboardStore = useTutorDashboardStore()
const { user } = sessionStore()
const socket = inject('$socket')

const activeTab = ref('upcoming')
const showCompleteDialog = ref(false)
const selectedBookingForCompletion = ref(null)

const showCancelDialog = ref(false)
const selectedBookingForCancellation = ref(null)

let pollInterval = null

function startPollingIfNeeded() {
	if (pollInterval) return

	const currentSessions = dashboardStore.dashboardData.data?.sessions || []
	const hasPendingMeeting = currentSessions.some(
		s => s.booking_status === 'Confirmed' && !s.meeting_link && isSessionUpcoming(s.start_datetime)
	)

	if (hasPendingMeeting) {
		pollInterval = setInterval(async () => {
			await dashboardStore.dashboardData.submit()
			
			const stillPending = (dashboardStore.dashboardData.data?.sessions || []).some(
				s => s.booking_status === 'Confirmed' && !s.meeting_link && isSessionUpcoming(s.start_datetime)
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

watch(() => dashboardStore.dashboardData.data?.sessions, () => {
	startPollingIfNeeded()
}, { deep: true })

onMounted(async () => {
	await dashboardStore.dashboardData.submit()
	
	if (socket) {
		socket.on('booking_meeting_updated', (data) => {
			if (data && data.booking && dashboardStore.dashboardData.data?.sessions) {
				const found = dashboardStore.dashboardData.data.sessions.find(s => s.name === data.booking)
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

function promptCompletion(booking) {
	selectedBookingForCompletion.value = booking
	showCompleteDialog.value = true
}

async function confirmCompletion() {
	if (!selectedBookingForCompletion.value) return
	const bookingName = selectedBookingForCompletion.value.name
	try {
		await dashboardStore.sessionCompleter.submit({ booking_name: bookingName })
		
		// In-place local state update of booking_status to 'Completed'
		const found = sessions.value.find(s => s.name === bookingName)
		if (found) {
			found.booking_status = 'Completed'
		}
		
		toast.success(__('Session marked as completed successfully.'))
	} catch (err) {
		toast.error(err.messages?.[0] || err.message || __('Failed to complete session.'))
	} finally {
		showCompleteDialog.value = false
		selectedBookingForCompletion.value = null
	}
}

function promptCancellation(booking) {
	selectedBookingForCancellation.value = booking
	showCancelDialog.value = true
}

async function confirmCancellation() {
	if (!selectedBookingForCancellation.value) return
	const bookingName = selectedBookingForCancellation.value.name
	try {
		await dashboardStore.sessionCanceller.submit({ booking_name: bookingName })
		
		// In-place local state update of booking_status to 'Cancelled'
		const found = sessions.value.find(s => s.name === bookingName)
		if (found) {
			found.booking_status = 'Cancelled'
		}
		
		toast.success(__('Session cancelled successfully.'))
	} catch (err) {
		toast.error(err.messages?.[0] || err.message || __('Failed to cancel session.'))
	} finally {
		showCancelDialog.value = false
		selectedBookingForCancellation.value = null
	}
}

const profile = computed(() => dashboardStore.dashboardData.data?.profile)
const sessions = computed(() => dashboardStore.dashboardData.data?.sessions || [])

const breadcrumbs = computed(() => [
	{ label: __('My Sessions'), route: { name: 'TutorSessions' } }
])

const tabButtons = computed(() => {
	const upcoming = sessions.value.filter(s =>
		(s.booking_status === 'Confirmed' || s.booking_status === 'Payment Success') &&
		isSessionUpcoming(s.start_datetime)
	).length
	const completed = sessions.value.filter(s =>
		s.booking_status === 'Completed' ||
		((s.booking_status === 'Confirmed' || s.booking_status === 'Payment Success') &&
		!isSessionUpcoming(s.start_datetime))
	).length
	const cancelled = sessions.value.filter(s => s.booking_status === 'Cancelled').length
	const expired = sessions.value.filter(s => s.booking_status === 'Expired' || s.booking_status === 'Failed' || s.booking_status === 'Pending Payment').length

	return [
		{ value: 'upcoming', label: `${__('Upcoming')} (${upcoming})` },
		{ value: 'completed', label: `${__('Completed')} (${completed})` },
		{ value: 'cancelled', label: `${__('Cancelled')} (${cancelled})` },
		{ value: 'expired', label: `${__('Expired')} (${expired})` },
	]
})

const filteredSessions = computed(() => {
	if (activeTab.value === 'upcoming') {
		return sessions.value.filter(s =>
			(s.booking_status === 'Confirmed' || s.booking_status === 'Payment Success') &&
			isSessionUpcoming(s.start_datetime)
		)
	} else if (activeTab.value === 'completed') {
		return sessions.value.filter(s =>
			s.booking_status === 'Completed' ||
			((s.booking_status === 'Confirmed' || s.booking_status === 'Payment Success') &&
			!isSessionUpcoming(s.start_datetime))
		)
	} else if (activeTab.value === 'cancelled') {
		return sessions.value.filter(s => s.booking_status === 'Cancelled')
	} else {
		return sessions.value.filter(s => s.booking_status === 'Expired' || s.booking_status === 'Failed' || s.booking_status === 'Pending Payment')
	}
})

function formatTime(utcTime) {
	const localObj = convertToLocal(utcTime)
	return localObj ? localObj.format('DD MMM YYYY, hh:mm A') : 'N/A'
}

function getBookingStatusTheme(status) {
	switch (status) {
		case 'Confirmed':
		case 'Payment Success':
			return 'blue'
		case 'Completed':
			return 'green'
		case 'Cancelled':
			return 'red'
		default:
			return 'gray'
	}
}
</script>
