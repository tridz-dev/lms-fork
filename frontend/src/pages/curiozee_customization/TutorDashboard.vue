<template>
	<div>
		<LayoutHeader>
			<template #left-header>
				<Breadcrumbs class="h-7" :items="breadcrumbs" />
			</template>
		</LayoutHeader>

		<div class="flex min-h-0 w-full flex-1 flex-col p-5 pb-10">
			<!-- Loading State -->
			<div v-if="dashboardStore.dashboardData.loading" class="flex justify-center py-20">
				<LoadingIndicator class="w-10 h-10 text-gray-400" />
			</div>

			<!-- Empty State: No Profile -->
			<div v-else-if="!profile" class="text-center py-20 border border-outline-gray-2 rounded-md space-y-4 bg-surface-white">
				<div class="flex flex-col items-center justify-center space-y-2">
					<div class="p-3 bg-surface-gray-2 rounded-full">
						<HomeIcon class="w-8 h-8 text-ink-gray-5 stroke-1.5" />
					</div>
					<h3 class="text-lg font-medium text-ink-gray-9">{{ __('No Tutor Profile linked to your account') }}</h3>
					<p class="text-sm text-ink-gray-7 max-w-sm">
						{{ __('Please create your tutor profile first to access the dashboard.') }}
					</p>
				</div>
				<router-link :to="{ name: 'TutorProfile' }" custom v-slot="{ navigate }">
					<Button variant="solid" @click="navigate" class="mt-2">
						{{ __('Create Tutor Profile') }}
					</Button>
				</router-link>
			</div>

			<!-- Dashboard Content -->
			<div v-else class="space-y-6">
				<!-- Stat Cards -->
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<!-- Availability Card -->
					<div class="border border-outline-gray-2 rounded-md bg-surface-white px-6 pt-5 pb-4 flex flex-col justify-between">
						<span class="text-sm text-ink-gray-5">{{ __('Availability Status') }}</span>
						<div class="mt-2.5">
							<Badge
								:label="availabilityStatus"
								:theme="availabilityStatus === 'Active & Verified' ? 'green' : 'red'"
								size="md"
							/>
						</div>
					</div>

					<!-- Upcoming Sessions -->
					<NumberChart
						class="border border-outline-gray-2 rounded-md"
						:config="{ title: __('Upcoming Sessions'), value: upcomingSessionsCount }"
					/>

					<!-- Completed Sessions -->
					<NumberChart
						class="border border-outline-gray-2 rounded-md"
						:config="{ title: __('Completed Sessions'), value: completedSessionsCount }"
					/>

					<!-- Active Students -->
					<NumberChart
						class="border border-outline-gray-2 rounded-md"
						:config="{ title: __('Total Students'), value: uniqueStudentsCount }"
					/>

					<!-- Available Slots -->
					<NumberChart
						class="border border-outline-gray-2 rounded-md"
						:config="{ title: __('Available Slots'), value: availableSlotsCount }"
					/>

					<!-- Booked Slots -->
					<NumberChart
						class="border border-outline-gray-2 rounded-md"
						:config="{ title: __('Booked Slots'), value: bookedSlotsCount }"
					/>

					<!-- Pending Sessions -->
					<NumberChart
						class="border border-outline-gray-2 rounded-md"
						:config="{ title: __('Pending Sessions'), value: pendingSessionsCount }"
					/>
				</div>

				<!-- Recent Sessions -->
				<div class="space-y-3 pt-4">
					<h3 class="text-2xl font-semibold text-ink-gray-9">{{ __('Recent Booked Sessions') }}</h3>
					<div v-if="bookings.length" class="border border-outline-gray-2 rounded-md overflow-hidden bg-surface-white">
						<div class="overflow-x-auto">
							<table class="w-full text-left border-collapse text-sm text-ink-gray-7">
								<thead>
									<tr class="bg-surface-gray-2 border-b text-ink-gray-5 font-medium text-xs uppercase tracking-wider">
										<th class="p-4">{{ __('Student') }}</th>
										<th class="p-4">{{ __('Subject') }}</th>
										<th class="p-4">{{ __('Date/Time') }}</th>
										<th class="p-4">{{ __('Status') }}</th>
										<th class="p-4 text-right">{{ __('Meeting') }}</th>
									</tr>
								</thead>
								<tbody>
									<tr
										v-for="b in bookings.slice(0, 10)"
										:key="b.name"
										class="border-b last:border-none hover:bg-surface-gray-1 transition-colors"
									>
										<td class="p-4 font-medium text-ink-gray-9">{{ b.student }}</td>
										<td class="p-4 text-ink-gray-7">{{ b.subject || __('N/A') }}</td>
										<td class="p-4 text-ink-gray-7">{{ formatTime(b.start_datetime) }}</td>
										<td class="p-4">
											<Badge
												:label="b.booking_status"
												:theme="b.booking_status === 'Confirmed' ? 'blue' : b.booking_status === 'Completed' ? 'green' :  b.booking_status === 'Cancelled' ? 'red' : 'gray'"
												size="sm"
											/>
										</td>
										<td class="p-4 text-right">
											<Button
												v-if="b.booking_status === 'Confirmed' && b.meeting_link"
												variant="solid"
												size="sm"
												@click="goToMeeting(b.meeting_link)"
											>
												{{ __('Join Class') }}
											</Button>
											<span v-else-if="b.booking_status === 'Confirmed'" class="text-ink-gray-4 italic text-xs">{{ __('Generating...') }}</span>
											<span v-else class="text-ink-gray-4 italic text-xs">—</span>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
					<div v-else class="text-center py-12 border border-outline-gray-2 border-dashed rounded-md text-ink-gray-5 bg-surface-white">
						{{ __('No sessions booked yet.') }}
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { Breadcrumbs, LoadingIndicator, Button, Badge, NumberChart } from 'frappe-ui'
import { useTutorDashboardStore } from '@/stores/useTutorDashboardStore'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'
import { Home as HomeIcon } from 'lucide-vue-next'
import { convertToLocal, isSessionUpcoming } from '@/utils/timezone'

const dashboardStore = useTutorDashboardStore()

onMounted(async () => {
	await dashboardStore.dashboardData.submit()
})

const breadcrumbs = computed(() => [
	{ label: __('Tutor Dashboard'), route: { name: 'TutorDashboard' } }
])

const profile = computed(() => dashboardStore.dashboardData.data?.profile)
const bookings = computed(() => dashboardStore.dashboardData.data?.sessions || [])
const slots = computed(() => dashboardStore.dashboardData.data?.slots || [])

const availabilityStatus = computed(() => {
	if (!profile.value) return 'No Profile'
	return (profile.value.active && profile.value.verification_status === 'Verified')
		? 'Active & Verified'
		: 'Inactive / Pending'
})

const bookedSlotsCount = computed(() => {
	return slots.value.filter(s => s.status === 'Booked').length
})

const availableSlotsCount = computed(() => {
	return slots.value.filter(s => s.status === 'Available').length
})

const upcomingSessionsCount = computed(() => {
	return bookings.value.filter(s =>
		(s.booking_status === 'Confirmed' || s.booking_status === 'Payment Success') &&
		isSessionUpcoming(s.start_datetime)
	).length
})

const completedSessionsCount = computed(() => {
	return bookings.value.filter(s =>
		s.booking_status === 'Completed' ||
		((s.booking_status === 'Confirmed' || s.booking_status === 'Payment Success') &&
		!isSessionUpcoming(s.start_datetime))
	).length
})

const pendingSessionsCount = computed(() => {
	return bookings.value.filter(s =>
		s.booking_status === 'Pending Payment' &&
		isSessionUpcoming(s.start_datetime)
	).length
})

const uniqueStudentsCount = computed(() => {
	return new Set(bookings.value.map(b => b.student).filter(Boolean)).size
})

function formatTime(utcTime) {
	const localObj = convertToLocal(utcTime)
	return localObj ? localObj.format('DD MMM YYYY, hh:mm A') : 'N/A'
}

function goToMeeting(link) {
	if (link) {
		window.open(link, '_blank')
	}
}
</script>
