import { createRouter, createWebHistory } from 'vue-router'
import { usersStore } from './stores/user'
import { sessionStore } from './stores/session'
import { useSettings } from './stores/settings'
import { getLmsBasePath } from './utils/basePath'

const routes = [
	{
		path: '/',
		name: 'Home',
		component: () => import('@/pages/Home/Home.vue'),
	},
	{
		path: '/courses',
		name: 'Courses',
		component: () => import('@/pages/Courses/Courses.vue'),
	},
	{
		path: '/courses/:courseName',
		name: 'CourseDetail',
		component: () => import('@/pages/Courses/CourseDetail.vue'),
		props: true,
	},
	{
		path: '/courses/:courseName/learn/:chapterNumber-:lessonNumber',
		name: 'Lesson',
		component: () => import('@/pages/Lesson.vue'),
		props: true,
	},
	{
		path: '/courses/:courseName/certification',
		name: 'CourseCertification',
		component: () => import('@/pages/Courses/CourseCertification.vue'),
		props: true,
	},
	{
		path: '/courses/:courseName/learn/:chapterName',
		name: 'SCORMChapter',
		component: () => import('@/pages/SCORMChapter.vue'),
		props: true,
	},
	{
		path: '/batches',
		name: 'Batches',
		component: () => import('@/pages/Batches/Batches.vue'),
	},
	{
		path: '/batches/details/:batchName',
		redirect: (to) => `/batches/${to.params.batchName}`,
	},
	{
		path: '/batches/:batchName',
		name: 'BatchDetail',
		component: () => import('@/pages/Batches/BatchDetail.vue'),
		props: true,
	},
	{
		path: '/billing/:type/:name',
		name: 'Billing',
		component: () => import('@/pages/Billing.vue'),
		props: true,
	},
	{
		path: '/statistics',
		name: 'Statistics',
		component: () => import('@/pages/Statistics.vue'),
	},
	{
		path: '/user/:username',
		name: 'Profile',
		component: () => import('@/pages/Profile.vue'),
		props: true,
		redirect: { name: 'ProfileAbout' },
		children: [
			{
				name: 'ProfileAbout',
				path: '',
				component: () => import('@/pages/ProfileAbout.vue'),
			},
			{
				name: 'ProfileCertificates',
				path: 'certificates',
				component: () => import('@/pages/ProfileCertificates.vue'),
			},
			{
				name: 'ProfileRoles',
				path: 'roles',
				component: () => import('@/pages/ProfileRoles.vue'),
			},
			{
				name: 'ProfileEvaluator',
				path: 'slots',
				component: () => import('@/pages/ProfileEvaluator.vue'),
			},
			{
				name: 'ProfileEvaluationSchedule',
				path: 'schedule',
				component: () =>
					import('@/pages/ProfileEvaluationSchedule.vue'),
			},
		],
	},
	{
		path: '/job-openings',
		name: 'Jobs',
		component: () => import('@/pages/Jobs.vue'),
	},
	{
		path: '/job-openings/:job',
		name: 'JobDetail',
		component: () => import('@/pages/JobDetail.vue'),
		props: true,
	},
	{
		path: '/job-openings/:job/applications',
		name: 'JobApplications',
		component: () => import('@/pages/JobApplications.vue'),
		props: true,
	},
	{
		path: '/courses/:courseName/learn/:chapterNumber-:lessonNumber/edit',
		name: 'LessonForm',
		component: () => import('@/pages/LessonForm.vue'),
		props: true,
	},
	{
		path: '/job-opening/:jobName/edit',
		name: 'JobForm',
		component: () => import('@/pages/JobForm.vue'),
		props: true,
	},
	{
		path: '/certified-participants',
		name: 'CertifiedParticipants',
		component: () => import('@/pages/CertifiedParticipants.vue'),
	},
	{
		path: '/notifications',
		name: 'Notifications',
		component: () => import('@/pages/Notifications.vue'),
	},
	{
		path: '/quizzes',
		name: 'Quizzes',
		component: () => import('@/pages/Quizzes.vue'),
	},
	{
		path: '/quizzes/:quizID',
		name: 'QuizForm',
		component: () => import('@/pages/QuizForm.vue'),
		props: true,
	},
	{
		path: '/quiz/:quizID',
		name: 'QuizPage',
		component: () => import('@/pages/QuizPage.vue'),
		props: true,
	},
	{
		path: '/quiz-submissions/:quizID',
		name: 'QuizSubmissionList',
		component: () => import('@/pages/QuizSubmissionList.vue'),
		props: true,
	},
	{
		path: '/quiz-submission/:submission',
		name: 'QuizSubmission',
		component: () => import('@/pages/QuizSubmission.vue'),
		props: true,
	},
	{
		path: '/programs',
		name: 'Programs',
		component: () => import('@/pages/Programs/Programs.vue'),
	},
	{
		path: '/programs/:programName',
		name: 'ProgramDetail',
		component: () => import('@/pages/Programs/ProgramDetail.vue'),
		props: true,
	},
	{
		path: '/assignments',
		name: 'Assignments',
		component: () => import('@/pages/Assignments.vue'),
	},
	{
		path: '/assignment-submission/:assignmentID/:submissionName',
		name: 'AssignmentSubmission',
		component: () => import('@/pages/AssignmentSubmission.vue'),
		props: true,
	},
	{
		path: '/assignment-submissions',
		name: 'AssignmentSubmissionList',
		component: () => import('@/pages/AssignmentSubmissionList.vue'),
	},
	{
		path: '/persona',
		name: 'PersonaForm',
		component: () => import('@/pages/PersonaForm.vue'),
	},
	{
		path: '/programming-exercises',
		name: 'ProgrammingExercises',
		component: () =>
			import('@/pages/ProgrammingExercises/ProgrammingExercises.vue'),
	},
	{
		path: '/programming-exercises/submissions',
		name: 'ProgrammingExerciseSubmissions',
		component: () =>
			import(
				'@/pages/ProgrammingExercises/ProgrammingExerciseSubmissions.vue'
			),
		props: true,
	},
	{
		path: '/programming-exercises/:exerciseID/submission/:submissionID',
		name: 'ProgrammingExerciseSubmission',
		component: () =>
			import(
				'@/pages/ProgrammingExercises/ProgrammingExerciseSubmission.vue'
			),
		props: true,
	},
	{
		path: '/search',
		name: 'Search',
		component: () => import('@/pages/Search/Search.vue'),
	},
	{
		path: '/data-import',
		name: 'DataImportList',
		component: () => import('@/pages/DataImport.vue'),
	},
	{
		path: '/data-import/doctype/:doctype',
		name: 'NewDataImport',
		component: () => import('@/pages/DataImport.vue'),
		props: true,
	},
	{
		path: '/data-import/:importName',
		name: 'DataImport',
		component: () => import('@/pages/DataImport.vue'),
		props: true,
	},
	{
		path: '/sessions',
		name: 'Sessions',
		component: () => import('@/pages/cz/Sessions.vue')
	},
	{
		path: '/sessions/book',
		name: 'BookSession',
		component: () => import('@/pages/cz/BookSession.vue')
	},
	{
		path: '/sessions/history',
		name: 'SessionHistory',
		redirect: { name: 'Sessions' }
	},
	{
		path: '/tutors',
		name: 'TutorSearch',
		component: () => import('@/pages/cz/TutorSearch.vue')
	},
	{
		path: '/revision',
		name: 'Revision',
		component: () => import('@/pages/cz/Revision.vue')
	},
	{
		path: '/forbidden',
		name: 'Forbidden',
		component: () => import('@/pages/cz/Forbidden.vue')
	},
	{
		path: '/tutor/dashboard',
		name: 'TutorDashboard',
		component: () => import('@/pages/cz/TutorDashboard.vue'),
		beforeEnter: requireTutorRole
	},
	{
		path: '/tutor/availability',
		name: 'AvailabilityRules',
		redirect: { name: 'TutorProfile', query: { tab: 'availability' } },
		beforeEnter: requireTutorRole
	},
	{
		path: '/tutor/slots',
		name: 'SlotCalendar',
		component: () => import('@/pages/cz/SlotCalendar.vue'),
		beforeEnter: requireTutorRole
	},
	{
		path: '/tutor/sessions',
		name: 'TutorSessions',
		component: () => import('@/pages/cz/TutorSessions.vue'),
		beforeEnter: requireTutorRole
	},
	{
		path: '/tutor/profile',
		name: 'TutorProfile',
		component: () => import('@/pages/cz/TutorProfile.vue'),
		beforeEnter: requireTutorRole
	},
]

export async function requireTutorRole(to, from, next) {
	const { userResource } = usersStore()
	const { isLoggedIn } = sessionStore()

	// 1. Check authenticated user.
	if (!isLoggedIn) {
		const currentUrl = window.location.pathname + window.location.search
		window.location.href = `/login?redirect-to=${encodeURIComponent(currentUrl)}`
		return
	}

	try {
		await userResource.promise
	} catch (e) {
		const currentUrl = window.location.pathname + window.location.search
		window.location.href = `/login?redirect-to=${encodeURIComponent(currentUrl)}`
		return
	}

	// 2. Check Tutor role.
	const roles = userResource.data?.roles || []
	if (!roles.includes('Tutor')) {
		return next({ name: 'Forbidden' })
	}

	return next()
}

let router = createRouter({
	history: createWebHistory(`/${getLmsBasePath()}`),
	routes,
})

router.beforeEach(async (to, from, next) => {
	const { userResource } = usersStore()
	let { isLoggedIn } = sessionStore()
	const { settings } = useSettings()

	try {
		if (isLoggedIn) {
			await userResource.promise
		}
	} catch (error) {
		isLoggedIn = false
	}

	if (!isLoggedIn) {
		if (to.name == 'Home') router.push({ name: 'Courses' })

		await settings.promise
		if (!settings.data.allow_guest_access) {
			window.location.href = '/login'
			return
		}
	} else {
		const roles = userResource.data?.roles || []
		const isTutor = roles.includes('Tutor')

		if (to.name === 'Home' && isTutor) {
			return next({ name: 'TutorDashboard' })
		}
		if (to.name === 'BookSession' && isTutor) {
			return next({ name: 'TutorDashboard' })
		}
	}
	return next()
})

export default router
