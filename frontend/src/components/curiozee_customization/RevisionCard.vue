<template>
	<!-- RevisionCard: displays a single revision recommendation in card format.
	     Completion is automated by the backend (lesson progress). -->
	<div
		class="flex flex-col border rounded-lg p-5 bg-surface-white hover:border-outline-gray-3 transition-all duration-150"
	>
		<!-- Card Header: Title details on left, badges on right -->
		<div class="flex items-start justify-between gap-4 pb-4 border-b border-outline-gray-1">
			<div class="min-w-0 flex-1">
				<div class="h-10 flex items-start">
					<h4 class="font-semibold text-sm text-ink-gray-9 leading-snug line-clamp-2">
						{{ recommendation.lesson_title || recommendation.lesson }}
					</h4>
				</div>
				<p v-if="recommendation.course_title" class="text-xs text-ink-gray-5 mt-1 font-medium">
					{{ __('Course') }}: {{ recommendation.course_title }}
				</p>
				<p class="text-xs text-ink-gray-4 mt-1 font-medium">
					{{ __('Recommended') }}: {{ formatDate(recommendation.recommended_on) }}
				</p>
			</div>

			<div class="flex items-center gap-2 shrink-0">
				<!-- Priority badge (only if High) -->
				<Badge
					v-if="recommendation.priority === 'High'"
					label="Needs Attention"
					theme="red"
					size="sm"
				/>
				<!-- Status badge (only for completed/dismissed to reduce clutter) -->
				<Badge
					v-if="recommendation.status !== 'Pending' && recommendation.status !== 'Viewed'"
					:label="recommendation.status"
					:theme="statusTheme"
					size="sm"
				/>
			</div>
		</div>

		<!-- Card Body: Recommendation reason in a styled box -->
		<div class="py-4">
			<span class="font-semibold text-xs text-ink-gray-5 block mb-1.5">{{ __('Reason') }}</span>
			<p
				class="text-xs text-ink-gray-6 leading-relaxed rounded-md font-normal"
			>
				{{ recommendation.recommendation_reason }}
			</p>
		</div>

		<!-- Card Footer: Revision CTA -->
		<div class="flex gap-3 pt-4 border-outline-gray-1 mt-auto">
			<Button
				:loading="navigating"
				@click="handleRevise"
				variant="solid"
				theme="gray"
				size="sm"
			>
				{{ __('Revise Lesson') }}
			</Button>
		</div>
	</div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { Button, Badge } from 'frappe-ui'
import { useRouter } from 'vue-router'
import { useRevisionStore } from '@/stores/useRevisionStore'

const props = defineProps({
	recommendation: {
		type: Object,
		required: true,
	},
})

const emit = defineEmits(['status-updated'])

const dayjs = inject('$dayjs')
const navigating = ref(false)
const router = useRouter()
const revisionStore = useRevisionStore()

const statusTheme = computed(() => {
	switch (props.recommendation.status) {
		case 'Completed':
			return 'green'
		case 'Dismissed':
			return 'red'
		case 'Archived':
			return 'gray'
		default:
			return 'gray'
	}
})

function formatDate(dateStr) {
	if (!dateStr || !dayjs) return 'N/A'
	return dayjs(dateStr).format('DD MMM YYYY')
}

async function handleRevise() {
	if (props.recommendation.status === 'Pending') {
		try {
			await revisionStore.updateRecommendationStatus(props.recommendation.name, 'Viewed')
		} catch (e) {
			console.error('Failed to mark as viewed:', e)
		}
	}
	await goToLesson()
}

async function goToLesson() {
	navigating.value = true
	try {
		const courseName = props.recommendation.course_name
		const lessonIndex = props.recommendation.lesson_index
		if (courseName && lessonIndex) {
			const parts = lessonIndex.split('-')
			router.push({
				name: 'Lesson',
				params: {
					courseName,
					chapterNumber: parts[0],
					lessonNumber: parts[1],
				},
			})
		}
	} catch (e) {
		console.error('Navigation failed:', e)
	} finally {
		navigating.value = false
	}
}
</script>
