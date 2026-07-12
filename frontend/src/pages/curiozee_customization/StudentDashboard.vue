<template>
	<div class="w-full">
		<LayoutHeader v-if="showHeader">
			<template #left-header>
				<div class="text-xl font-bold text-ink-gray-9">
					{{ __('Hey') }}, {{ studentDisplayName }} 👋
				</div>
			</template>
			<template #right-header>
				<div
					@click="showStreakModal = true"
					class="bg-surface-amber-2 px-2 py-1 rounded-md cursor-pointer"
				>
					<span> 🔥 </span>
					<span class="text-ink-gray-9">
						{{ streakInfo.data?.current_streak || 0 }}
					</span>
				</div>
			</template>
		</LayoutHeader>

		<div v-if="dashboardData.loading" class="flex justify-center py-20">
			<LoadingIndicator class="w-8 h-8 text-ink-gray-4" />
		</div>

		<div v-else-if="dashboardData.error" class="p-5">
			<div class="border rounded-md p-4 bg-surface-red-1 text-ink-red-6 text-sm">
				{{ __('Error loading dashboard data. Please try again.') }}
			</div>
		</div>

		<div v-else class="p-5">
			<!-- Subtitle -->
			<div class="text-lg text-ink-gray-6 leading-6 mb-4">
				{{ subtitle }}
			</div>

			<!-- Continue Learning Banner -->
			<div
				v-if="dashboardData.data?.continue_learning?.has_course"
				class="border rounded-md p-5 mb-4"
			>
				<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div class="flex-1 space-y-2">
						<Badge theme="blue" size="sm">
							<template #prefix>
								<span class="lucide-sparkles size-3" aria-hidden="true" />
							</template>
							{{ __('Continue Learning') }}
						</Badge>
						<div>
							<h3 class="text-base font-semibold text-ink-gray-9">
								{{ dashboardData.data.continue_learning.course_title }}
							</h3>
							<p class="text-sm text-ink-gray-6 mt-0.5">
								<span class="font-medium text-ink-gray-8">{{ __('Next:') }}</span>
								{{ ' ' + dashboardData.data.continue_learning.lesson_title }}
							</p>
						</div>
						<div class="max-w-xs">
							<div class="flex justify-between text-xs text-ink-gray-5 mb-1">
								<span>{{ __('Course progress') }}</span>
								<span>{{ Math.round(dashboardData.data.continue_learning.progress) }}%</span>
							</div>
							<!-- Use frappe Progress component -->
							<Progress
								size="sm"
								:value="dashboardData.data.continue_learning.progress"
							/>
						</div>
					</div>
					<Button
						variant="solid"
						theme="gray"
						size="lg"
						icon-left="lucide-play"
						:label="__('Resume lesson')"
						@click="resumeLesson"
					/>
				</div>
			</div>

			<!-- Stats Grid — mirrors Statistics.vue exactly -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
				<Tooltip v-for="stat in analyticsStats" :key="stat.label" :text="stat.label">
					<NumberChart
						class="border rounded-md"
						:config="{ title: stat.label, value: `${stat.value}${stat.suffix || ''}` }"
					/>
				</Tooltip>
			</div>

			<!-- Sections: full-width stack -->
			<div class="space-y-4 mt-4">
				<!-- Upcoming Sessions -->
				<div class="border rounded-md">
					<div class="flex items-center justify-between px-5 py-4 border-b">
						<h3 class="text-base font-semibold text-ink-gray-9">
							{{ __('Upcoming sessions') }}
						</h3>
						<Badge
							theme="gray"
							size="sm"
							:label="`${dashboardData.data?.upcoming_sessions?.length || 0} ${__('scheduled')}`"
						/>
					</div>

					<div v-if="dashboardData.data?.upcoming_sessions?.length" class="divide-y">
						<div
							v-for="session in dashboardData.data.upcoming_sessions"
							:key="session.booking_id"
							class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4"
						>
							<div class="space-y-1">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="font-medium text-sm text-ink-gray-9">
										{{ session.tutor_name }}
									</span>
									<Badge theme="blue" size="sm" :label="session.subject" />
									<Badge v-if="session.class_name" theme="gray" size="sm" :label="session.class_name" />
								</div>
								<div class="flex flex-wrap gap-x-4 text-xs text-ink-gray-5">
									<span class="flex items-center gap-1">
										<span class="lucide-calendar size-3" aria-hidden="true" />
										{{ formatDate(session.start_datetime) }}
									</span>
									<span class="flex items-center gap-1">
										<span class="lucide-clock size-3" aria-hidden="true" />
										{{ formatSessionTime(session.start_datetime, session.end_datetime) }}
									</span>
								</div>
							</div>
							<div class="shrink-0">
								<a v-if="isSessionActive(session)" :href="session.meeting_link" target="_blank">
									<Button
										variant="solid"
										theme="gray"
										size="sm"
										icon-left="lucide-video"
										:label="__('Join session')"
									/>
								</a>
								<Button
									v-else
									variant="outline"
									theme="gray"
									size="sm"
									icon-left="lucide-clock"
									:label="__('Scheduled')"
									:disabled="true"
								/>
							</div>
						</div>
					</div>

					<div v-else class="px-5 py-12 text-center">
						<span class="lucide-calendar size-8 text-ink-gray-4 mx-auto block mb-3" aria-hidden="true" />
						<p class="text-sm text-ink-gray-6">{{ __('No upcoming sessions.') }}</p>
						<router-link :to="{ name: 'TutorSearch' }">
							<Button variant="ghost" theme="gray" size="sm" class="mt-3" :label="__('Book a session')" />
						</router-link>
					</div>
				</div>

				<!-- Revision Recommendations -->
				<div class="border rounded-md">
					<div class="flex items-center justify-between px-5 py-4 border-b">
						<h3 class="text-base font-semibold text-ink-gray-9">
							{{ __('Revision recommendations') }}
						</h3>
						<router-link :to="{ name: 'Revision' }" class="text-xs text-ink-blue-link hover:underline flex items-center gap-0.5">
							{{ __('View all') }}
							<span class="lucide-chevron-right size-3" aria-hidden="true" />
						</router-link>
					</div>

					<div v-if="dashboardData.data?.revision_suggestions?.length" class="divide-y">
						<RevisionCard
							v-for="rec in dashboardData.data.revision_suggestions"
							:key="rec.name"
							:recommendation="rec"
							@status-updated="dashboardData.reload()"
						/>
					</div>

					<div v-else class="px-5 py-12 text-center">
						<span class="lucide-check-circle size-8 text-ink-gray-4 mx-auto block mb-3" aria-hidden="true" />
						<p class="text-sm text-ink-gray-6">{{ __('All revisions completed. Outstanding job.') }}</p>
					</div>
				</div>

				<!-- Recommended Tutors -->
				<div class="border rounded-md">
					<div class="flex items-center justify-between px-5 py-4 border-b">
						<h3 class="text-base font-semibold text-ink-gray-9">{{ __('Recommended tutors') }}</h3>
						<router-link :to="{ name: 'TutorSearch' }" class="text-xs text-ink-blue-link hover:underline flex items-center gap-0.5">
							{{ __('View all') }}
							<span class="lucide-chevron-right size-3" aria-hidden="true" />
						</router-link>
					</div>

					<div v-if="dashboardData.data?.recommended_tutors?.length" class="divide-y">
						<TutorMatchCard
							v-for="tutor in dashboardData.data.recommended_tutors"
							:key="tutor.name"
							:tutor="tutor"
						/>
					</div>

					<div v-else class="px-5 py-12 text-center">
						<span class="lucide-users size-8 text-ink-gray-4 mx-auto block mb-3" aria-hidden="true" />
						<p class="text-sm text-ink-gray-6">{{ __('No recommended tutors available.') }}</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<Streak v-if="showHeader" v-model="showStreakModal" :streakInfo="streakInfo" />
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted } from 'vue'
import {
	createResource,
	call,
	usePageMeta,
	Button,
	Badge,
	LoadingIndicator,
	NumberChart,
	Tooltip,
	Progress,
} from 'frappe-ui'
import { useRouter } from 'vue-router'
import RevisionCard from '@/components/curiozee_customization/RevisionCard.vue'
import TutorMatchCard from '@/components/curiozee_customization/TutorMatchCard.vue'
import Streak from '@/pages/Home/Streak.vue'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'
import { useStudentProfileStore } from '@/stores/useStudentProfileStore'

// Customization for Smart Learning App: Student Dashboard — rebuilt to match Frappe LMS Statistics design
const dayjs = inject<any>('$dayjs')
const router = useRouter()
const user = inject<any>('$user')
const studentProfileStore = useStudentProfileStore()

// showHeader=true is the default for standalone route; false when embedded in Home.vue
const props = withDefaults(
	defineProps<{
		showHeader?: boolean
		myLiveClasses?: any
	}>(),
	{ showHeader: true }
)

const showStreakModal = ref(false)
const evalCount = ref(0)

const dashboardData = createResource({
	url: 'smart_learning.api.student_api.get_student_dashboard_data',
	auto: true,
})

const myLiveClassesResource = createResource({
	url: 'lms.lms.api.get_my_live_classes',
	auto: true,
})

const streakInfo = createResource({
	url: 'lms.lms.api.get_streak_info',
	auto: true,
})

const myLiveClassesData = computed(() => props.myLiveClasses || myLiveClassesResource)

const studentDisplayName = computed(() => {
	if (studentProfileStore.profile.data?.full_name) {
		return studentProfileStore.profile.data.full_name
	}
	return user.data?.full_name
})

const subtitle = computed(() => {
	const liveClasses = myLiveClassesData.value?.data || []
	const liveClassSuffix = liveClasses.length > 1 ? __('live classes') : __('live class')
	const evalSuffix = evalCount.value > 1 ? __('evaluations') : __('evaluation')
	if (liveClasses.length > 0 && evalCount.value > 0) {
		return __('You have {0} upcoming {1} and {2} {3} scheduled.').format(
			liveClasses.length, liveClassSuffix, evalCount.value, evalSuffix
		)
	} else if (liveClasses.length > 0) {
		return __('You have {0} upcoming {1}.').format(liveClasses.length, liveClassSuffix)
	} else if (evalCount.value > 0) {
		return __('You have {0} {1} scheduled.').format(evalCount.value, evalSuffix)
	}
	return __('Resume where you left off')
})

const analyticsStats = computed(() => {
	const a = dashboardData.data?.analytics || {}
	return [
		{ label: __('Enrolled courses'), value: a.enrolled_courses || 0 },
		{ label: __('Completed courses'), value: a.completed_courses || 0 },
		{ label: __('Completed lessons'), value: a.completed_lessons || 0 },
		{ label: __('Avg quiz score'), value: a.average_quiz_score || 0, suffix: '%' },
		{ label: __('Overall progress'), value: a.overall_progress || 0, suffix: '%' },
	]
})

function resumeLesson() {
	const cl = dashboardData.data?.continue_learning
	if (cl?.lesson_index) {
		const [chapter, lesson] = cl.lesson_index.split('-')
		router.push({
			name: 'Lesson',
			params: { courseName: cl.course_name, chapterNumber: chapter, lessonNumber: lesson },
		})
	}
}

function formatDate(dateStr: string) {
	return dateStr ? dayjs(dateStr).format('DD MMM YYYY') : ''
}

function formatSessionTime(startStr: string, endStr: string) {
	if (!startStr || !endStr) return ''
	return `${dayjs(startStr).format('hh:mm A')} – ${dayjs(endStr).format('hh:mm A')}`
}

function isSessionActive(session: any) {
	if (!session?.start_datetime || !session?.end_datetime) return false
	const now = dayjs()
	return now.isAfter(dayjs(session.start_datetime).subtract(10, 'minute'))
		&& now.isBefore(dayjs(session.end_datetime))
}




usePageMeta(() => ({ title: __('Student Dashboard') }))

onMounted(() => {
	studentProfileStore.profile.submit()
	call('frappe.client.get_count', {
		doctype: 'LMS Certificate Request',
		filters: {
			member: user?.data?.name,
			status: 'Upcoming',
			date: ['>=', dayjs().format('YYYY-MM-DD')],
		},
	}).then((data: any) => { evalCount.value = data })
})
</script>
