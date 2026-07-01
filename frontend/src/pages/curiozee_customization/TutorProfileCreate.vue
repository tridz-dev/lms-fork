<template>
	<div>
		<LayoutHeader>
			<template #left-header>
				<Breadcrumbs class="h-7" :items="breadcrumbs" />
			</template>
		</LayoutHeader>

		<div class="flex min-h-0 w-full flex-1 flex-col p-5 pb-10">
			<!-- Header -->
			<div class="border-b pb-4 mb-6">
				<h2 class="text-2xl font-semibold text-ink-gray-9">
					{{ __('Create Tutor Profile') }}
				</h2>
				<p class="text-sm text-ink-gray-5 mt-1">
					{{ __('Fill in your profile details to register as a live tutor on the platform.') }}
				</p>
			</div>

			<!-- Form Container -->
			<form @submit.prevent="saveProfile" class="space-y-6">
				<!-- Section 1: Basic Details -->
				<div class="bg-surface-white border border-outline-gray-2 rounded-md p-5 space-y-5">
					<h3 class="text-lg font-semibold text-ink-gray-9 border-b pb-3 mb-4">
						{{ __('Basic Information') }}
					</h3>
					
					<div class="space-y-4">
						<FormControl
							v-model="form.tutor_name"
							type="text"
							:label="__('Display Name')"
							:required="true"
							placeholder="e.g. Dr. John Doe"
						/>
						<FormControl
							v-model="form.timezone"
							type="select"
							:options="tzOptions"
							:label="__('Timezone')"
							:required="true"
						/>
						<FormControl
							v-model.number="form.years_of_experience"
							type="number"
							min="0"
							:required="true"
							placeholder="e.g. 5"
							:label="__('Years of Experience')"
						/>
						<FormControl
							v-model="form.bio"
							type="textarea"
							rows="5"
							placeholder="Write a short summary about your background, credentials and tutoring approach..."
							:label="__('Biography')"
						/>
					</div>

					<div class="flex items-start gap-3 pt-4 border-t">
						<Checkbox id="activeToggle" v-model="form.active" />
						<div class="space-y-1">
							<label class="text-sm font-medium text-ink-gray-9 select-none cursor-pointer" for="activeToggle">
								{{ __('Active Status') }}
							</label>
							<p class="text-xs text-ink-gray-5">
								{{ __('Toggle to make your profile visible in the tutor marketplace.') }}
							</p>
						</div>
					</div>
				</div>

				<!-- Section 2: Specialties / Subjects -->
				<div class="bg-surface-white border border-outline-gray-2 rounded-md p-5 space-y-6">
					<h3 class="text-lg font-semibold text-ink-gray-9 border-b pb-3 mb-4">
						{{ __('Subjects & Curriculum') }}
					</h3>

					<MultiSelect
						v-model="selectedSubjects"
						doctype="Subject"
						:label="__('Subjects Taught')"
						:required="true"
					/>

					<MultiSelect
						v-model="selectedBoards"
						doctype="Board"
						:label="__('Boards Supported')"
						:required="true"
					/>

					<MultiSelect
						v-model="selectedClasses"
						doctype="Class"
						:label="__('Classes Target')"
						:required="true"
					/>
				</div>

				<!-- Section 3: Qualifications -->
				<div class="bg-surface-white border border-outline-gray-2 rounded-md p-5 space-y-6">
					<h3 class="text-lg font-semibold text-ink-gray-9 border-b pb-3">
						{{ __('Qualifications') }}
					</h3>

					<div v-if="qualifications.length" class="space-y-2.5">
						<div
							v-for="(q, idx) in qualifications"
							:key="idx"
							class="flex items-start justify-between border border-outline-gray-2 rounded-md px-4 py-3 text-sm text-ink-gray-7 bg-surface-white hover:border-outline-gray-3 transition-colors"
						>
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
									<span v-if="q.class_per"><strong>Class/Pct:</strong> {{ q.class_per }}</span>
									<span v-if="q.maj_opt_subj"><strong>Subjects:</strong> {{ q.maj_opt_subj }}</span>
								</div>
							</div>
							<Button
								variant="outline"
								theme="red"
								size="sm"
								@click="removeQualification(idx)"
								class="ml-4 shrink-0 mt-0.5"
							>
								{{ __('Remove') }}
							</Button>
						</div>
					</div>
					<div
						v-else
						class="text-sm text-ink-gray-5 bg-surface-gray-2 border border-outline-gray-2 border-dashed rounded-md p-5 text-center"
					>
						{{ __('No qualifications added yet. At least one qualification is required.') }}
					</div>

					<!-- Qualification Input Fields -->
					<div class="space-y-4 pt-4 border-t border-slate-100">
						<h4 class="text-sm font-semibold text-ink-gray-7">
							{{ __('Add Qualification') }}
						</h4>
						<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<FormControl
								v-model="newQual.qualification"
								type="text"
								:label="__('Qualification')"
								:required="!qualifications.length"
							/>
							<FormControl
								v-model="newQual.institution"
								type="text"
								:label="__('Institution')"
								:required="!qualifications.length"
								
							/>
							<FormControl
								v-model.number="newQual.year_of_passing"
								type="number"
								:label="__('Year of Passing')"
								:required="!qualifications.length"
								
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
							
							/>
							<FormControl
								v-model="newQual.maj_opt_subj"
								type="text"
								:label="__('Major / Optional Subjects')"
								
							/>
						</div>

						<div class="flex justify-end">
							<Button
								type="button"
								variant="outline"
								@click="addQualification"
							>
								{{ __('Add Row') }}
							</Button>
						</div>
					</div>
				</div>

				<!-- Form Actions -->
				<div class="flex justify-end gap-3 pt-4 border-t">
					<router-link :to="{ name: 'TutorProfile' }">
						<Button
							variant="outline"
						>
							{{ __('Cancel') }}
						</Button>
					</router-link>
					<Button
						:loading="saving"
						variant="solid"
						type="submit"
					>
						{{ __('Create Profile') }}
					</Button>
				</div>
			</form>
		</div>
	</div>
</template>

<script setup>
import { computed, inject, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Breadcrumbs, Button, FormControl, TextInput, Select, Checkbox, call, toast as frappeToast, usePageMeta } from 'frappe-ui'
import { useTutorDashboardStore } from '@/stores/useTutorDashboardStore'
import { getTimezones } from '@/utils'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'
import MultiSelect from '@/components/Controls/MultiSelect.vue'

const router = useRouter()
const dashboardStore = useTutorDashboardStore()

usePageMeta(() => {
	return {
		title: __('Create Tutor Profile - Curiozee'),
	}
})

const breadcrumbs = computed(() => [
	{ label: __('Tutor Profile'), route: { name: 'TutorProfile' } },
	{ label: __('Create'), route: { name: 'TutorProfileCreate' } }
])

const saving = ref(false)
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

onMounted(async () => {
	await dashboardStore.dashboardData.submit()
	const systemTz = dashboardStore.dashboardData.data?.system_timezone
	form.timezone = getDetectedTimezone(systemTz)
})

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
	if (!selectedSubjects.value.length) {
		frappeToast.warning(__('Please select at least one subject.'))
		return
	}
	if (!selectedBoards.value.length) {
		frappeToast.warning(__('Please select at least one board.'))
		return
	}
	if (!selectedClasses.value.length) {
		frappeToast.warning(__('Please select at least one class.'))
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
			await dashboardStore.dashboardData.submit()
			router.push({ name: 'TutorProfile' })
		} else {
			let errorMsg = res.error || __('Failed to save profile.')
			if (typeof errorMsg === 'string' && errorMsg.includes('Workflow State transition not allowed')) {
				errorMsg = __('Profile submission for verification is not permitted in the current state. Please contact support.')
			}
			frappeToast.error(errorMsg)
		}
	} catch (e) {
		console.error('Failed to save profile:', e)
		let errorMsg = e.message || e.error || __('An error occurred while saving.')
		if (typeof errorMsg === 'string' && errorMsg.includes('Workflow State transition not allowed')) {
			errorMsg = __('Profile submission for verification is not permitted in the current state. Please contact support.')
		}
		frappeToast.error(errorMsg)
	} finally {
		saving.value = false
	}
}
</script>

