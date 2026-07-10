<template>
	<div class="relative flex h-screen flex-col">
		<div
			class="flex flex-1 flex-col overflow-y-auto pb-10"
			id="scrollContainer"
		>
			<slot />
		</div>

		<div class="relative z-20">
			<!-- Dropdown menu -->
			<div
				class="fixed bottom-16 end-2 w-[80%] space-y-4 rounded-md bg-surface-white p-5 text-base shadow-md"
				v-if="showMenu"
				ref="menu"
			>
				<div
					v-for="link in otherLinks"
					:key="link.label"
					class="flex cursor-pointer items-center gap-x-2"
					@click="handleClick(link)"
				>
					<component
						:is="icons[link.icon]"
						class="h-4 w-4 stroke-1.5 text-ink-gray-5"
					/>
					<div>{{ link.label }}</div>
				</div>
			</div>

			<!-- Fixed menu -->
			<div
				v-if="sidebarSettings.data"
				class="standalone:pb-4 fixed bottom-0 start-0 z-10 flex w-full items-center justify-around border-t border-outline-gray-2 bg-surface-white"
			>
				<button
					v-for="tab in sidebarLinks"
					:key="tab.label"
					:class="isVisible(tab) ? 'block' : 'hidden'"
					class="flex flex-col items-center justify-center py-3 transition active:scale-95"
					@click="handleClick(tab)"
				>
					<component
						:is="icons[tab.icon]"
						class="h-6 w-6 stroke-1.5"
						:class="[isActive(tab) ? 'text-ink-gray-9' : 'text-ink-gray-5']"
					/>
				</button>
				<button @click="toggleMenu">
					<component
						:is="icons['List']"
						class="h-6 w-6 stroke-1.5 text-ink-gray-5"
					/>
				</button>
			</div>
		</div>
	</div>
</template>
<script setup>
import { getSidebarLinks } from '@/utils'
import { useRouter } from 'vue-router'
import { call } from 'frappe-ui'
import { ref, watch } from 'vue'
import { sessionStore } from '@/stores/session'
import { useSettings } from '@/stores/settings'
import { usersStore } from '@/stores/user'
import * as icons from 'lucide-vue-next'

const { logout, user } = sessionStore()
let { isLoggedIn } = sessionStore()
const { sidebarSettings } = useSettings()
const router = useRouter()
let { userResource } = usersStore()
const sidebarLinks = ref([])
const otherLinks = ref([])
const showMenu = ref(false)
const menu = ref(null)
const isModerator = ref(false)
const isInstructor = ref(false)

const handleOutsideClick = (e) => {
	if (menu.value && !menu.value.contains(e.target)) {
		showMenu.value = false
	}
}

watch(showMenu, (val) => {
	if (val) {
		setTimeout(() => {
			document.addEventListener('click', handleOutsideClick)
		}, 0)
	} else {
		document.removeEventListener('click', handleOutsideClick)
	}
})

const destructureSidebarLinks = () => {
	let links = []
	sidebarLinks.value.forEach((link) => {
		link.items?.forEach((item) => {
			links.push(item)
		})
	})
	sidebarLinks.value = links
}

const filterLinksToShow = (data) => {
	Object.keys(data).forEach((key) => {
		if (!parseInt(data[key])) {
			sidebarLinks.value = sidebarLinks.value.filter(
				(link) => link.label.toLowerCase().split(' ').join('_') !== key
			)
		}
	})
}

const addOtherLinks = () => {
	otherLinks.value = []
	if (user) {
		// Customization for Smart Learning App: Inject role-based links for Tutors and Students
		const roles = userResource.data?.roles || []
		const isTutor = roles.includes('Tutor')

		if (isTutor) {
			addLink('Availability', 'Clock', 'AvailabilityRules')
			addLink('My Slots', 'Calendar', 'SlotCalendar')
			addLink('My Sessions', 'Users', 'TutorSessions')
			addLink('Tutor Profile', 'User', 'TutorProfile')
		} else {
			addLink('Book a Tutor', 'Search', 'BookSession')
			addLink('Upcoming Sessions', 'Calendar', 'Sessions')
			addLink('Revision', 'RefreshCw', 'Revision')
			addLink('Student Profile', 'User', 'StudentProfile')
		}

		addLink('Notifications', 'Bell', 'Notifications')
		addLink('Profile', 'UserRound')
		addLink('Log out', 'LogOut')
	} else {
		addLink('Log in', 'LogIn')
	}
}

const addLink = (label, icon, to = '') => {
	if (otherLinks.value.some((link) => link.label === label)) return
	otherLinks.value.push({
		label: label,
		icon: icon,
		to: to,
	})
}

const updateSidebarLinks = () => {
	sidebarLinks.value = getSidebarLinks(true)
	destructureSidebarLinks()
	if (sidebarSettings.data) {
		processSidebarLinks(sidebarSettings.data)
	} else {
		sidebarSettings.fetch().then((data) => {
			if (data) {
				processSidebarLinks(data)
			}
		})
	}
}

const processSidebarLinks = async (data) => {
	filterLinksToShow(data)
	await addPrograms()
	if (isModerator.value || isInstructor.value) {
		addQuizzes()
		addAssignments()
		addProgrammingExercises()
	}
	addOtherLinks()
}

const addQuizzes = () => {
	addLink('Quizzes', 'CircleHelp', 'Quizzes')
}

const addAssignments = () => {
	addLink('Assignments', 'Pencil', 'Assignments')
}

const addProgrammingExercises = () => {
	addLink('Programming Exercises', 'Code', 'ProgrammingExercises')
}

const addPrograms = async () => {
	if (sidebarLinks.value.some((link) => link.label === 'Programs')) return
	let canAddProgram = await checkIfCanAddProgram()
	if (!canAddProgram) return
	let activeFor = ['Programs', 'ProgramDetail']
	let index = 1

	sidebarLinks.value.splice(index, 0, {
		label: 'Programs',
		icon: 'Route',
		to: 'Programs',
		activeFor: activeFor,
	})
}


const checkIfCanAddProgram = async () => {
	if (!userResource.data) return false
	if (isModerator.value || isInstructor.value) {
		return true
	}
	const programs = await call('lms.lms.utils.get_programs')
	return programs.enrolled.length > 0 || programs.published.length > 0
}

let isActive = (tab) => {
	return tab.activeFor?.includes(router.currentRoute.value.name)
}

const handleClick = (tab) => {
	if (tab.label == 'Log in') window.location.href = '/login'
	else if (tab.label == 'Log out')
		logout.submit().then(() => {
			isLoggedIn = false
		})
	else if (tab.label == 'Profile')
		router.push({
			name: 'Profile',
			params: {
				username: userResource.data?.username,
			},
		})
	else router.push({ name: tab.to })
}

const isVisible = (tab) => {
	if (tab.label == 'Log in') return !isLoggedIn
	else if (tab.label == 'Log out') return isLoggedIn
	else return true
}

// Customization for Smart Learning App: Move watcher to the bottom to avoid Temporal Dead Zone (TDZ) ReferenceErrors on immediate execution
watch(
	() => userResource.data,
	async (data) => {
		if (data) {
			isModerator.value = data.is_moderator
			isInstructor.value = data.is_instructor
		}
		updateSidebarLinks()
	},
	{ immediate: true }
)

const toggleMenu = () => {
	showMenu.value = !showMenu.value
}
</script>
