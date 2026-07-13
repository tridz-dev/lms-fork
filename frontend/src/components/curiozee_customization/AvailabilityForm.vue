<template>
	<form @submit.prevent="submitForm" novalidate class="space-y-6">
		<div class="grid grid-cols-1 gap-4">
			<div>
				<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider mb-2.5">{{
					__('Weekdays') }}</label>
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-gray-1 border border-outline-gray-2 rounded-md p-4 transition-colors"
					:class="{ 'has-error-weekdays': errors.weekdays }">
					<div v-for="day in weekdays" :key="day" class="flex items-center">
						<Checkbox :value="day" :modelValue="form.weekdays.includes(day)"
							@update:modelValue="val => { if (val) { form.weekdays.push(day) } else { form.weekdays = form.weekdays.filter(d => d !== day) } }"
							:label="day" />
					</div>
				</div>
				<p v-if="errors.weekdays" class="text-xs text-red-500 mt-1.5">{{ __('Please select at least one weekday.') }}</p>
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<FormControl v-model="form.start_time" type="time" :label="__('Start Time')" :required="true" step="900"
				:class="{ 'has-error': errors.start_time }" />
			<FormControl v-model="form.end_time" type="time" :label="__('End Time')" :required="true" step="900"
				:class="{ 'has-error': errors.end_time }" />
		</div>
		<p v-if="timeError" class="text-xs text-red-500 mt-1.5">{{ timeError }}</p>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<FormControl v-model="form.effective_from" type="date" :label="__('Effective From')" :required="true"
				:class="{ 'has-error': errors.effective_from }" />
			<FormControl v-model="form.effective_to" type="date" :label="__('Effective To')" />
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider mb-1.5">{{
					__('Timezone') }}</label>
				<div class="text-sm text-ink-gray-6 bg-surface-gray-1 border border-outline-gray-2 rounded-lg p-2.5">
					{{ profileTimezone || 'Asia/Kolkata' }}
				</div>
			</div>

			<div class="flex items-end pb-3">
				<Checkbox v-model="form.active" :label="__('Active')" />
			</div>
		</div>

		<div class="flex justify-end gap-3 pt-6 border-t border-outline-gray-2">
			<Button @click="$emit('cancel')" variant="outline" type="button" class="h-9 px-5 rounded-lg font-semibold">
				{{ __('Cancel') }}
			</Button>
			<Button :loading="loading" variant="solid" type="submit" class="h-9 px-5 rounded-lg font-semibold">
				{{ __('Save Rule') }}
			</Button>
		</div>
	</form>
</template>

<script setup>
import { reactive, watch, ref } from 'vue'
import { Button, Checkbox, FormControl } from 'frappe-ui'

const props = defineProps({
	rule: {
		type: Object,
		default: null,
	},
	profileTimezone: {
		type: String,
		default: 'Asia/Kolkata',
	},
	loading: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(['save', 'cancel'])

const weekdays = [
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
	'Sunday',
]

const form = reactive({
	weekdays: [],
	slot_duration: 60,
	start_time: '',
	end_time: '',
	effective_from: '',
	effective_to: '',
	active: true,
})

const errors = reactive({
	weekdays: false,
	start_time: false,
	end_time: false,
	effective_from: false,
})
const timeError = ref('')

watch(
	() => props.rule,
	(newRule) => {
		errors.weekdays = false
		errors.start_time = false
		errors.end_time = false
		errors.effective_from = false
		timeError.value = ''
		if (newRule) {
			Object.assign(form, {
				weekdays: Array.isArray(newRule.weekdays) ? [...newRule.weekdays] : [],
				slot_duration: newRule.slot_duration || 60,
				start_time: newRule.start_time || '',
				end_time: newRule.end_time || '',
				effective_from: newRule.effective_from || '',
				effective_to: newRule.effective_to || '',
				active: newRule.active === undefined ? true : !!newRule.active,
			})
		} else {
			Object.assign(form, {
				weekdays: [],
				slot_duration: 60,
				start_time: '',
				end_time: '',
				effective_from: new Date().toISOString().split('T')[0],
				effective_to: '',
				active: true,
			})
		}
	},
	{ immediate: true }
)

function isValid15MinInterval(timeStr) {
	if (!timeStr) return false
	const parts = timeStr.split(':')
	const minutes = parseInt(parts[1], 10)
	return !isNaN(minutes) && minutes % 15 === 0
}

function submitForm() {
	errors.weekdays = false
	errors.start_time = false
	errors.end_time = false
	errors.effective_from = false
	timeError.value = ''

	let hasError = false

	if (!form.weekdays || form.weekdays.length === 0) {
		errors.weekdays = true
		hasError = true
	}

	if (!form.start_time) {
		errors.start_time = true
		hasError = true
	}

	if (!form.end_time) {
		errors.end_time = true
		hasError = true
	}

	if (!form.effective_from) {
		errors.effective_from = true
		hasError = true
	}

	if (hasError) {
		return
	}

	if (!isValid15MinInterval(form.start_time) || !isValid15MinInterval(form.end_time)) {
		timeError.value = __('Start Time and End Time must be in 15-minute intervals (e.g. 00:00, 00:15, 00:30, 00:45).')
		errors.start_time = !isValid15MinInterval(form.start_time)
		errors.end_time = !isValid15MinInterval(form.end_time)
		return
	}

	emit('save', { ...form })
}
</script>

<style scoped>
.has-error :deep(input) {
	border-color: var(--outline-red-2);
	background-color: var(--surface-red-1);
}

.has-error-weekdays {
	border-color: var(--outline-red-2);
	background-color: var(--surface-red-1);
}
</style>
