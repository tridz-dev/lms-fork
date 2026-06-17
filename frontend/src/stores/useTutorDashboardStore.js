import { defineStore } from 'pinia'
import { createResource } from 'frappe-ui'

export const useTutorDashboardStore = defineStore('tutor-dashboard-store', () => {
	const dashboardData = createResource({
		url: 'smart_learning.api.tutor_api.get_tutor_dashboard_data',
		auto: false,
	})

	const sessionCompleter = createResource({
		url: 'smart_learning.api.booking_api.complete_session',
		auto: false,
	})

	const sessionCanceller = createResource({
		url: 'smart_learning.api.booking_api.cancel_session',
		auto: false,
	})

	return {
		dashboardData,
		sessionCompleter,
		sessionCanceller,
	}
})

