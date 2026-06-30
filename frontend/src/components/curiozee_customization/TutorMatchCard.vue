<template>
	<div
		class="flex flex-col border rounded-xl p-4 bg-surface-white hover:border-outline-gray-3 transition-all duration-200 shadow-sm hover:shadow-md"
	>
		<!-- Top Row: Name and Score Badge -->
		<div class="flex items-start justify-between gap-3 pb-3 border-b border-outline-gray-2">
			<div class="min-w-0">
				<h4 class="text-sm font-semibold text-ink-gray-9 truncate">
					{{ tutor.tutor_name }}
				</h4>
				<p class="text-xs text-ink-gray-5 mt-1 font-medium">
					{{ tutor.years_of_experience || 0 }} {{ __('yrs exp') }}
				</p>
			</div>
			<!-- Match score badge -->
			<div v-if="tutor.score != null" class="shrink-0 text-right">
				<span class="text-[9px] uppercase tracking-wider text-ink-gray-4 block mb-0.5">
					{{ __('Match') }}
				</span>
				<Badge
					:label="tutor.score.toString()"
					:theme="scoreTheme"
					size="sm"
				/>
			</div>
		</div>

		<!-- Match reasons or Bio -->
		<div class="py-3 flex-1">
			<div
				v-if="tutor.match_reasons && tutor.match_reasons.length"
				class="space-y-1"
			>
				<div
					v-for="(reason, idx) in tutor.match_reasons"
					:key="idx"
					class="flex items-center gap-1.5 text-xs text-ink-gray-7 font-medium"
				>
					<span class="text-emerald-500 font-semibold shrink-0">✓</span>
					<span class="truncate">{{ reason }}</span>
				</div>
			</div>
			<p
				v-else
				class="text-xs text-ink-gray-6 line-clamp-2 leading-relaxed font-normal"
			>
				{{ tutor.bio || __('No biography provided.') }}
			</p>
		</div>

		<!-- Footer: Price and Book Button -->
		<div class="flex items-center justify-between pt-3 border-t border-outline-gray-2">
			<div class="text-xs font-semibold text-ink-gray-9">
				{{ TEST_BOOKING_AMOUNT }} {{ currency }}
				<span class="text-[10px] font-normal text-ink-gray-5">/ hr</span>
			</div>
			<router-link :to="{ name: 'BookSession', query: { tutor: tutor.name } }">
				<Button variant="solid" size="sm" class="text-xs font-semibold py-1.5 px-3">
					{{ __('Book') }}
				</Button>
			</router-link>
		</div>
	</div>
</template>

<script setup>
import { computed } from 'vue'
import { Button, Badge } from 'frappe-ui'
import { systemSettings } from '@/resources/bookTutor'

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
	if (s >= 40) return 'amber'
	return 'gray'
})
</script>
