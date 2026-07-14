<template>
	<div
		class="flex flex-col h-full rounded-xl p-5 bg-surface-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
		@click="navigateToBooking"
	>
		<div class="flex flex-col flex-auto">
			<!-- Header: name + score badge (if matched) or timezone -->
			<div class="flex items-start justify-between gap-4 mb-4">
				<div class="min-w-0">
					<h3 class="text-base font-semibold text-ink-gray-9 leading-tight">
						{{ tutor.tutor_name }}
					</h3>
					<p class="text-xs text-ink-gray-5 mt-1.5">
						{{ tutor.years_of_experience || 0 }}
						{{ __('yrs exp') }}
					</p>
				</div>
				<!-- Match score badge shown only when score is provided -->
				<div v-if="tutor.score != null" class="shrink-0 text-right">
					<span class="text-[10px] uppercase tracking-wider text-ink-gray-4 block mb-0.5">
						{{ __('Match Score') }}
					</span>
					<Badge
						:label="tutor.score.toString()"
						:theme="scoreTheme"
						size="sm"
					/>
				</div>
				<!-- Default timezone display when no score -->
				<div v-else class="text-right shrink-0">
					<span class="text-[10px] uppercase tracking-wider text-ink-gray-4 block">
						{{ __('Timezone') }}
					</span>
					<span class="text-xs font-medium text-ink-gray-7">
						{{ tutor.timezone || 'UTC' }}
					</span>
				</div>
			</div>

			<!-- Match reasons (only when matched) -->
			<div
				v-if="filteredMatchReasons.length"
				class="mb-3 space-y-0.5"
			>
				<div
					v-for="(reason, idx) in filteredMatchReasons"
					:key="idx"
					class="flex items-center gap-1.5 text-xs text-ink-gray-6"
				>
					<span class="text-ink-green-3 shrink-0">✓</span>
					{{ reason }}
				</div>
			</div>

			<!-- Bio (shown only when no match reasons or in default mode) -->
			<p
				v-else
				class="text-sm text-ink-gray-6 line-clamp-2 mb-4 leading-relaxed"
			>
				{{ tutor.bio || __('No biography provided.') }}
			</p>

			<!-- Tags: subjects + boards + classes -->
			<div class="mt-auto space-y-1.5 pt-2 text-xs">
				<div v-if="tutor.subjects?.length" class="flex items-center gap-1">
					<span class="text-[10px] uppercase tracking-wider text-ink-gray-4 mr-1">
						{{ __('Subjects') }}:
					</span>
					<span class="font-medium text-ink-gray-7">
						{{ tutor.subjects.map(s => typeof s === 'string' ? s : s.subject).join(', ') }}
					</span>
				</div>
				<div v-if="tutor.classes?.length" class="flex items-center gap-1">
					<span class="text-[10px] uppercase tracking-wider text-ink-gray-4 mr-1">
						{{ __('Classes') }}:
					</span>
					<span class="font-medium text-ink-gray-7">
						{{ tutor.classes.map(c => typeof c === 'string' ? c : c.class).join(', ') }}
					</span>
				</div>
			</div>

			<!-- Footer: price + book button -->
			<div class="flex items-center justify-between mt-4 pt-2">
				<div class="text-sm font-semibold text-ink-gray-9">
					{{ TEST_BOOKING_AMOUNT }} {{ currency }}
					<span class="text-xs font-normal text-ink-gray-5">/ hr</span>
				</div>
				<Button variant="subtle" theme="gray" size="sm" @click.stop="navigateToBooking">
					{{ __('Book') }}
				</Button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Badge, Button } from 'frappe-ui'
import { systemSettings } from '@/resources/bookTutor'

const router = useRouter()

const TEST_BOOKING_AMOUNT = 500

const props = defineProps({
	tutor: {
		type: Object,
		required: true,
	},
})

const currency = computed(
	() => systemSettings.data?.currency || 'INR'
)

const scoreTheme = computed(() => {
	const s = props.tutor.score ?? 0
	if (s >= 70) return 'green'
	if (s >= 40) return 'orange'
	return 'gray'
})

const filteredMatchReasons = computed(() => {
	if (!props.tutor.match_reasons) return []
	return props.tutor.match_reasons.filter(r => !r.includes('slot(s) available'))
})

function navigateToBooking() {
	router.push({ name: 'BookSession', query: { tutor: props.tutor.name } })
}
</script>
