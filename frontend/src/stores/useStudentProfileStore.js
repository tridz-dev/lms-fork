import { defineStore } from 'pinia'
import { createResource, call } from 'frappe-ui'
import { ref } from 'vue'

export const useStudentProfileStore = defineStore('student-profile-store', () => {
	const profile = createResource({
		url: 'smart_learning.api.student_api.get_student_profile',
		auto: false,
	})

	const exists = ref(null)

	async function checkExists() {
		if (exists.value !== null) return exists.value
		try {
			const res = await call('smart_learning.api.student_api.student_profile_exists')
			exists.value = !!res
			return exists.value
		} catch (e) {
			exists.value = false
			return false
		}
	}

	function setExists(val) {
		exists.value = val
	}

	return {
		profile,
		exists,
		checkExists,
		setExists,
	}
})
