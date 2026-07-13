<template>
	<div>
		<LayoutHeader>
			<template #left-header>
				<Breadcrumbs class="h-7" :items="breadcrumbs" />
			</template>
		</LayoutHeader>

		<div v-if="dashboardStore.dashboardData.loading" class="flex justify-center py-20">
			<LoadingIndicator class="w-8 h-8 text-ink-gray-4" />
		</div>

		<!-- No profile state -->
		<div v-else-if="!profile" class="p-5">
			<div class="border rounded-md py-16 text-center space-y-4">
				<span class="lucide-user-x size-10 text-ink-gray-4 mx-auto block" aria-hidden="true" />
				<div>
					<h3 class="text-base font-semibold text-ink-gray-9">
						{{ __('No tutor profile found') }}
					</h3>
					<p class="text-sm text-ink-gray-6 mt-1 max-w-xs mx-auto">
						{{ __('Create your tutor profile to access the dashboard.') }}
					</p>
				</div>
				<router-link :to="{ name: 'TutorProfile' }" custom v-slot="{ navigate }">
					<Button variant="solid" theme="gray" @click="navigate" :label="__('Create profile')" />
				</router-link>
			</div>
		</div>

		<!-- Dashboard content -->
		<div v-else class="p-5">
			<!-- Welcome -->
			<div class="mb-4">
				<div class="text-xl font-bold text-ink-gray-9">
					{{ __('Hey') }}, {{ profile.tutor_name }} 👋
				</div>
				<div class="text-lg text-ink-gray-6 leading-6 mt-1">
					{{ dashboardSubtitle }}
				</div>
			</div>

			<!-- Stats Grid — mirrors Statistics.vue -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
				<Tooltip :text="__('Upcoming confirmed sessions')">
					<NumberChart
						class="border rounded-md"
						:config="{ title: __('Upcoming'), value: upcomingSessionsCount }"
					/>
				</Tooltip>
				<Tooltip :text="__('Sessions completed so far')">
					<NumberChart
						class="border rounded-md"
						:config="{ title: __('Completed'), value: completedSessionsCount }"
					/>
				</Tooltip>
				<Tooltip :text="__('Unique students taught')">
					<NumberChart
						class="border rounded-md"
						:config="{ title: __('Students'), value: uniqueStudentsCount }"
					/>
				</Tooltip>
				<Tooltip :text="__('Slots open for booking')">
					<NumberChart
						class="border rounded-md"
						:config="{ title: __('Available slots'), value: availableSlotsCount }"
					/>
				</Tooltip>
				<Tooltip :text="__('Slots with active bookings')">
					<NumberChart
						class="border rounded-md"
						:config="{ title: __('Booked slots'), value: bookedSlotsCount }"
					/>
				</Tooltip>
				<Tooltip :text="__('Sessions awaiting payment')">
					<NumberChart
						class="border rounded-md"
						:config="{ title: __('Pending'), value: pendingSessionsCount }"
					/>
				</Tooltip>
			</div>

			<!-- Content Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
				<!-- Left: 2/3 — Sessions table -->
				<div class="lg:col-span-2 border rounded-md">
					<div class="flex items-center justify-between px-5 py-4 border-b">
						<h3 class="text-base font-semibold text-ink-gray-9">
							{{ __('Recent booked sessions') }}
						</h3>
						<router-link :to="{ name: 'TutorSessions' }" class="text-xs text-ink-blue-link hover:underline flex items-center gap-0.5">
							{{ __('View all') }}
							<span class="lucide-chevron-right size-3" aria-hidden="true" />
						</router-link>
					</div>

					<div v-if="recentBookings.length">
						<ListView
							:columns="sessionColumns"
							:rows="recentBookings"
							:options="{ selectable: false, showTooltip: false }"
							row-key="name"
						>
							<template #cell="{ column, row }">
								<template v-if="column.key === 'booking_status'">
									<Badge
										:label="row.booking_status"
										:theme="bookingStatusTheme(row.booking_status)"
										size="sm"
									/>
								</template>
								<template v-else-if="column.key === 'start_datetime'">
									<span class="text-sm text-ink-gray-7">{{ formatTime(row.start_datetime) }}</span>
								</template>
								<template v-else-if="column.key === 'meeting_link'">
									<a
										v-if="row.booking_status === 'Confirmed' && row.meeting_link"
										:href="row.meeting_link"
										target="_blank"
										@click.stop
									>
										<Button variant="solid" size="sm" :label="__('Join class')" />
									</a>
									<span
										v-else-if="row.booking_status === 'Confirmed'"
										class="text-xs text-ink-gray-5 italic"
									>
										{{ __('Generating...') }}
									</span>
									<span v-else class="text-ink-gray-4 text-xs">—</span>
								</template>
								<template v-else>
									<span class="text-sm text-ink-gray-7">{{ row[column.key] || '—' }}</span>
								</template>
							</template>
						</ListView>
					</div>

					<div v-else class="py-16 text-center">
						<span class="lucide-calendar-x size-8 text-ink-gray-4 mx-auto block mb-3" aria-hidden="true" />
						<p class="text-sm text-ink-gray-6">{{ __('No sessions booked yet.') }}</p>
					</div>
				</div>

				<!-- Right: 1/3 — Profile status + Quick actions -->
				<div class="space-y-4">
					<!-- Profile Status -->
					<div class="border rounded-md">
						<div class="px-5 py-4 border-b">
							<h3 class="text-base font-semibold text-ink-gray-9">{{ __('Profile status') }}</h3>
						</div>
						<div class="px-5 py-4 space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-sm text-ink-gray-6">{{ __('Availability') }}</span>
								<Badge
									:label="availabilityStatus"
									:theme="availabilityStatus === 'Active & verified' ? 'green' : 'red'"
									size="sm"
								/>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-sm text-ink-gray-6">{{ __('Verification') }}</span>
								<Badge
									:label="profile.verification_status || __('Pending')"
									:theme="profile.verification_status === 'Verified' ? 'green' : 'orange'"
									size="sm"
								/>
							</div>
						</div>
					</div>

					<!-- Quick Actions -->
					<div class="border rounded-md">
						<div class="px-5 py-4 border-b">
							<h3 class="text-base font-semibold text-ink-gray-9">{{ __('Quick actions') }}</h3>
						</div>
						<div class="px-5 py-4 space-y-2">
							<router-link :to="{ name: 'TutorProfile' }" class="block">
								<Button
									variant="outline"
									theme="gray"
									class="w-full justify-start"
									icon-left="lucide-user"
									:label="__('Manage profile')"
								/>
							</router-link>
							<router-link :to="{ name: 'SlotCalendar' }" class="block">
								<Button
									variant="outline"
									theme="gray"
									class="w-full justify-start"
									icon-left="lucide-calendar"
									:label="__('View slot calendar')"
								/>
							</router-link>
							<router-link :to="{ name: 'TutorSessions' }" class="block">
								<Button
									variant="outline"
									theme="gray"
									class="w-full justify-start"
									icon-left="lucide-video"
									:label="__('All sessions')"
								/>
							</router-link>
						</div>
					</div>

					<!-- Upcoming Sessions Preview -->
					<div class="border rounded-md">
						<div class="px-5 py-4 border-b">
							<h3 class="text-base font-semibold text-ink-gray-9">{{ __('Upcoming sessions') }}</h3>
						</div>

						<div v-if="upcomingBookings.length" class="divide-y">
							<div
								v-for="b in upcomingBookings.slice(0, 5)"
								:key="b.name"
								class="px-5 py-3 space-y-1"
							>
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-ink-gray-9">{{ b.student }}</span>
									<Badge
										:label="b.booking_status"
										:theme="bookingStatusTheme(b.booking_status)"
										size="sm"
									/>
								</div>
								<p class="text-xs text-ink-gray-5">{{ formatTime(b.start_datetime) }}</p>
							</div>
						</div>

						<div v-else class="px-5 py-10 text-center">
							<span class="lucide-calendar size-7 text-ink-gray-4 mx-auto block mb-2" aria-hidden="true" />
							<p class="text-sm text-ink-gray-6">{{ __('No upcoming sessions.') }}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import {
	Breadcrumbs,
	LoadingIndicator,
	Button,
	Badge,
	NumberChart,
	Tooltip,
	ListView,
} from 'frappe-ui'
import { useTutorDashboardStore } from '@/stores/useTutorDashboardStore'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'
import { convertToLocal, isSessionUpcoming } from '@/utils/timezone'

// Customization for Smart Learning App: Tutor Dashboard — rebuilt to match Frappe LMS Statistics design
const dashboardStore = useTutorDashboardStore()

onMounted(async () => {
	await dashboardStore.dashboardData.submit()
})

const breadcrumbs = computed(() => [
	{ label: __('Tutor Dashboard'), route: { name: 'TutorDashboard' } },
])

const profile = computed(() => dashboardStore.dashboardData.data?.profile)
const bookings = computed(() => dashboardStore.dashboardData.data?.sessions || [])
const slots = computed(() => dashboardStore.dashboardData.data?.slots || [])

// Recent 10 bookings for the table
const recentBookings = computed(() => bookings.value.slice(0, 10))

// Upcoming confirmed bookings for the right panel
const upcomingBookings = computed(() =>
	bookings.value.filter(
		(b) =>
			(b.booking_status === 'Confirmed' || b.booking_status === 'Payment Success') &&
			isSessionUpcoming(b.start_datetime)
	)
)

const availabilityStatus = computed(() => {
	if (!profile.value) return 'No profile'
	return profile.value.active && profile.value.verification_status === 'Verified'
		? 'Active & verified'
		: 'Inactive / pending'
})

const dashboardSubtitle = computed(() => {
	const upcoming = upcomingSessionsCount.value
	if (upcoming > 0) {
		const suffix = upcoming > 1 ? __('upcoming sessions') : __('upcoming session')
		return __('You have {0} {1} today.').format(upcoming, suffix)
	}
	return __('Manage your tutoring schedule and students.')
})

const bookedSlotsCount = computed(() => slots.value.filter((s) => s.status === 'Booked').length)
const availableSlotsCount = computed(() => slots.value.filter((s) => s.status === 'Available').length)

const upcomingSessionsCount = computed(() =>
	bookings.value.filter(
		(s) =>
			(s.booking_status === 'Confirmed' || s.booking_status === 'Payment Success') &&
			isSessionUpcoming(s.start_datetime)
	).length
)

const completedSessionsCount = computed(() =>
	bookings.value.filter(
		(s) =>
			s.booking_status === 'Completed' ||
			((s.booking_status === 'Confirmed' || s.booking_status === 'Payment Success') &&
				!isSessionUpcoming(s.start_datetime))
	).length
)

const pendingSessionsCount = computed(() =>
	bookings.value.filter(
		(s) => s.booking_status === 'Pending Payment' && isSessionUpcoming(s.start_datetime)
	).length
)

const uniqueStudentsCount = computed(
	() => new Set(bookings.value.map((b) => b.student).filter(Boolean)).size
)

// ListView columns for sessions table
const sessionColumns = [
	{ label: __('Student'), key: 'student', width: 180 },
	{ label: __('Subject'), key: 'subject', width: 120 },
	{ label: __('Date / Time'), key: 'start_datetime', width: 200 },
	{ label: __('Status'), key: 'booking_status', width: 130 },
	{ label: __('Meeting'), key: 'meeting_link', width: 100 },
]

function formatTime(utcTime) {
	const localObj = convertToLocal(utcTime)
	return localObj ? localObj.format('DD MMM YYYY, hh:mm A') : '—'
}

function bookingStatusTheme(status) {
	switch (status) {
		case 'Confirmed': return 'blue'
		case 'Completed': return 'green'
		case 'Payment Success': return 'green'
		case 'Cancelled': return 'red'
		case 'Expired': return 'gray'
		case 'Pending Payment': return 'orange'
		default: return 'gray'
	}
}

function goToMeeting(link) {
	if (link) window.open(link, '_blank')
}
</script>
