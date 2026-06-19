<template>
	<div class="flex flex-col border rounded-md p-4 bg-surface-white hover:border-outline-gray-3 transition-colors shadow-sm">
		<div class="flex items-start justify-between pb-3 border-b">
			<div>
				<h4 class="font-bold text-base text-ink-gray-9">
					{{ recommendation.lesson_title || recommendation.lesson }}
				</h4>
				<p v-if="recommendation.course_title" class="text-xs text-ink-gray-6 font-medium mt-0.5">
					Course: {{ recommendation.course_title }}
				</p>
				<p class="text-[10px] text-ink-gray-4 mt-1 uppercase tracking-wider font-semibold">
					{{ __('Recommended') }}: {{ formatDate(recommendation.recommended_on) }}
				</p>
			</div>
			<div class="flex gap-2">
				<span
					class="border px-2.5 py-0.5 text-xs rounded-full font-medium"
					:class="priorityClasses"
				>
					{{ recommendation.priority }}
				</span>
				<span
					class="border px-2.5 py-0.5 text-xs rounded-full font-medium"
					:class="statusClasses"
				>
					{{ recommendation.status }}
				</span>
			</div>
		</div>

		<div class="text-sm text-ink-gray-8 space-y-4 py-4">
			<div>
				<span class="font-bold text-[10px] uppercase tracking-wider text-ink-gray-4 block mb-1.5">{{ __('Reason') }}</span>
				<p class="leading-relaxed bg-surface-gray-2 p-3 border rounded-md text-ink-gray-7 text-xs font-normal">
					{{ recommendation.recommendation_reason }}
				</p>
			</div>
		</div>

		<div class="flex gap-2 pt-4 border-t">
			<Button
				:loading="resolving"
				@click="handleRevise"
				variant="solid"
				class="flex-1 justify-center py-2 text-xs font-semibold"
			>
				{{ __('Revise Lesson') }}
			</Button>
			<Button
				v-if="canAction"
				:loading="completing"
				@click="markCompleted"
				variant="outline"
				class="justify-center py-2 text-xs font-semibold text-green-700 border-green-200 hover:bg-green-50"
			>
				{{ __('Complete') }}
			</Button>
			<Button
				v-if="canAction"
				:loading="dismissing"
				@click="dismiss"
				variant="outline"
				class="justify-center py-2 text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50"
			>
				{{ __('Dismiss') }}
			</Button>
		</div>
	</div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { Button } from 'frappe-ui'
import { call } from 'frappe-ui'
import { useRouter } from 'vue-router'
import { useRevisionStore } from '@/stores/useRevisionStore'

const props = defineProps({
	recommendation: {
		type: Object,
		required: true,
	},
})

const dayjs = inject('$dayjs')
const resolving = ref(false)
const completing = ref(false)
const dismissing = ref(false)
const router = useRouter()
const revisionStore = useRevisionStore()

const canAction = computed(() => {
	return ['Pending', 'Viewed'].includes(props.recommendation.status)
})

const priorityClasses = computed(() => {
	switch (props.recommendation.priority) {
		case 'High':
			return 'border-red-200 bg-red-50 text-red-700 font-semibold'
		case 'Medium':
			return 'border-amber-200 bg-amber-50 text-amber-700 font-semibold'
		case 'Low':
		default:
			return 'border-gray-200 bg-gray-50 text-gray-600'
	}
})

const statusClasses = computed(() => {
	switch (props.recommendation.status) {
		case 'Completed':
			return 'border-green-200 bg-green-50 text-green-700 font-semibold'
		case 'Viewed':
			return 'border-blue-200 bg-blue-50 text-blue-700 font-semibold'
		case 'Dismissed':
			return 'border-red-200 bg-red-50 text-red-700 font-semibold'
		case 'Archived':
			return 'border-gray-300 bg-gray-100 text-gray-500 font-medium'
		case 'Pending':
		default:
			return 'border-amber-200 bg-amber-50 text-amber-700 font-medium'
	}
})

function formatDate(dateStr) {
	if (!dateStr || !dayjs) return 'N/A'
	return dayjs(dateStr).format('DD MMM YYYY')
}

async function markCompleted() {
	completing.value = true
	try {
		await revisionStore.updateRecommendationStatus(props.recommendation.name, 'Completed')
	} catch (e) {
		console.error(e)
	} finally {
		completing.value = false
	}
}

async function dismiss() {
	dismissing.value = true
	try {
		await revisionStore.updateRecommendationStatus(props.recommendation.name, 'Dismissed')
	} catch (e) {
		console.error(e)
	} finally {
		dismissing.value = false
	}
}

async function handleRevise() {
	if (props.recommendation.status === 'Pending') {
		try {
			await revisionStore.updateRecommendationStatus(props.recommendation.name, 'Viewed')
		} catch (e) {
			console.error("Failed to mark as viewed:", e)
		}
	}
	await goToLesson()
}

async function goToLesson() {
	resolving.value = true
	try {
		const courseName = props.recommendation.course_name
		const lessonIndex = props.recommendation.lesson_index
		if (courseName && lessonIndex) {
			const parts = lessonIndex.split('-')
			router.push({
				name: 'Lesson',
				params: {
					courseName: courseName,
					chapterNumber: parts[0],
					lessonNumber: parts[1],
				}
			})
		}
	} catch (e) {
		console.error("Failed to navigate to lesson:", e)
	} finally {
		resolving.value = false
	}
}
</script>
