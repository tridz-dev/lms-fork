import { createResource } from 'frappe-ui'
import { reactive } from 'vue'

export const filterState = reactive({
	tutor: '',
	subject: '',
	class_name: '',
	board: '',
	page: 1,
	page_length: 20,
})

// System settings: currency + timezone
export const systemSettings = createResource({
	url: 'smart_learning.api.student_api.get_system_settings',
	auto: true,
	transform(data) {
		return {
			currency: data?.currency || 'INR',
			timezone: data?.time_zone || 'UTC',
		}
	},
})

export const subjectsList = createResource({
	url: 'smart_learning.api.tutor_api.get_subjects_list',
	auto: true,
	transform(res) {
		const data = res || []
		return data.map((item) => ({
			label: item.subject || item.name,
			value: item.name,
		}))
	},
})

export const boardsList = createResource({
	url: 'smart_learning.api.tutor_api.get_boards_list',
	auto: true,
	transform(res) {
		const data = res || []
		return data.map((item) => ({
			label: item.board || item.name,
			value: item.name,
		}))
	},
})

export const classesList = createResource({
	url: 'smart_learning.api.tutor_api.get_classes_list',
	auto: true,
	transform(res) {
		const data = res || []
		return data.map((item) => ({
			label: item.class || item.name,
			value: item.name,
		}))
	},
})

export const allTutorsList = createResource({
	url: 'smart_learning.api.tutor_api.search_tutors',
	params: {
		page_length: 1000,
	},
	auto: true,
	transform(res) {
		const data = res?.success ? res.data : []
		return data.map((item) => ({
			label: item.tutor_name || item.name,
			value: item.tutor_name,
		}))
	},
})

export const tutorsList = createResource({
	url: 'smart_learning.api.tutor_api.search_tutors',
	makeParams() {
		return {
			tutor: filterState.tutor || undefined,
			subject: filterState.subject || undefined,
			class_name: filterState.class_name || undefined,
			board: filterState.board || undefined,
			start: (filterState.page - 1) * filterState.page_length,
			page_length: filterState.page_length,
		}
	},
	transform(res) {
		return res?.success ? res.data : []
	},
})
