import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createResource } from 'frappe-ui'

export const useRevisionStore = defineStore('revision-store', () => {
	const recommendations = ref([])
	const dashboardSummary = ref({
		pending_count: 0,
		recommendations: [],
		recommended_topics: [],
		recently_completed: [],
		weak_subjects: [],
		recommended_tutors: [],
	})

	const revisionFetcher = createResource({
		url: 'smart_learning.api.student_api.get_revision_recommendations',
		onSuccess(data) {
			recommendations.value = data
		}
	})

	const dashboardSummaryFetcher = createResource({
		url: 'smart_learning.api.student_api.get_student_dashboard_summary',
		onSuccess(data) {
			dashboardSummary.value = data
		}
	})

	const statusUpdater = createResource({
		url: 'smart_learning.api.student_api.update_recommendation_status'
	})

	function fetchRecommendations() {
		return revisionFetcher.submit()
	}

	function fetchDashboardSummary() {
		return dashboardSummaryFetcher.submit()
	}

	async function updateRecommendationStatus(name, status) {
		await statusUpdater.submit({ name, status })
		// Refresh data to keep store in sync
		await fetchRecommendations()
		await fetchDashboardSummary()
	}

	return {
		recommendations,
		dashboardSummary,
		revisionFetcher,
		dashboardSummaryFetcher,
		statusUpdater,
		fetchRecommendations,
		fetchDashboardSummary,
		updateRecommendationStatus,
	}
})
