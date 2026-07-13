<template>
	<div class="space-y-6">
		<h4 class="text-lg font-semibold text-ink-gray-9">
			{{ __('Select a Slot') }}
		</h4>

		<!-- Date Tabs -->
		<div v-if="dates.length" class="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
			<button
				v-for="date in dates"
				:key="date"
				@click="selectedDate = date"
				class="flex flex-col items-center justify-between w-[72px] h-[72px] p-3 border border-outline-gray-2 rounded-lg focus:outline-none cursor-pointer transition-all duration-200 shrink-0 shadow-sm focus-visible:ring-2 focus-visible:ring-outline-gray-3"
				:class="
					selectedDate === date
						? 'bg-gray-900 border-gray-900 text-white font-semibold shadow-sm'
						: 'bg-surface-white border-outline-gray-2 text-ink-gray-7 hover:bg-surface-gray-2 hover:border-outline-gray-3 hover:text-ink-gray-9'
				"
			>
				<span class="text-xs uppercase tracking-wider font-semibold text-ink-gray-5">
					{{ formatDayOfWeek(date) }}
				</span>
				<span class="text-lg font-semibold leading-none">
					{{ formatDayOfMonth(date) }}
				</span>
				<span class="text-[10px] uppercase tracking-wider font-semibold text-ink-gray-5">
					{{ formatMonth(date) }}
				</span>
			</button>
		</div>

		<!-- No slots empty state -->
		<div
			v-else
			class="text-sm text-ink-gray-5 py-10 text-center border border-dashed border-outline-gray-2 rounded-lg bg-surface-gray-1"
		>
			{{ __('No slots available for the selected filters.') }}
		</div>

		<!-- Time grid for selected date -->
		<div v-if="selectedDate && groupedSlots[selectedDate]" class="mt-5 space-y-3">
			<h5 class="text-base font-semibold text-ink-gray-9">
				{{ __('Available Times on') }} {{ formatDateFriendly(selectedDate) }}
				<span class="text-sm font-normal text-ink-gray-5">({{ displayTimezone }})</span>
			</h5>
			<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
				<button
					v-for="slot in groupedSlots[selectedDate]"
					:key="slot.name"
					@click="selectSlot(slot)"
					class="h-[42px] px-4 border border-outline-gray-2 text-base font-medium transition-all duration-200 text-center rounded-md focus:outline-none cursor-pointer flex items-center justify-center shadow-sm focus-visible:ring-2 focus-visible:ring-outline-gray-3 disabled:opacity-50 disabled:cursor-not-allowed"
					:class="
						selectedSlotName === slot.name
							? 'bg-gray-900 border-gray-900 text-white font-semibold'
							: 'bg-surface-white border-outline-gray-2 text-ink-gray-7 hover:bg-surface-gray-2 hover:border-outline-gray-3 hover:text-ink-gray-9'
					"
				>
					{{ formatTime(slot.start_datetime) }}
				</button>
			</div>
		</div>

		<!-- Load More Button -->
		<div v-if="hasMore" class="flex justify-center pt-2">
			<Button
				variant="outline"
				size="sm"
				:loading="loadingMore"
				@click="$emit('loadMore')"
			>
				{{ __('Load More Slots') }}
			</Button>
		</div>
	</div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Button } from 'frappe-ui'
import { convertToLocal, getBrowserTimezone } from '@/utils/timezone'
import dayjs from '@/utils/dayjs'

const props = defineProps({
	slots: {
		type: Array,
		required: true,
	},
	selectedSlotName: {
		type: String,
		default: '',
	},
	/**
	 * System timezone string (e.g. "Asia/Kolkata").
	 * Slot datetimes from backend are stored in UTC — we convert to this timezone for display.
	 */
	systemTimezone: {
		type: String,
		default: '',
	},
	loadingMore: {
		type: Boolean,
		default: false,
	},
	hasMore: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(['select-slot', 'loadMore'])

function selectSlot(slot) {
	emit('select-slot', slot)
}

const selectedDate = ref('')

const displayTimezone = computed(() => getBrowserTimezone())

// Group slots by date in the local browser timezone
const groupedSlots = computed(() => {
	if (!props.slots) return {}
	const groups = {}
	props.slots.forEach((slot) => {
		const d = convertToLocal(slot.start_datetime)
		if (!d) return
		const localDate = d.format('YYYY-MM-DD')
		if (!groups[localDate]) groups[localDate] = []
		groups[localDate].push(slot)
	})
	return groups
})

const dates = computed(() => Object.keys(groupedSlots.value).sort())

watch(
	dates,
	(newDates) => {
		if (newDates.length && !newDates.includes(selectedDate.value)) {
			selectedDate.value = newDates[0]
		} else if (!newDates.length) {
			selectedDate.value = ''
		}
	},
	{ immediate: true }
)

function formatDayOfWeek(dateStr) {
	return dayjs(dateStr).format('ddd')
}
function formatDayOfMonth(dateStr) {
	return dayjs(dateStr).format('D')
}
function formatMonth(dateStr) {
	return dayjs(dateStr).format('MMM')
}
function formatDateFriendly(dateStr) {
	return dayjs(dateStr).format('dddd, MMMM D, YYYY')
}
function formatTime(startDatetime) {
	const localObj = convertToLocal(startDatetime)
	return localObj ? localObj.format('hh:mm A') : ''
}
</script>
