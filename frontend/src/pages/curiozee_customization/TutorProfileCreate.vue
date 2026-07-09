<template>
	<div>
		<LayoutHeader>
			<template #left-header>
				<Breadcrumbs class="h-7" :items="breadcrumbs" />
			</template>
		</LayoutHeader>

		<div class="flex min-h-0 w-full flex-1 flex-col pb-10">
			<!-- Banner Cover Image -->
			<div class="group relative h-20 w-full">
				<img
					v-if="$user?.data?.cover_image"
					:src="$user.data.cover_image"
					class="h-20 w-full object-cover object-center"
				/>
				<div
					v-else
					class="h-20 w-full bg-surface-gray-2"
				></div>
			</div>

			<!-- Main Layout Container -->
			<div class="mx-auto -mt-8 md:-mt-4 max-w-6xl w-full px-5">
				<div class="flex flex-col md:flex-row items-center">
					<div>
						<FileUploader
							:fileTypes="['image/*']"
							:validateFile="(file) => validateFile(file, true, 'image')"
							@success="(file) => form.profile_photo = file.file_url"
						>
							<template v-slot="{ openFileSelector, uploading }">
								<button
									type="button"
									@click="openFileSelector"
									class="relative group block rounded-full focus:outline-none"
									:disabled="uploading"
								>
									<img
										v-if="form.profile_photo || $user?.data?.user_image"
										:src="form.profile_photo || $user?.data?.user_image"
										class="object-cover h-[100px] w-[100px] rounded-full border-4 border-white shadow-sm"
									/>
									<div
										v-else
										class="flex items-center justify-center h-[100px] w-[100px] rounded-full border-4 border-white bg-surface-gray-2 text-3xl font-semibold text-ink-gray-7 shadow-sm"
									>
										{{ (form.tutor_name || $user?.data?.full_name || 'T').charAt(0).toUpperCase() }}
									</div>

									<!-- Hover Overlay -->
									<div
										class="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 border-4 border-transparent"
									>
										<Camera class="w-5 h-5 mb-1" />
										<span class="text-[10px] font-medium leading-none">{{ uploading ? __('Uploading...') : __('Upload') }}</span>
									</div>
								</button>
							</template>
						</FileUploader>
					</div>
					<div class="ms-5 mt-5 flex-1">
						<div class="flex items-center gap-3">
							<h2 class="text-2xl font-semibold text-ink-gray-9">
								{{ form.tutor_name || __('Create Tutor Profile') }}
							</h2>
						</div>
						<p class="text-sm font-normal text-ink-gray-5 mt-1.5">
							{{ __('Fill in your profile details to register as a live tutor on the platform.') }}
						</p>
					</div>
				</div>

				<div class="space-y-8 max-w-2xl mt-8">
					<form @submit.prevent="saveProfile" class="space-y-8">
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
						</div>

						<FormControl
							v-model="form.bio"
							type="textarea"
							rows="4"
							placeholder="Write a short summary about your background, credentials and tutoring approach..."
							:label="__('Biography')"
						/>

						<!-- Subjects -->
						<div class="space-y-1.5">
							<FormLabel :label="__('Subjects Taught')" required />
							<MultiSelect
								v-model="selectedSubjects"
								:options="subjectsList.data || []"
								:loading="subjectsList.loading"
								:placeholder="__('Select Subjects')"
								class="w-full"
							/>
						</div>

						<!-- Boards -->
						<div class="space-y-1.5">
							<FormLabel :label="__('Boards Supported')" required />
							<MultiSelect
								v-model="selectedBoards"
								:options="boardsList.data || []"
								:loading="boardsList.loading"
								:placeholder="__('Select Boards')"
								class="w-full"
							/>
						</div>

						<!-- Classes -->
						<div class="space-y-1.5">
							<FormLabel :label="__('Classes Target')" required />
							<MultiSelect
								v-model="selectedClasses"
								:options="classesList.data || []"
								:loading="classesList.loading"
								:placeholder="__('Select Classes')"
								class="w-full"
							/>
						</div>

						<!-- Qualifications -->
						<div class="space-y-4">
							<label class="block text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">
								{{ __('Qualifications') }}
							</label>

							<div v-if="qualifications.length" class="space-y-2.5">
								<div
									v-for="(q, idx) in qualifications"
									:key="idx"
									class="flex items-start justify-between border border-outline-gray-2 rounded-md px-4 py-3 text-sm text-ink-gray-7 bg-surface-white hover:border-outline-gray-3"
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
								class="text-sm text-ink-gray-5 bg-surface-gray-2 border border-outline-gray-2 border-dashed rounded-md p-4 text-center"
							>
								{{ __('No qualifications added yet. At least one qualification is required.') }}
							</div>

							<!-- Add row form container -->
							<div class="space-y-4 pt-4">
								<h4 class="text-base font-semibold text-ink-gray-9">
									{{ __('Add Qualification') }}
								</h4>
								<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<FormControl
										v-model="newQual.qualification"
										type="text"
										:label="__('Qualification')"
										:required="!qualifications.length"
										placeholder="B.Tech"
									/>
									<FormControl
										v-model="newQual.institution"
										type="text"
										:label="__('Institution')"
										:required="!qualifications.length"
										placeholder="Stanford University"
									/>
									<FormControl
										v-model.number="newQual.year_of_passing"
										type="number"
										:label="__('Year of Passing')"
										:required="!qualifications.length"
										placeholder="2020"
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
										placeholder="First Class / 85%"
									/>
									<FormControl
										v-model="newQual.maj_opt_subj"
										type="text"
										:label="__('Major / Optional Subjects')"
										placeholder="Computer Science"
									/>
								</div>

								<div class="flex justify-end">
									<Button
										type="button"
										variant="outline"
										@click="addQualification"
										class="h-9 px-5 rounded-lg font-semibold"
									>
										{{ __('Add Row') }}
									</Button>
								</div>
							</div>
						</div>

						<div class="space-y-1.5 pt-4">
							<FormControl
								id="activeToggle"
								v-model="form.active"
								type="checkbox"
								:label="__('Not on Vacation')"
							/>
							<p class="text-xs text-ink-gray-5 pl-6">
								{{ __('Toggle this to enable or disable your profile in the tutor marketplace directory.') }}
							</p>
						</div>

						<!-- Form Actions -->
						<div class="flex justify-end gap-3 pt-6">
							<router-link :to="{ name: 'TutorProfile' }" custom v-slot="{ navigate }">
								<Button
									variant="outline"
									@click="navigate"
									class="h-9 px-5 rounded-lg font-semibold"
								>
									{{ __('Cancel') }}
								</Button>
							</router-link>
							<Button
								:loading="saving"
								variant="solid"
								type="submit"
								class="h-9 px-5 rounded-lg font-semibold"
							>
								{{ __('Create Profile') }}
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, inject, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Breadcrumbs, Button, FormControl, FormLabel, MultiSelect, FileUploader, call, toast as frappeToast, usePageMeta } from 'frappe-ui'
import { useTutorDashboardStore } from '@/stores/useTutorDashboardStore'
import { getTimezones, validateFile } from '@/utils'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'
import { Camera } from 'lucide-vue-next'
import { subjectsList, boardsList, classesList } from '@/resources/bookTutor'

const router = useRouter()
const dashboardStore = useTutorDashboardStore()
const $user = inject('$user')

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
	profile_photo: '',
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
			profile_photo: form.profile_photo || null,
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
