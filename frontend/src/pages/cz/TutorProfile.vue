<template>
	<div>
		<LayoutHeader>
			<template #left-header>
				<Breadcrumbs class="h-7" :items="breadcrumbs" />
			</template>
		</LayoutHeader>

		<div class="mx-auto flex min-h-0 w-full flex-1 flex-col p-5 max-w-5xl">
			<!-- Loading State -->
			<div v-if="dashboardStore.dashboardData.loading || loadingOptions" class="flex justify-center py-20">
				<LoadingIndicator class="w-10 h-10 text-gray-400" />
			</div>

			<!-- Empty State: No Profile -->
			<div v-else-if="!profile"
				class="text-center py-20 border rounded-md space-y-4 bg-surface-white">
				<div class="flex flex-col items-center justify-center space-y-2">
					<div class="p-3 bg-surface-gray-2 rounded-full">
						<User class="w-8 h-8 text-ink-gray-5 stroke-1.5" />
					</div>
					<h3 class="text-lg font-medium text-ink-gray-9">{{ __('No Tutor Profile linked to your account') }}
					</h3>
					<p class="text-sm text-ink-gray-7 max-w-sm">
						{{ __('Create a tutor profile to start configuring availability rules and taking bookings.') }}
					</p>
				</div>
				<router-link :to="{ name: 'TutorProfileCreate' }">
					<Button variant="solid" class="font-semibold text-xs mt-2">
						{{ __('Create Tutor Profile') }}
					</Button>
				</router-link>
			</div>

			<!-- Profile Edit/View Form -->
			<div v-else class="space-y-6 bg-surface-white">
				<div class="flex justify-between items-start border-b pb-4">
					<div>
						<div class="flex items-center gap-3">
							<h2 class="text-xl font-semibold text-ink-gray-9">{{ form.tutor_name || __('Tutor Profile') }}</h2>
							<Badge
								v-if="profile?.verification_status"
								:theme="getVerificationTheme(profile.verification_status)"
								size="sm"
							>
								{{ profile.verification_status }}
							</Badge>
						</div>
						<p class="text-sm text-ink-gray-5 mt-1">{{ __('Manage your tutoring profile details visible to students.') }}</p>
					</div>
				</div>

				<!-- Tabs Navigation -->
				<div class="mb-4">
					<TabButtons class="inline-block" :buttons="profileTabs" v-model="activeTab" />
				</div>

				<!-- TAB: Profile Details -->
				<div v-if="activeTab === 'profile'" class="space-y-6 max-w-3xl">
					<form @submit.prevent="saveProfile" class="space-y-6">
						<div class="space-y-4">
							<FormControl v-model="form.tutor_name" :disabled="isReadOnly" type="text"
								:label="__('Display Name')" :required="true" placeholder="e.g. Dr. John Doe" />
							<FormControl v-model="form.timezone" :disabled="isReadOnly" type="select"
								:options="tzOptions" :label="__('Timezone')" :required="true" />
							<FormControl v-model.number="form.years_of_experience" :disabled="isReadOnly" type="number"
								min="0" :required="true" placeholder="e.g. 5" :label="__('Years of Experience')" />
						</div>

						<FormControl v-model="form.bio" :disabled="isReadOnly" type="textarea" rows="4"
							placeholder="Write a short summary about your background, credentials and tutoring approach..."
							:label="__('Biography')" />

						<!-- Subjects -->
						<div class="border-t pt-5">
							<div v-if="isReadOnly" class="space-y-2">
								<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Subjects Taught') }}</label>
								<div class="flex flex-wrap gap-2">
									<Badge
										v-for="sub in selectedSubjects"
										:key="sub"
										theme="gray"
										size="md"
									>
										{{ sub }}
									</Badge>
									<p v-if="!selectedSubjects.length" class="text-sm text-ink-gray-5">{{ __('No subjects specified.') }}</p>
								</div>
							</div>
							<MultiSelect
								v-else
								v-model="selectedSubjects"
								doctype="Subject"
								:label="__('Subjects Taught')"
								:required="true"
							/>
						</div>

						<!-- Boards -->
						<div class="border-t pt-5">
							<div v-if="isReadOnly" class="space-y-2">
								<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Boards Supported') }}</label>
								<div class="flex flex-wrap gap-2">
									<Badge
										v-for="brd in selectedBoards"
										:key="brd"
										theme="gray"
										size="md"
									>
										{{ brd }}
									</Badge>
									<p v-if="!selectedBoards.length" class="text-sm text-ink-gray-5">{{ __('No boards specified.') }}</p>
								</div>
							</div>
							<MultiSelect
								v-else
								v-model="selectedBoards"
								doctype="Board"
								:label="__('Boards Supported')"
								:required="true"
							/>
						</div>

						<!-- Classes -->
						<div class="border-t pt-5">
							<div v-if="isReadOnly" class="space-y-2">
								<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Classes Target') }}</label>
								<div class="flex flex-wrap gap-2">
									<Badge
										v-for="cls in selectedClasses"
										:key="cls"
										theme="gray"
										size="md"
									>
										{{ cls }}
									</Badge>
									<p v-if="!selectedClasses.length" class="text-sm text-ink-gray-5">{{ __('No classes specified.') }}</p>
								</div>
							</div>
							<MultiSelect
								v-else
								v-model="selectedClasses"
								doctype="Class"
								:label="__('Classes Target')"
								:required="true"
							/>
						</div>

						<!-- Qualifications -->
						<div class="border-t pt-5 space-y-4">
							<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{
								__('Qualifications') }}</label>

							<div v-if="qualifications.length" class="space-y-2.5">
								<div v-for="(q, idx) in qualifications" :key="idx"
									class="flex items-start justify-between border rounded-md px-4 py-3 text-sm text-ink-gray-7 bg-surface-white hover:border-outline-gray-3">
									<div class="space-y-1">
										<div class="flex flex-wrap gap-2 items-center text-ink-gray-9">
											<span class="font-semibold">{{ q.qualification }}</span>
											<span class="text-ink-gray-4">·</span>
											<span>{{ q.institution }}</span>
											<span class="text-ink-gray-4">·</span>
											<span class="font-medium text-ink-gray-5">{{ q.year_of_passing }}</span>
										</div>
										<div class="text-xs text-ink-gray-5 flex flex-wrap gap-x-3 gap-y-1">
											<span v-if="q.level"><strong>Level:</strong> {{ q.level }}</span>
											<span v-if="q.class_per"><strong>Class/Pct:</strong> {{ q.class_per
												}}</span>
											<span v-if="q.maj_opt_subj"><strong>Subjects:</strong> {{ q.maj_opt_subj
												}}</span>
										</div>
									</div>
									<button v-if="!isReadOnly" type="button" @click="removeQualification(idx)"
										class="text-xs font-semibold text-red-500 hover:text-red-600 hover:underline ml-4 shrink-0 mt-0.5">
										{{ __('Remove') }}
									</button>
								</div>
							</div>
							<div v-else
								class="text-sm text-ink-gray-5 bg-surface-gray-2 border border-dashed rounded-md p-4 text-center">
								{{ __('No qualifications added yet. At least one is required.') }}
							</div>

							<!-- Add row form container -->
							<div v-if="!isReadOnly" class="space-y-4 pt-4 border-t border-slate-100">
								<h4 class="text-sm font-semibold text-ink-gray-7">
									{{ __('Add Qualification') }}
								</h4>
								<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<FormControl
										v-model="newQual.qualification"
										type="text"
										:label="__('Qualification')"
										:required="!qualifications.length"
										placeholder="e.g. B.Tech"
									/>
									<FormControl
										v-model="newQual.institution"
										type="text"
										:label="__('Institution')"
										:required="!qualifications.length"
										placeholder="e.g. Stanford University"
									/>
									<FormControl
										v-model.number="newQual.year_of_passing"
										type="number"
										:label="__('Year of Passing')"
										:required="!qualifications.length"
										placeholder="e.g. 2020"
									/>
								</div>

								<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<FormControl
										v-model="newQual.level"
										type="select"
										:options="levelOptions"
										:label="__('Level')"
									/>
									<FormControl
										v-model="newQual.class_per"
										type="text"
										:label="__('Class / Percentage')"
										placeholder="e.g. First Class / 85%"
									/>
									<FormControl
										v-model="newQual.maj_opt_subj"
										type="text"
										:label="__('Major / Optional Subjects')"
										placeholder="e.g. Computer Science"
									/>
								</div>
								
								<div class="flex justify-end">
									<Button type="button" variant="outline" @click="addQualification"
										class="rounded-xl text-xs font-semibold px-4 h-9 justify-center">
										{{ __('Add Row') }}
									</Button>
								</div>
							</div>
						</div>

						<div class="flex items-start gap-3 mt-4 pb-2 border-t pt-5">
							<Checkbox id="activeToggle" v-model="form.active" :disabled="isReadOnly" />
							<div class="space-y-1">
								<label class="text-sm font-medium text-ink-gray-9 select-none"
									:class="{ 'cursor-pointer': !isReadOnly }" for="activeToggle">
									{{ __('Active Status') }}
								</label>
								<p class="text-xs text-ink-gray-5">
									{{ __('Toggle this to enable or disable your profile in the tutor marketplace directory.') }}
								</p>
							</div>
						</div>

						<!-- Submit -->
						<div v-if="!isReadOnly" class="flex justify-end pt-4 border-t">
							<Button :loading="saving" variant="solid" type="submit"
								class="rounded-md text-xs font-semibold px-5">
								{{ __('Update Profile') }}
							</Button>
						</div>
					</form>
				</div>

				<!-- TAB: Availability Rules -->
				<div v-if="activeTab === 'availability'" class="space-y-6 max-w-5xl">
					<!-- Warning banner if tutor profile is not verified -->
					<div v-if="profile && profile.verification_status !== 'Verified'"
						class="flex items-start gap-2.5 p-4 bg-surface-amber-1 border border-outline-amber-2 rounded-md text-sm text-ink-amber-3">
						<AlertCircle class="w-4 h-4 mt-0.5 shrink-0" />
						<div>
							<span class="font-semibold">{{ __('Tutor Profile not verified') }}</span>.
							{{ __('To create the availability rule, Tutor Profile must be verified.') }}
						</div>
					</div>

					<div class="flex justify-between items-center">
						<div>
							<h3 class="text-base font-semibold text-ink-gray-9">{{ __('Weekly Availability Slots') }}</h3>
							<p class="text-sm text-ink-gray-5 mt-0.5">{{ __('Set up your recurring weekly slot generation patterns.') }}</p>
						</div>
						<Button @click="openAddModal" variant="solid" class="text-xs font-semibold">
							<template #prefix>
								<Plus class="w-3.5 h-3.5" />
							</template>
							{{ __('Create Slots') }}
						</Button>
					</div>

					<div v-if="rules.length" class="grid grid-cols-1 md:grid-cols-2 gap-5">
						<div v-for="rule in rules" :key="rule.name"
							class="border rounded-md p-4 bg-surface-white hover:border-outline-gray-3 transition-colors flex flex-col justify-between">
							<div class="space-y-3">
								<!-- Header: Weekday & Active Status -->
								<div class="flex justify-between items-start">
									<div>
										<h4 class="font-bold text-ink-gray-9 text-sm">
											{{ getWeekdaysString(rule.weekday) }}
										</h4>
										<p class="text-xs text-ink-gray-5 mt-0.5">
											{{ rule.effective_from }} {{ rule.effective_to ? `to ${rule.effective_to}` :
												__('onwards') }}
										</p>
									</div>
									<div class="flex gap-1.5">
										<Badge :label="rule.active ? __('Active') : __('Inactive')"
											:theme="rule.active ? 'green' : 'red'" size="sm" />
									</div>
								</div>

								<!-- Details Grid -->
								<div class="grid grid-cols-2 gap-4 pt-1 text-xs">
									<div>
										<span
											class="text-ink-gray-4 block mb-0.5 uppercase tracking-wider text-[10px]">{{
												__('Time Range') }}</span>
										<span class="font-semibold text-ink-gray-8">{{ formatTime(rule.start_time) }} –
											{{
												formatTime(rule.end_time) }}</span>
									</div>
									<div>
										<span
											class="text-ink-gray-4 block mb-0.5 uppercase tracking-wider text-[10px]">{{
												__('Duration') }}</span>
										<span class="font-semibold text-ink-gray-8">{{ settings_slot_duration }} {{
											__('mins')
											}}</span>
									</div>
									<div class="col-span-2">
										<span
											class="text-ink-gray-4 block mb-0.5 uppercase tracking-wider text-[10px]">{{
												__('Time Zone') }}</span>
										<span class="font-semibold text-ink-gray-8">{{ rule.timezone || profile.timezone
											||
											'Asia/Kolkata' }}</span>
									</div>
								</div>
							</div>

							<!-- Actions: Draft rules show Edit + Delete; Submitted rules show read-only indicator -->
							<div class="flex justify-end items-center gap-2.5 pt-3 border-t mt-4">
								<!-- Draft-only actions -->
								<template v-if="rule.docstatus === 0">
									<Button @click="openEditModal(rule)" variant="outline"
										class="text-xs font-semibold">
										{{ __('Edit') }}
									</Button>
									<Button @click="deleteRule(rule.name)" variant="outline"
										class="text-xs font-semibold text-red-600 hover:text-red-700">
										{{ __('Delete') }}
									</Button>
								</template>
							</div>
						</div>
					</div>

					<div v-else
						class="text-center py-12 border border-dashed rounded-md text-ink-gray-5 space-y-3 bg-surface-white">
						<p>{{ __('No availability rules defined yet. Create your first rule to generate booking slots.')
							}}</p>
						<Button @click="openAddModal" variant="solid" class="text-xs font-semibold mx-auto">
							{{ __('Create Slots') }}
						</Button>
					</div>
				</div>

			</div>
		</div>

		<!-- Rule Edit/Add Modal -->
		<Dialog v-model="showModal" :options="{
			title: editingRule ? __('Edit Availability Rule') : __('Add Availability Rule'),
			size: 'lg',
		}">
			<template #body-content>
				<AvailabilityForm :rule="editingRule" :profileTimezone="form.timezone" :loading="savingRule"
					@save="handleSave" @cancel="showModal = false" />
			</template>
		</Dialog>

		<!-- Rule Delete Confirmation Modal -->
		<Dialog v-model="showDeleteConfirmDialog" :options="{
			title: __('Confirm Deletion'),
			size: 'sm',
			actions: [
				{
					label: __('Delete'),
					variant: 'solid',
					theme: 'red',
					onClick: confirmDeleteRule,
				},
			],
		}">
			<template #body-content>
				<p class="text-sm text-ink-gray-7">
					{{ __('Are you sure you want to delete this draft rule?') }}
				</p>
			</template>
		</Dialog>


	</div>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Breadcrumbs, LoadingIndicator, Button, Badge, TabButtons, Dialog, FormControl, TextInput, Select, Checkbox, call, toast as frappeToast } from 'frappe-ui'
import { useTutorDashboardStore } from '@/stores/useTutorDashboardStore'
import { getTimezones } from '@/utils'
import AvailabilityForm from '@/components/cz/AvailabilityForm.vue'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'
import { User, Lock, Plus, AlertCircle } from 'lucide-vue-next'
import { subjectsList, boardsList, classesList } from '@/resources/bookTutor'
import MultiSelect from '@/components/Controls/MultiSelect.vue'

const route = useRoute()
const router = useRouter()
const dashboardStore = useTutorDashboardStore()

const activeTab = ref(route.query.tab || 'profile')

watch(() => route.query.tab, (newTab) => {
	if (newTab && ['profile', 'availability'].includes(newTab)) {
		activeTab.value = newTab
	}
})

watch(activeTab, (newTab) => {
	router.replace({ query: { ...route.query, tab: newTab } })
})

const profileTabs = [
	{ value: 'profile', label: __('Profile Details') },
	{ value: 'availability', label: __('Availability') }
]

const breadcrumbs = computed(() => [
	{ label: __('Tutor Profile'), route: { name: 'TutorProfile' } }
])

const loadingOptions = computed(() => subjectsList.loading || boardsList.loading || classesList.loading)
const saving = ref(false)


const profile = computed(() => dashboardStore.dashboardData.data?.profile)
const isReadOnly = computed(() => {
	return profile.value?.verification_status === 'Verified'
})

function getVerificationTheme(status) {
	switch (status) {
		case 'Verified': return 'green'
		case 'Pending Verification': return 'orange'
		case 'Rejected': return 'red'
		default: return 'gray'
	}
}

const selectedSubjects = ref([])
const selectedBoards = ref([])
const selectedClasses = ref([])

const qualifications = ref([])
const newQual = reactive({
	qualification: '',
	institution: '',
	year_of_passing: '',
	level: '',
	class_per: '',
	maj_opt_subj: '',
})
const timezoneOptions = getTimezones()
const tzOptions = computed(() => timezoneOptions.map(tz => ({ label: tz, value: tz })))

const levelOptions = [
	{ label: __('Select Level'), value: '' },
	{ label: __('Under Graduate'), value: 'Under Graduate' },
	{ label: __('Graduate'), value: 'Graduate' },
	{ label: __('Post Graduate'), value: 'Post Graduate' },
]



function getDetectedTimezone(systemTz) {
	try {
		const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
		if (browserTz) return browserTz
	} catch (e) {
		console.warn('Failed to detect browser timezone:', e)
	}
	return systemTz || 'Asia/Kolkata'
}

const form = reactive({
	tutor_name: '',
	bio: '',
	years_of_experience: 1,
	timezone: getDetectedTimezone(),
	active: true,
})

const rules = computed(() => dashboardStore.dashboardData.data?.rules || [])
const settings_slot_duration = computed(() => {
	return dashboardStore.dashboardData.data?.settings_slot_duration || 30
})

onMounted(async () => {
	await dashboardStore.dashboardData.submit()
	syncForm()
})

watch(profile, () => {
	syncForm()
})

function syncForm() {
	const systemTz = dashboardStore.dashboardData.data?.system_timezone
	const defaultTz = getDetectedTimezone(systemTz)
	if (profile.value) {
		Object.assign(form, {
			tutor_name: profile.value.tutor_name,
			bio: profile.value.bio || '',
			years_of_experience: profile.value.years_of_experience,
			timezone: profile.value.timezone || defaultTz,
			active: profile.value.active === undefined ? true : !!profile.value.active,
		})
		selectedSubjects.value = profile.value.subjects ? profile.value.subjects.map((s) => s.subject) : []
		selectedBoards.value = profile.value.boards ? profile.value.boards.map((b) => b.board) : []
		selectedClasses.value = profile.value.classes ? profile.value.classes.map((c) => c.class) : []
		qualifications.value = profile.value.qualifications
			? profile.value.qualifications.map((q) => ({
				qualification: q.qualification,
				institution: q.institution,
				year_of_passing: q.year_of_passing,
				level: q.level,
				class_per: q.class_per,
				maj_opt_subj: q.maj_opt_subj,
			}))
			: []
	} else {
		form.timezone = defaultTz
	}
}

function addQualification() {
	if (!newQual.qualification || !newQual.institution || !newQual.year_of_passing) {
		frappeToast.warning(__('Please fill in qualification, institution and year of passing.'))
		return
	}
	qualifications.value.push({
		qualification: newQual.qualification,
		institution: newQual.institution,
		year_of_passing: parseInt(newQual.year_of_passing),
		level: newQual.level || null,
		class_per: newQual.class_per || null,
		maj_opt_subj: newQual.maj_opt_subj || null,
	})
	newQual.qualification = ''
	newQual.institution = ''
	newQual.year_of_passing = ''
	newQual.level = ''
	newQual.class_per = ''
	newQual.maj_opt_subj = ''
}

function removeQualification(index) {
	qualifications.value.splice(index, 1)
}

async function saveProfile() {
	if (!qualifications.value.length) {
		frappeToast.warning(__('At least one qualification is required.'))
		return
	}
	saving.value = true
	try {
		const res = await call('smart_learning.api.tutor_api.save_tutor_profile', {
			tutor_name: form.tutor_name,
			bio: form.bio,
			years_of_experience: form.years_of_experience,
			timezone: form.timezone,
			subjects: JSON.stringify(selectedSubjects.value),
			boards: JSON.stringify(selectedBoards.value),
			classes: JSON.stringify(selectedClasses.value),
			qualifications: JSON.stringify(qualifications.value),
			active: form.active ? 1 : 0,
		})
		if (res && res.success) {
			frappeToast.success(res.message)
			isCreating.value = false
			await dashboardStore.dashboardData.submit()
		} else {
			frappeToast.error(res.error || __('Failed to save profile.'))
		}
	} catch (e) {
		console.error('Failed to save profile:', e)
		frappeToast.error(__('An error occurred while saving.'))
	} finally {
		saving.value = false
	}
}

// Availability rules handling
const showModal = ref(false)
const editingRule = ref(null)
const savingRule = ref(false)

function getWeekdaysString(weekdayList) {
	if (!weekdayList || !weekdayList.length) return ''
	return weekdayList.map(w => w.weekday).join(', ')
}

function formatTime(timeStr) {
	if (!timeStr) return ''
	const parts = timeStr.split(':')
	const hours = parseInt(parts[0])
	const minutes = parts[1]
	const ampm = hours >= 12 ? 'PM' : 'AM'
	const formattedHours = hours % 12 || 12
	return `${formattedHours}:${minutes} ${ampm}`
}

function openAddModal() {
	if (profile.value?.verification_status !== 'Verified') {
		frappeToast.warning(__('Tutor Profile not verified. To create the availability rule, Tutor Profile must be verified.'))
		return
	}
	editingRule.value = null
	showModal.value = true
}

function openEditModal(rule) {
	if (profile.value?.verification_status !== 'Verified') {
		frappeToast.warning(__('Tutor Profile not verified. To create the availability rule, Tutor Profile must be verified.'))
		return
	}
	const weekdaysList = Array.isArray(rule.weekday)
		? rule.weekday.map((w) => w.weekday)
		: []
	editingRule.value = {
		...rule,
		weekdays: weekdaysList
	}
	showModal.value = true
}

function formatWeekdays(weekdaysList) {
	if (!weekdaysList || weekdaysList.length === 0) return ''
	const daysOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
	const sortedDays = [...weekdaysList].sort((a, b) => daysOrder.indexOf(a.toLowerCase().trim()) - daysOrder.indexOf(b.toLowerCase().trim()))
	const capitalized = sortedDays.map(d => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase())
	if (capitalized.length === 1) {
		return capitalized[0]
	}
	if (capitalized.length === 2) {
		return `${capitalized[0]} and ${capitalized[1]}`
	}
	return capitalized.slice(0, -1).join(', ') + `, and ${capitalized[capitalized.length - 1]}`
}

function checkOverlap(formData, existingRules) {
	if (!formData.active) return null

	const newFrom = new Date(formData.effective_from)
	const newTo = formData.effective_to ? new Date(formData.effective_to) : null
	const newStart = formData.start_time
	const newEnd = formData.end_time

	const getMinutes = (t) => {
		if (!t) return 0
		const parts = t.split(':')
		return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
	}
	const nStart = getMinutes(newStart)
	const nEnd = getMinutes(newEnd)

	const newWeekdays = formData.weekdays.map(d => d.toLowerCase().trim())

	for (const rule of existingRules) {
		if (editingRule.value && editingRule.value.name === rule.name) {
			continue
		}
		if (rule.docstatus !== 1 || !rule.active) {
			continue
		}

		const rFrom = new Date(rule.effective_from)
		const rTo = rule.effective_to ? new Date(rule.effective_to) : null

		let overlapDates = true
		if (newTo && newTo < rFrom) {
			overlapDates = false
		}
		if (rTo && rTo < newFrom) {
			overlapDates = false
		}

		if (!overlapDates) {
			continue
		}

		const rStart = getMinutes(rule.start_time)
		const rEnd = getMinutes(rule.end_time)

		if (nStart >= rEnd || nEnd <= rStart) {
			continue
		}

		const rWeekdays = Array.isArray(rule.weekday)
			? rule.weekday.map(w => w.weekday.toLowerCase().trim())
			: []
		const commonWeekdays = newWeekdays.filter(w => rWeekdays.includes(w))

		if (commonWeekdays.length > 0) {
			return {
				rule: rule,
				commonWeekdays: commonWeekdays
			}
		}
	}

	return null
}

async function handleSave(formData) {
	if (profile.value?.verification_status !== 'Verified') {
		frappeToast.warning(__('Tutor Profile not verified. To create the availability rule, Tutor Profile must be verified.'))
		return
	}

	if (formData.active) {
		const overlap = checkOverlap(formData, rules.value)
		if (overlap) {
			const daysStr = formatWeekdays(overlap.commonWeekdays)
			const startStr = formatTime(overlap.rule.start_time)
			const endStr = formatTime(overlap.rule.end_time)
			frappeToast.error(
				__('You already have an active availability rule on {0} from {1} to {2}. Please edit the existing rule or choose a different time.')
					.replace('{0}', daysStr)
					.replace('{1}', startStr)
					.replace('{2}', endStr)
			)
			return
		}
	}

	savingRule.value = true
	try {
		const weekdayRows = formData.weekdays.map((day) => ({ weekday: day }))

		const doc = {
			doctype: 'Tutor Availability Rule',
			tutor: profile.value.name,
			workflow_state: 'Approved',
			start_time: formData.start_time,
			end_time: formData.end_time,
			effective_from: formData.effective_from,
			effective_to: formData.effective_to || null,
			active: formData.active,
			weekday: weekdayRows
		}

		if (editingRule.value && editingRule.value.name) {
			await call('frappe.client.cancel', {
				doctype: 'Tutor Availability Rule',
				name: editingRule.value.name,
			})
			const newDoc = await call('frappe.client.insert', { doc })
			await call('frappe.client.submit', { doc: newDoc })
		} else {
			const newDoc = await call('frappe.client.insert', { doc })
			await call('frappe.client.submit', { doc: newDoc })
		}
		showModal.value = false
		frappeToast.success(__('Rule saved successfully.'))
		await dashboardStore.dashboardData.submit()
	} catch (e) {
		console.error('Save rule failed:', e)
		frappeToast.error(e.message || __('Failed to save rule.'))
	} finally {
		savingRule.value = false
	}
}

const showDeleteConfirmDialog = ref(false)
const ruleToDelete = ref(null)

function deleteRule(name) {
	ruleToDelete.value = name
	showDeleteConfirmDialog.value = true
}

async function confirmDeleteRule() {
	if (!ruleToDelete.value) return
	const name = ruleToDelete.value
	showDeleteConfirmDialog.value = false
	ruleToDelete.value = null
	try {
		await call('smart_learning.api.tutor_api.delete_availability_rule', { rule_name: name })
		frappeToast.success(__('Rule deleted successfully.'))
		await dashboardStore.dashboardData.submit()
	} catch (e) {
		console.error('Failed to delete rule:', e)
		frappeToast.error(e.message || __('Failed to delete rule.'))
	}
}
</script>

<style scoped>
:deep(select),
:deep(button[data-slot="trigger"]),
:deep(.select-trigger) {
	width: 100% !important;
	max-width: 100% !important;
}
</style>
