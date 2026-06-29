<template>
	<div class="space-y-8 py-6">
		<!-- Loading state -->
		<div v-if="dashboardData.loading" class="flex items-center justify-center min-h-[300px]">
			<div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
		</div>

		<!-- Error state -->
		<div v-else-if="dashboardData.error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
			{{ __('Error loading dashboard data. Please try again.') }}
		</div>

		<div v-else class="space-y-8">
			<!-- 1. Continue Learning Banner -->
			<div v-if="dashboardData.data?.continue_learning?.has_course"
				class="continue-learning-banner relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300">
				<!-- Background pattern -->
				<div class="absolute right-0 top-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-xl"></div>
				<div class="absolute bottom-0 left-1/3 -mb-6 h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>

				<div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
					<div class="space-y-3 flex-1">
						<span
							class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
							<Sparkles class="h-3.5 w-3.5 text-white" />
							{{ __('Continue Learning') }}
						</span>
						<div>
							<h3 class="text-2xl font-bold tracking-tight text-white sm:text-3xl">
								{{ dashboardData.data.continue_learning.course_title }}
							</h3>
							<p class="mt-2 text-indigo-100 text-sm font-medium leading-relaxed">
								<span class="text-white font-semibold">{{ __('Next Lesson:') }}</span>
								{{ ' ' + dashboardData.data.continue_learning.lesson_title }}
							</p>
						</div>

						<!-- Progress bar -->
						<div class="mt-4 max-w-md">
							<div class="flex items-center justify-between text-xs text-indigo-100 font-semibold mb-1">
								<span>{{ __('Course Progress') }}</span>
								<span>{{ Math.round(dashboardData.data.continue_learning.progress) }}%</span>
							</div>
							<div class="h-2 w-full bg-white/25 rounded-full overflow-hidden">
								<div class="h-full bg-emerald-400 rounded-full transition-all duration-500"
									:style="{ width: `${dashboardData.data.continue_learning.progress}%` }"></div>
							</div>
						</div>
					</div>

					<div class="flex items-center">
						<button @click="resumeLesson"
							class="resume-button inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl shadow-md active:scale-95 transition-all duration-150">
							<Play class="h-5 w-5 fill-current" />
							{{ __('Resume Lesson') }}
						</button>
					</div>
				</div>
			</div>

			<!-- 2. Learning Analytics Stats Grid -->
			<div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
				<div v-for="stat in analyticsStats" :key="stat.label"
					class="bg-surface-white p-5 rounded-2xl border border-outline-gray-2 shadow-sm hover:shadow-md transition-shadow">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ stat.label
							}}</span>
						<component :is="stat.icon" class="h-5 w-5" :class="stat.iconClass" />
					</div>
					<div class="mt-3 flex items-baseline gap-1.5">
						<span class="text-3xl font-bold text-ink-gray-9 tracking-tight">{{ stat.value }}</span>
						<span v-if="stat.suffix" class="text-sm font-semibold text-ink-gray-5">{{ stat.suffix }}</span>
					</div>
				</div>
			</div>

			<!-- 2-Column layout for other widgets -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Left Column (Span 2) -->
				<div class="lg:col-span-2 space-y-8">
					<!-- Upcoming Sessions Widget -->
					<div class="bg-surface-white rounded-2xl border border-outline-gray-2 shadow-sm p-6 space-y-4">
						<div class="flex items-center justify-between border-b border-outline-gray-2 pb-4">
							<div class="flex items-center gap-2">
								<div
									class="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
									<Calendar class="h-5 w-5" />
								</div>
								<h3 class="text-lg font-bold text-ink-gray-9">{{ __('Upcoming Sessions') }}</h3>
							</div>
							<span
								class="text-xs font-semibold text-ink-gray-5 bg-surface-gray-2 px-2.5 py-1 rounded-full">
								{{ dashboardData.data?.upcoming_sessions?.length || 0 }} {{ __('Scheduled') }}
							</span>
						</div>

						<div v-if="dashboardData.data?.upcoming_sessions?.length" class="space-y-4">
							<div v-for="session in dashboardData.data.upcoming_sessions" :key="session.booking_id"
								class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-outline-gray-2 rounded-xl hover:bg-surface-gray-2 transition-colors gap-4">
								<div class="space-y-2">
									<div class="flex items-center gap-2 flex-wrap">
										<span class="font-bold text-ink-gray-9">{{ session.tutor_name }}</span>
										<span
											class="px-2 py-0.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-full">{{
												session.subject }}</span>
										<span v-if="session.class_name"
											class="px-2 py-0.5 text-xs font-medium bg-surface-gray-3 text-ink-gray-6 rounded-full">{{
												session.class_name }}</span>
									</div>
									<div
										class="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs text-ink-gray-5 font-medium">
										<span class="flex items-center gap-1.5">
											<Calendar class="h-3.5 w-3.5 text-ink-gray-4" />
											{{ formatDate(session.start_datetime) }}
										</span>
										<span class="flex items-center gap-1.5">
											<Clock class="h-3.5 w-3.5 text-ink-gray-4" />
											{{ formatSessionTime(session.start_datetime, session.end_datetime) }}
										</span>
									</div>
								</div>

								<div class="w-full sm:w-auto">
									<a v-if="isSessionActive(session)" :href="session.meeting_link" target="_blank"
										class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm shadow-indigo-100 dark:shadow-none">
										<Video class="h-4 w-4" />
										{{ __('Join Session') }}
									</a>
									<span v-else
										class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-surface-gray-2 text-ink-gray-5 border border-outline-gray-2 font-medium rounded-lg text-sm cursor-not-allowed">
										<Clock class="h-4 w-4" />
										{{ __('Scheduled') }}
									</span>
								</div>
							</div>
						</div>

						<div v-else
							class="text-center py-10 text-ink-gray-4 border border-dashed rounded-xl border-outline-gray-3">
							<div class="text-3xl mb-2">📅</div>
							<p class="text-sm font-medium">{{ __('No upcoming live sessions.') }}</p>
							<router-link :to="{ name: 'TutorSearch' || 'BookSession' }"
								class="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline">
								{{ __('Book a tutoring session') }}
								<ChevronRight class="h-3 w-3" />
							</router-link>
						</div>
					</div>

					<!-- Revision Suggestions Widget -->
					<div class="bg-surface-white rounded-2xl border border-outline-gray-2 shadow-sm p-6 space-y-4">
						<div class="flex items-center justify-between border-b border-outline-gray-2 pb-4">
							<div class="flex items-center gap-2">
								<div
									class="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl">
									<RefreshCw class="h-5 w-5" />
								</div>
								<h3 class="text-lg font-bold text-ink-gray-9">{{ __('Revision Recommendations') }}</h3>
							</div>
							<router-link :to="{ name: 'Revision' }"
								class="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-0.5">
								{{ __('View all') }}
								<ChevronRight class="h-3 w-3" />
							</router-link>
						</div>

						<div v-if="dashboardData.data?.revision_suggestions?.length" class="space-y-4">
							<RevisionCard v-for="rec in dashboardData.data.revision_suggestions" :key="rec.name"
								:recommendation="rec" />
						</div>

						<div v-else
							class="text-center py-10 text-ink-gray-4 border border-dashed rounded-xl border-outline-gray-3">
							<div class="text-3xl mb-2">🎉</div>
							<p class="text-sm font-medium">{{ __('All revisions completed! Outstanding job.') }}</p>
						</div>
					</div>
				</div>

				<!-- Right Column (Span 1) -->
				<div class="space-y-8">
					<!-- Recent Activity Feed -->
					<div class="bg-surface-white rounded-2xl border border-outline-gray-2 shadow-sm p-6 space-y-6">
						<div class="flex items-center justify-between border-b border-outline-gray-2 pb-4">
							<div class="flex items-center gap-2">
								<div
									class="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
									<Activity class="h-5 w-5" />
								</div>
								<h3 class="text-lg font-bold text-ink-gray-9">{{ __('Recent Activity') }}</h3>
							</div>
						</div>

						<div v-if="dashboardData.data?.recent_activity?.length"
							class="relative pl-6 border-l-2 border-outline-gray-2 space-y-6">
							<div v-for="(act, idx) in dashboardData.data.recent_activity" :key="idx" class="relative">
								<!-- Icon dot -->
								<div class="absolute -left-[31px] top-0.5 bg-surface-white p-1 rounded-full border-2"
									:class="getActivityIconBorder(act.type)">
									<component :is="getActivityIcon(act.type)" class="h-3 w-3"
										:class="getActivityIconClass(act.type)" />
								</div>
								<div class="space-y-1">
									<p class="text-sm font-semibold text-ink-gray-9 leading-tight">
										{{ act.title }}
									</p>
									<p class="text-[11px] text-ink-gray-4 font-medium">
										{{ formatRelativeTime(act.timestamp) }}
									</p>
								</div>
							</div>
						</div>

						<div v-else class="text-center py-8 text-ink-gray-4">
							<p class="text-sm font-medium">{{ __('No recent activity recorded.') }}</p>
						</div>
					</div>

					<!-- Recommended Tutors Widget -->
					<div class="bg-surface-white rounded-2xl border border-outline-gray-2 shadow-sm p-6 space-y-4">
						<div class="flex items-center justify-between border-b border-outline-gray-2 pb-4">
							<div class="flex items-center gap-2">
								<div
									class="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
									<Sparkles class="h-5 w-5" />
								</div>
								<h3 class="text-lg font-bold text-ink-gray-9">{{ __('Recommended Tutors') }}</h3>
							</div>
							<router-link :to="{ name: 'TutorSearch' }"
								class="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-0.5">
								{{ __('View all') }}
								<ChevronRight class="h-3 w-3" />
							</router-link>
						</div>

						<div v-if="dashboardData.data?.recommended_tutors?.length" class="space-y-4">
							<TutorMatchCard
								v-for="tutor in dashboardData.data.recommended_tutors"
								:key="tutor.name"
								:tutor="tutor"
							/>
						</div>

						<div v-else
							class="text-center py-8 text-ink-gray-4 border border-dashed rounded-xl border-outline-gray-3">
							<p class="text-xs font-medium">{{ __('No recommended tutors currently available.') }}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, inject, defineProps } from 'vue'
import { createResource } from 'frappe-ui'
import { useRouter } from 'vue-router'
import {
	Calendar,
	Clock,
	Video,
	BookOpen,
	Award,
	RefreshCw,
	CheckCircle,
	TrendingUp,
	BarChart2,
	ChevronRight,
	Play,
	Sparkles,
	Activity
} from 'lucide-vue-next'
import RevisionCard from '@/components/cz/RevisionCard.vue'
import TutorMatchCard from '@/components/cz/TutorMatchCard.vue'

const dayjs = inject<any>('$dayjs')
const router = useRouter()

const props = defineProps<{
	myLiveClasses?: any
}>()

const dashboardData = createResource({
	url: 'smart_learning.api.student_api.get_student_dashboard_data',
	auto: true,
})

const analyticsStats = computed(() => {
	const analytics = dashboardData.data?.analytics || {}
	return [
		{
			label: 'Enrolled Courses',
			value: analytics.enrolled_courses || 0,
			icon: BookOpen,
			iconClass: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30 p-1 rounded-lg',
		},
		{
			label: 'Completed Courses',
			value: analytics.completed_courses || 0,
			icon: CheckCircle,
			iconClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-1 rounded-lg',
		},
		{
			label: 'Completed Lessons',
			value: analytics.completed_lessons || 0,
			icon: Award,
			iconClass: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 p-1 rounded-lg',
		},
		{
			label: 'Avg Quiz Score',
			value: analytics.average_quiz_score || 0,
			suffix: '%',
			icon: TrendingUp,
			iconClass: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-1 rounded-lg',
		},
		{
			label: 'Overall Progress',
			value: analytics.overall_progress || 0,
			suffix: '%',
			icon: BarChart2,
			iconClass: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30 p-1 rounded-lg',
		},
	]
})

function resumeLesson() {
	const continueLearning = dashboardData.data?.continue_learning
	if (continueLearning && continueLearning.lesson_index) {
		const parts = continueLearning.lesson_index.split('-')
		router.push({
			name: 'Lesson',
			params: {
				courseName: continueLearning.course_name,
				chapterNumber: parts[0],
				lessonNumber: parts[1],
			},
		})
	}
}

function formatDate(dateStr: string) {
	if (!dateStr) return ''
	return dayjs(dateStr).format('DD MMM YYYY')
}

function formatSessionTime(startStr: string, endStr: string) {
	if (!startStr || !endStr) return ''
	const start = dayjs(startStr).format('hh:mm A')
	const end = dayjs(endStr).format('hh:mm A')
	return `${start} - ${end}`
}

function isSessionActive(session: any) {
	if (!session || !session.start_datetime || !session.end_datetime) return false
	const now = dayjs()
	const start = dayjs(session.start_datetime).subtract(10, 'minute')
	const end = dayjs(session.end_datetime)
	return now.isAfter(start) && now.isBefore(end)
}

function formatRelativeTime(timestamp: string) {
	if (!timestamp) return ''
	return dayjs(timestamp).fromNow()
}

function getActivityIcon(type: string) {
	switch (type) {
		case 'quiz':
			return Award
		case 'session':
			return Calendar
		case 'revision':
			return RefreshCw
		case 'lesson':
		default:
			return BookOpen
	}
}

function getActivityIconClass(type: string) {
	switch (type) {
		case 'quiz':
			return 'text-amber-600'
		case 'session':
			return 'text-indigo-600'
		case 'revision':
			return 'text-purple-600'
		case 'lesson':
		default:
			return 'text-blue-600'
	}
}

function getActivityIconBorder(type: string) {
	switch (type) {
		case 'quiz':
			return 'activity-badge-quiz'
		case 'session':
			return 'activity-badge-session'
		case 'revision':
			return 'activity-badge-revision'
		case 'lesson':
		default:
			return 'activity-badge-lesson'
	}
}
</script>

<style scoped>
.continue-learning-banner {
	background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%) !important;
	color: #ffffff !important;
}

:global([data-theme="dark"]) .continue-learning-banner {
	background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%) !important;
	border: 1px solid #334155 !important;
}

.resume-button {
	background-color: #ffffff !important;
	color: #4f46e5 !important;
}

.resume-button:hover {
	background-color: #f3f4f6 !important;
}

:global([data-theme="dark"]) .resume-button {
	background-color: #1e293b !important;
	color: #f8fafc !important;
	border: 1px solid #475569 !important;
}

:global([data-theme="dark"]) .resume-button:hover {
	background-color: #334155 !important;
}

.activity-badge-quiz {
	background-color: #fef3c7;
	border-color: #fde68a;
}

:global([data-theme="dark"]) .activity-badge-quiz {
	background-color: rgba(217, 119, 6, 0.15) !important;
	border-color: rgba(217, 119, 6, 0.3) !important;
}

.activity-badge-session {
	background-color: #e0e7ff;
	border-color: #c7d2fe;
}

:global([data-theme="dark"]) .activity-badge-session {
	background-color: rgba(79, 70, 229, 0.15) !important;
	border-color: rgba(79, 70, 229, 0.3) !important;
}

.activity-badge-revision {
	background-color: #f3e8ff;
	border-color: #e9d5ff;
}

:global([data-theme="dark"]) .activity-badge-revision {
	background-color: rgba(147, 51, 234, 0.15) !important;
	border-color: rgba(147, 51, 234, 0.3) !important;
}

.activity-badge-lesson {
	background-color: #eff6ff;
	border-color: #dbeafe;
}

:global([data-theme="dark"]) .activity-badge-lesson {
	background-color: rgba(37, 99, 235, 0.15) !important;
	border-color: rgba(37, 99, 235, 0.3) !important;
}
</style>
