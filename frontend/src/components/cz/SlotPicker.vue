<template>
	<div class="space-y-5">
		<h4 class="text-sm font-semibold text-ink-gray-7">
			{{ __('Select a Slot') }}
		</h4>

		<!-- Date Tabs -->
		<div v-if="dates.length" class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
			<button
				v-for="date in dates"
				:key="date"
				@click="selectedDate = date"
				class="flex flex-col items-center px-4 py-2 border rounded-lg focus:outline-none min-w-[72px] transition-all duration-150 shrink-0"
				:class="
					selectedDate === date
						? 'bg-gray-900 border-gray-900 text-white shadow-sm'
						: 'bg-surface-white border-outline-gray-2 text-ink-gray-7 hover:bg-surface-gray-2'
				"
			>
				<span class="text-[10px] uppercase tracking-wider font-semibold opacity-70">
					{{ formatDayOfWeek(date) }}
				</span>
				<span class="text-lg font-bold mt-0.5 leading-tight">
					{{ formatDayOfMonth(date) }}
				</span>
				<span class="text-[9px] uppercase tracking-wider font-semibold opacity-70 mt-0.5">
					{{ formatMonth(date) }}
				</span>
			</button>
		</div>

		<!-- No slots empty state -->
		<div
			v-else
			class="text-sm text-ink-gray-5 py-10 text-center border border-dashed border-outline-gray-2 rounded-xl bg-surface-gray-1"
		>
			{{ __('No slots available for the selected filters.') }}
		</div>

		<!-- Time grid for selected date -->
		<div v-if="selectedDate && groupedSlots[selectedDate]" class="space-y-3">
			<h5 class="text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">
				{{ __('Available Times on') }} {{ formatDateFriendly(selectedDate) }}
				<span class="normal-case font-normal text-ink-gray-4">({{ displayTimezone }})</span>
			</h5>
			<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
				<button
					v-for="slot in groupedSlots[selectedDate]"
					:key="slot.name"
					@click="$emit('selectSlot', slot)"
					class="py-2.5 px-3 border text-xs font-medium transition-all text-center rounded-lg focus:outline-none"
					:class="
						selectedSlotName === slot.name
							? 'bg-gray-900 border-gray-900 text-white shadow-sm'
							: 'bg-surface-white border-outline-gray-2 text-ink-gray-7 hover:bg-surface-gray-2'
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
				class="text-xs"
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

defineEmits(['selectSlot', 'loadMore'])

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
