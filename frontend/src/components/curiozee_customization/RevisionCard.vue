<template>
	<div class="flex flex-col border rounded-md p-5 bg-surface-white hover:border-outline-gray-3 transition-colors">
		<div class="flex items-start justify-between pb-3 border-b">
			<div>
				<h4 class="font-semibold text-base text-ink-gray-9">
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
				<Badge
					:label="recommendation.priority"
					:theme="priorityTheme"
					size="sm"
				/>
				<Badge
					:label="recommendation.status"
					:theme="statusTheme"
					size="sm"
				/>
			</div>
		</div>

		<div class="text-sm text-ink-gray-8 space-y-4 py-4">
			<div>
				<span class="font-semibold text-[10px] uppercase tracking-wider text-ink-gray-4 block mb-1.5">{{ __('Reason') }}</span>
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
				class="flex-1"
			>
				{{ __('Revise Lesson') }}
			</Button>
			<Button
				v-if="canAction"
				:loading="completing"
				@click="markCompleted"
				variant="outline"
			>
				{{ __('Complete') }}
			</Button>
			<Button
				v-if="canAction"
				:loading="dismissing"
				@click="dismiss"
				variant="outline"
			>
				{{ __('Dismiss') }}
			</Button>
		</div>
	</div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { Button, Badge, call } from 'frappe-ui'
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
const resolving = ref(false)
const completing = ref(false)
const dismissing = ref(false)
const router = useRouter()
const revisionStore = useRevisionStore()

const canAction = computed(() => {
	return ['Pending', 'Viewed'].includes(props.recommendation.status)
})

const priorityTheme = computed(() => {
	switch (props.recommendation.priority) {
		case 'High':
			return 'red'
		case 'Medium':
			return 'amber'
		case 'Low':
		default:
			return 'gray'
	}
})

const statusTheme = computed(() => {
	switch (props.recommendation.status) {
		case 'Completed':
			return 'green'
		case 'Viewed':
			return 'blue'
		case 'Dismissed':
			return 'red'
		case 'Archived':
			return 'gray'
		case 'Pending':
		default:
			return 'amber'
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
		emit('status-updated', props.recommendation.name, 'Completed')
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
		emit('status-updated', props.recommendation.name, 'Dismissed')
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
