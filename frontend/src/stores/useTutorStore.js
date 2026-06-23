import { defineStore } from 'pinia'
import { ref, reactive, watch } from 'vue'
import { createResource } from 'frappe-ui'

export const useTutorStore = defineStore('tutor-store', () => {
	const filters = reactive({
		subject: '',
		board: '',
		class_name: '',
		start_date: '',
		end_date: '',
		tutor: '',
	})

	const selectedTutor = ref(null)
	const slotsOffset = ref(0)
	const accumulatedSlots = ref([])
	const hasMoreSlotsBackend = ref(true)

	// Fetch tutors
	const tutorsList = createResource({
		url: 'smart_learning.api.tutor_api.search_tutors',
		params: {
			page_length: 100,
		},
		auto: true,
		transform(res) {
			return res?.success ? res.data : []
		},
	})

	// Fetch available slots
	const slotsList = createResource({
		url: 'smart_learning.api.tutor_api.search_slots',
		makeParams() {
			return {
				subject: filters.subject || undefined,
				board: filters.board || undefined,
				class_name: filters.class_name || undefined,
				start_date: filters.start_date || undefined,
				end_date: filters.end_date || undefined,
				tutor: filters.tutor || undefined,
				limit: 10,
				start: slotsOffset.value,
			}
		},
		onSuccess(res) {
			const newSlots = res?.success ? res.data : []
			if (slotsOffset.value === 0) {
				accumulatedSlots.value = newSlots
			} else {
				accumulatedSlots.value = [...accumulatedSlots.value, ...newSlots]
			}
			hasMoreSlotsBackend.value = newSlots.length === 10
		}
	})

	function loadMoreSlotsBackend() {
		if (slotsList.loading || !hasMoreSlotsBackend.value) return
		slotsOffset.value += 10
		slotsList.submit()
	}

	watch(
		filters,
		() => {
			if (filters.tutor || filters.subject || filters.board || filters.class_name) {
				slotsOffset.value = 0
				accumulatedSlots.value = []
				hasMoreSlotsBackend.value = true
				slotsList.submit()
			}
		},
		{ deep: true }
	)

	return {
		filters,
		selectedTutor,
		tutorsList,
		slotsList,
		accumulatedSlots,
		hasMoreSlotsBackend,
		loadMoreSlotsBackend,
	}
})
