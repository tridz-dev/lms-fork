<template>
	<div class="bg-surface-gray-2 min-h-screen">
		<LayoutHeader>
			<template #left-header>
				<Breadcrumbs
					class="h-7"
					:items="breadcrumbs"
				/>
			</template>
		</LayoutHeader>

		<div class="flex min-h-0 w-full flex-1 flex-col p-5 pb-10">
			<!-- Header Section -->
			<div class="border-b pb-4 mb-6 bg-surface-white p-6 rounded-lg border shadow-sm">
				<h2 class="text-2xl font-bold text-ink-gray-9">
					{{ __('Smart Revision Dashboard') }}
				</h2>
				<p class="text-sm text-ink-gray-5 mt-1">
					{{ __('Structured concept review based on your learning activity, quiz scores, and tutoring history.') }}
				</p>
			</div>

			<!-- Main 2-Column Layout -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
				
				<!-- Left Column: Feed & Recommendations -->
				<div class="lg:col-span-2 space-y-6">
					
					<!-- Status Filter Tabs -->
					<div class="mb-4">
						<TabButtons
							class="w-full flex"
							:buttons="tabButtons"
							v-model="activeTab"
						/>
					</div>

					<!-- List of recommendations -->
					<div v-if="revisionStore.revisionFetcher.loading" class="flex justify-center py-20 bg-surface-white border rounded-lg shadow-sm">
						<LoadingIndicator class="w-10 h-10 text-gray-400" />
					</div>
					
					<div v-else-if="filteredRecommendations && filteredRecommendations.length" class="space-y-4">
						<RevisionCard
							v-for="rec in filteredRecommendations"
							:key="rec.name"
							:recommendation="rec"
						/>
					</div>
					
					<div v-else class="text-center py-20 text-ink-gray-5 border rounded-lg bg-surface-white shadow-sm px-6">
						<div class="text-4xl mb-3">🎉</div>
						<h3 class="font-bold text-base text-ink-gray-8 mb-1">{{ __('All caught up!') }}</h3>
						<p class="text-xs text-ink-gray-5 max-w-md mx-auto">
							{{ __('No recommendations match this status. Keep studying new lessons or check other tabs!') }}
						</p>
					</div>
				</div>

				<!-- Right Column: Analytics Sidebar -->
				<div class="space-y-6">
					
					<!-- Pending Count Card -->
					<div class="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-lg shadow-md border border-amber-600">
						<span class="text-xs font-bold uppercase tracking-wider text-amber-100 block mb-1">
							{{ __('Pending Revisions') }}
						</span>
						<div class="flex items-baseline gap-2">
							<span class="text-4xl font-extrabold">{{ pendingCount }}</span>
							<span class="text-xs text-amber-100">{{ __('lessons to revisit') }}</span>
						</div>
					</div>

					<!-- Weak Subjects widget -->
					<div class="bg-surface-white border rounded-lg p-5 shadow-sm">
						<h3 class="font-bold text-xs uppercase tracking-wider text-ink-gray-4 border-b pb-2 mb-3">
							{{ __('Weak Subjects & Topics') }}
						</h3>
						<div v-if="revisionStore.dashboardSummary.weak_subjects && revisionStore.dashboardSummary.weak_subjects.length">
							<div
								v-for="sub in revisionStore.dashboardSummary.weak_subjects"
								:key="sub.subject"
								class="flex justify-between items-center py-2 border-b last:border-0 text-xs"
							>
								<div class="min-w-0 pr-2">
									<p class="font-semibold text-ink-gray-8 truncate">{{ sub.subject }}</p>
									<p class="text-[10px] text-ink-gray-5">{{ sub.attempts_count }} {{ __('attempts') }}</p>
								</div>
								<Badge
									:label="`${sub.average_score}%`"
									:theme="sub.average_score < 50 ? 'red' : 'amber'"
									size="sm"
								/>
							</div>
						</div>
						<div v-else class="text-center py-6 text-xs text-ink-gray-5">
							{{ __('No quiz data available yet.') }}
						</div>
					</div>

					<!-- Recommended Topics widget -->
					<div class="bg-surface-white border rounded-lg p-5 shadow-sm">
						<h3 class="font-bold text-xs uppercase tracking-wider text-ink-gray-4 border-b pb-2 mb-3">
							{{ __('Recommended Topics') }}
						</h3>
						<div v-if="revisionStore.dashboardSummary.recommended_topics && revisionStore.dashboardSummary.recommended_topics.length">
							<div
								v-for="topic in revisionStore.dashboardSummary.recommended_topics"
								:key="topic.lesson"
								class="py-2.5 border-b last:border-0 text-xs"
							>
								<div class="flex items-start justify-between gap-2">
									<p class="font-semibold text-ink-gray-8 leading-tight truncate-2-lines flex-1">
										{{ topic.lesson_title || topic.lesson }}
									</p>
									<Badge
										:label="topic.priority"
										:theme="topic.priority === 'High' ? 'red' : 'gray'"
										size="sm"
									/>
								</div>
								<p v-if="topic.course_title" class="text-[10px] text-ink-gray-5 mt-0.5 truncate">
									{{ topic.course_title }}
								</p>
							</div>
						</div>
						<div v-else class="text-center py-6 text-xs text-ink-gray-5">
							{{ __('All recommendations completed!') }}
						</div>
					</div>



					<!-- Recently Completed Lessons widget -->
					<div class="bg-surface-white border rounded-lg p-5 shadow-sm">
						<h3 class="font-bold text-xs uppercase tracking-wider text-ink-gray-4 border-b pb-2 mb-3">
							{{ __('Recently Completed Lessons') }}
						</h3>
						<div v-if="revisionStore.dashboardSummary.recently_completed && revisionStore.dashboardSummary.recently_completed.length">
							<div
								v-for="act in revisionStore.dashboardSummary.recently_completed"
								:key="act.lesson"
								class="py-2 border-b last:border-0 text-xs"
							>
								<p class="font-semibold text-ink-gray-8 truncate">
									{{ act.lesson_title || act.lesson }}
								</p>
								<div class="flex justify-between items-center text-[10px] text-ink-gray-5 mt-0.5">
									<span class="truncate pr-2">{{ act.course_title }}</span>
									<span class="shrink-0 font-medium">{{ formatDateShort(act.completed_on) }}</span>
								</div>
							</div>
						</div>
						<div v-else class="text-center py-6 text-xs text-ink-gray-5">
							{{ __('No lessons completed recently.') }}
						</div>
					</div>

				</div>

			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, onMounted, ref, inject } from 'vue'
import { Breadcrumbs, LoadingIndicator, TabButtons, Badge } from 'frappe-ui'
import { useRevisionStore } from '@/stores/useRevisionStore'
import RevisionCard from '@/components/cz/RevisionCard.vue'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'

const revisionStore = useRevisionStore()
const activeTab = ref('Active')
const dayjs = inject('$dayjs')

onMounted(() => {
	revisionStore.fetchRecommendations()
	revisionStore.fetchDashboardSummary()
})

const breadcrumbs = computed(() => [
	{ label: __('Revision Recommendations'), route: { name: 'Revision' } }
])

const tabButtons = computed(() => {
	return [
		{ value: 'Active', label: pendingCount.value ? `${__('Active')} (${pendingCount.value})` : __('Active') },
		{ value: 'Completed', label: __('Completed') },
		{ value: 'Dismissed', label: __('Dismissed') },
		{ value: 'All', label: __('All') }
	]
})

const pendingCount = computed(() => {
	return (revisionStore.recommendations || []).filter(r => ['Pending', 'Viewed'].includes(r.status)).length
})

const filteredRecommendations = computed(() => {
	const recs = revisionStore.recommendations || []
	if (activeTab.value === 'Active') {
		return recs.filter(r => ['Pending', 'Viewed'].includes(r.status))
	} else if (activeTab.value === 'Completed') {
		return recs.filter(r => r.status === 'Completed')
	} else if (activeTab.value === 'Dismissed') {
		return recs.filter(r => r.status === 'Dismissed')
	}
	return recs
})

function formatDateShort(dateStr) {
	if (!dateStr || !dayjs) return 'N/A'
	return dayjs(dateStr).format('DD MMM')
}
</script>
