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
				<LoadingIndicator class="w-10 h-10 text-ink-gray-4" />
			</div>

			<!-- Empty State: No Profile -->
			<div v-else-if="!profile" class="text-center py-20 space-y-4 bg-surface-white">
				<div class="flex flex-col items-center justify-center space-y-2">
					<div class="p-3 bg-surface-gray-2 rounded-full">
						<Video class="w-8 h-8 text-ink-gray-5 stroke-1.5" />
					</div>
					<h3 class="text-lg font-medium text-ink-gray-9">{{ __('No Tutor Profile linked to your account') }}</h3>
					<p class="text-sm text-ink-gray-7 max-w-sm">
						{{ __('Please create your tutor profile first to view booked sessions.') }}
					</p>
				</div>
				<router-link :to="{ name: 'TutorProfile' }" custom v-slot="{ navigate }">
					<Button variant="solid" @click="navigate" class="mt-2">
						{{ __('Create Tutor Profile') }}
					</Button>
				</router-link>
			</div>

			<!-- Sessions Content -->
			<div v-else class="space-y-6">
				<div class="border-b pb-4">
					<h2 class="text-xl font-semibold text-ink-gray-9">{{ __('My Tutoring Sessions') }}</h2>
					<p class="text-sm text-ink-gray-5 mt-1">{{ __('Manage your tutoring sessions and launch classes.') }}</p>
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
					<div
						v-for="b in filteredSessions"
						:key="b.name"
						class="border border-outline-gray-2 rounded-md p-5 bg-surface-white hover:border-outline-gray-3 transition-colors flex flex-col justify-between"
					>
						<div class="space-y-3">
							<!-- Header: Student Name & Badges -->
							<div class="flex justify-between items-start pb-3 border-b">
								<div>
									<h4 class="font-semibold text-sm text-ink-gray-9">{{ b.student }}</h4>
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
						<div class="flex justify-end items-center mt-3 pt-3 border-t">
							<div class="flex items-center gap-2">
								<template v-if="b.booking_status === 'Confirmed'">
									<a
										v-if="b.meeting_link"
										:href="b.meeting_link"
										target="_blank"
									>
										<Button variant="solid" size="sm">
											<template #prefix>
												<Video class="w-3.5 h-3.5" />
											</template>
											{{ __('Launch Class') }}
										</Button>
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

								<span v-else-if="b.booking_status === 'Completed'" class="text-xs text-ink-green-3 font-medium italic">
									{{ __('Class concluded') }}
								</span>
								<span v-else-if="b.booking_status === 'Cancelled'" class="text-xs text-ink-red-3 font-medium italic">
									{{ __('Cancelled') }}
								</span>
							</div>
						</div>
					</div>
				</div>

				<div v-else class="text-center py-20 text-ink-gray-5 bg-surface-white">
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
					<span class="text-ink-red-3 font-semibold mt-1 block">{{ __('This action cannot be undone.') }}</span>
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
				<div class="space-y-4">
					<p class="text-sm text-ink-gray-7 leading-relaxed">
						{{ __('Are you sure you want to cancel this session?') }}
						<br />
						<span class="text-ink-red-3 font-semibold mt-1 block">
							{{ __('This action will cancel the booking and release the slot.') }}
						</span>
					</p>
					<div>
						<label class="text-xs font-medium text-ink-gray-5 block mb-1">
							{{ __('Reason for Cancellation') }} <span class="text-ink-red-3">*</span>
						</label>
						<FormControl
							v-model="cancelReason"
							type="textarea"
							rows="3"
							:placeholder="__('Please provide a reason...')"
						/>
					</div>
				</div>
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
						:disabled="!cancelReason.trim()"
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
import { Breadcrumbs, LoadingIndicator, Badge, TabButtons, Button, Dialog, Dropdown, FormControl, toast } from 'frappe-ui'
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
const cancelReason = ref('')

onMounted(async () => {
	await dashboardStore.dashboardData.submit()
	
	if (socket) {
		socket.on('booking_meeting_updated', (data) => {
			if (data && data.booking && dashboardStore.dashboardData.data?.sessions) {
				const found = dashboardStore.dashboardData.data.sessions.find(s => s.name === data.booking)
				if (found) {
					if (data.booking_status) found.booking_status = data.booking_status
					if (data.meeting_link) found.meeting_link = data.meeting_link
					if (data.calendar_event_id) found.meeting_event_id = data.calendar_event_id
					if (data.modified) found.modified = data.modified
					if (data.fireflies_sync_status) found.fireflies_sync_status = data.fireflies_sync_status
					if (data.transcript_status) found.transcript_status = data.transcript_status
				}
			}
		})
	}
})

onBeforeUnmount(() => {
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
	cancelReason.value = ''
	showCancelDialog.value = true
}

async function confirmCancellation() {
	if (!selectedBookingForCancellation.value) return
	if (!cancelReason.value || !cancelReason.value.trim()) {
		toast.error(__('Cancellation reason is mandatory.'))
		return
	}
	const bookingName = selectedBookingForCancellation.value.name
	try {
		await dashboardStore.sessionCanceller.submit({
			booking_name: bookingName,
			reason: cancelReason.value.trim()
		})
		
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
	const confirmed = sessions.value.filter(s =>
		s.booking_status === 'Confirmed' ||
		(s.booking_status === 'Payment Success' || s.booking_status === 'Confirmed') &&
		isSessionUpcoming(s.start_datetime)
	).length
	const completed = sessions.value.filter(s =>
		s.booking_status === 'Completed'
	).length
	const cancelled = sessions.value.filter(s => s.booking_status === 'Cancelled').length
	const failed = sessions.value.filter(s => s.booking_status === 'Expired' || s.booking_status === 'Failed' || s.booking_status === 'Pending Payment').length

	return [
		{ value: 'upcoming', label: `${__('Upcoming')} (${upcoming})` },
		{ value: 'confirmed', label: `${__('Confirmed')} (${confirmed})` },
		{ value: 'completed', label: `${__('Completed')} (${completed})` },
		{ value: 'cancelled', label: `${__('Cancelled')} (${cancelled})` },
		// { value: 'failed', label: `${__('Failed')} (${failed})` },
	]
})

const filteredSessions = computed(() => {
	if (activeTab.value === 'upcoming') {
		return sessions.value.filter(s =>
			(s.booking_status === 'Confirmed' || s.booking_status === 'Payment Success') &&
			isSessionUpcoming(s.start_datetime)
		)
	} else if (activeTab.value === 'confirmed') {
		return sessions.value.filter(s =>
			s.booking_status === 'Confirmed' ||
			((s.booking_status === 'Confirmed' || s.booking_status === 'Payment Success') &&
			!isSessionUpcoming(s.start_datetime))
		)
	} else if (activeTab.value === 'completed') {
		return sessions.value.filter(s =>
			s.booking_status === 'Completed'
		)
	}
	 else if (activeTab.value === 'cancelled') {
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
