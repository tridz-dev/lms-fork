<template>
	<div>
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
			<div class="border-b pb-5 mb-6">
				<h2 class="text-2xl font-bold text-ink-gray-9 leading-tight">
					{{ __('Smart Revision Dashboard') }}
				</h2>
				<p class="text-sm text-ink-gray-5 mt-1.5 leading-relaxed">
					{{ __('Structured concept review based on your learning activity, quiz scores, and tutoring history.') }}
				</p>
			</div>

			<!-- Single Column Stacked Layout -->
			<div class="space-y-6 w-full">
				
				<!-- Status Filter Tabs -->
				<div class="mb-4">
					<TabButtons
						:buttons="tabButtons"
						v-model="activeTab"
					/>
				</div>

				<!-- List of recommendations -->
				<div v-if="revisionStore.revisionFetcher.loading" class="flex justify-center py-20 bg-surface-white border border-outline-gray-2 rounded-xl">
					<Spinner class="w-8 h-8 text-ink-gray-4" />
				</div>
				
				<div v-else-if="filteredRecommendations && filteredRecommendations.length" class="space-y-4">
					<RevisionCard
						v-for="rec in filteredRecommendations"
						:key="rec.name"
						:recommendation="rec"
						@status-updated="onStatusUpdated"
					/>
				</div>
				
				<div v-else class="text-center py-20 border border-outline-gray-2 rounded-xl bg-surface-white px-6">
					<span class="lucide-sparkles size-10 text-ink-gray-4 mx-auto block mb-3" aria-hidden="true" />
					<h3 class="font-semibold text-base text-ink-gray-8 mb-1">{{ __('All caught up!') }}</h3>
					<p class="text-xs text-ink-gray-5 max-w-md mx-auto">
						{{ __('No recommendations match this status. Keep studying new lessons or check other tabs!') }}
					</p>
				</div>

				<!-- Pending Count Card -->
				<div class="bg-surface-white border border-outline-gray-2 p-5 rounded-xl shadow-sm space-y-2">
					<div class="flex items-center justify-between mb-1">
						<span class="text-xs font-bold uppercase tracking-wider text-ink-gray-5">
							{{ __('Pending Revisions') }}
						</span>
						<span class="size-5 text-ink-orange-5" aria-hidden="true" />
					</div>
					<div class="flex items-baseline gap-2">
						<span class="text-xs font-extrabold text-ink-gray-9 leading-none">{{ pendingCount }}</span>
						<span class="text-xs text-ink-gray-5 font-normal">{{ __('lessons to revisit') }}</span>
					</div>
				</div>

				<!-- Weak Subjects widget -->
				<div class="bg-surface-white border border-outline-gray-2 rounded-xl p-5 shadow-sm space-y-3">
					<div class="flex items-center justify-between pb-3 mb-1">
						<h3 class="text-xs font-bold uppercase tracking-wider text-ink-gray-5">
							<span class=" size-4 text-ink-red-5" aria-hidden="true" />
							{{ __('Weak Subjects & Topics') }}
						</h3>
					</div>
					<div v-if="revisionStore.dashboardSummary.weak_subjects && revisionStore.dashboardSummary.weak_subjects.length" class="divide-y divide-outline-gray-1">
						<div
							v-for="sub in revisionStore.dashboardSummary.weak_subjects"
							:key="sub.subject"
							class="flex justify-between items-center py-2.5 first:pt-0 last:pb-0 text-xs"
						>
							<div class="min-w-0 pr-2 space-y-0.5">
								<p class="font-semibold text-ink-gray-8 truncate">{{ sub.subject }}</p>
								<p class="text-[10px] text-ink-gray-5 font-medium">{{ sub.attempts_count }} {{ __('attempts') }}</p>
							</div>
							<Badge
								:label="`${sub.average_score}%`"
								:theme="sub.average_score < 50 ? 'red' : 'orange'"
								size="sm"
							/>
						</div>
					</div>
					<div v-else class="text-center py-6 text-xs text-ink-gray-5">
						<span class=" size-6 text-ink-gray-3 mx-auto block mb-2" aria-hidden="true" />
						{{ __('No quiz data available yet.') }}
					</div>
				</div>

				<!-- Recommended Topics widget -->
				<div class="bg-surface-white border border-outline-gray-2 rounded-xl p-5 shadow-sm space-y-3">
					<div class="flex items-center justify-between pb-3 mb-1">
						<h3 class="text-xs font-bold uppercase tracking-wider text-ink-gray-5">
							<span class="size-4 text-ink-blue-5" aria-hidden="true" />
							{{ __('Recommended Topics') }}
						</h3>
					</div>
					<div v-if="revisionStore.dashboardSummary.recommended_topics && revisionStore.dashboardSummary.recommended_topics.length" class="divide-y divide-outline-gray-1">
						<div
							v-for="topic in revisionStore.dashboardSummary.recommended_topics"
							:key="topic.lesson"
							class="py-2.5 first:pt-0 last:pb-0 text-xs"
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
							<p v-if="topic.course_title" class="text-[10px] text-ink-gray-5 mt-1 truncate">
								{{ topic.course_title }}
							</p>
						</div>
					</div>
					<div v-else class="text-center py-6 text-xs text-ink-gray-5">
						<span class="size-6 text-ink-gray-3 mx-auto block mb-2" aria-hidden="true" />
						{{ __('All recommendations completed!') }}
					</div>
				</div>

				<!-- Recently Completed Lessons widget -->
				<div class="bg-surface-white border border-outline-gray-2 rounded-xl p-5 shadow-sm space-y-3">
					<div class="flex items-center justify-between pb-3 mb-1">
						<h3 class="text-xs font-bold uppercase tracking-wider text-ink-gray-5">
							<span class="size-4 text-ink-green-5" aria-hidden="true" />
							{{ __('Recently Completed') }}
						</h3>
					</div>
					<div v-if="revisionStore.dashboardSummary.recently_completed && revisionStore.dashboardSummary.recently_completed.length" class="divide-y divide-outline-gray-1">
						<div
							v-for="act in revisionStore.dashboardSummary.recently_completed"
							:key="act.lesson"
							class="py-2.5 first:pt-0 last:pb-0 text-xs"
						>
							<p class="font-semibold text-ink-gray-8 truncate">
								{{ act.lesson_title || act.lesson }}
							</p>
							<div class="flex justify-between items-center text-[10px] text-ink-gray-5 mt-1">
								<span class="truncate pr-2">{{ act.course_title }}</span>
								<span class="shrink-0 font-medium">{{ formatDateShort(act.completed_on) }}</span>
							</div>
						</div>
					</div>
					<div v-else class="text-center py-6 text-xs text-ink-gray-5">
						<span class="size-6 text-ink-gray-3 mx-auto block mb-2" aria-hidden="true" />
						{{ __('No lessons completed recently.') }}
					</div>
				</div>

			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, onMounted, ref, inject } from 'vue'
import { Breadcrumbs, Spinner, TabButtons, Badge } from 'frappe-ui'
import { useRevisionStore } from '@/stores/useRevisionStore'
import RevisionCard from '@/components/curiozee_customization/RevisionCard.vue'
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

function onStatusUpdated() {
	revisionStore.fetchRecommendations()
	revisionStore.fetchDashboardSummary()
}

function formatDateShort(dateStr) {
	if (!dateStr || !dayjs) return 'N/A'
	return dayjs(dateStr).format('DD MMM')
}
</script>
