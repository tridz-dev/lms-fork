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
										class="object-cover h-[100px] w-[100px] rounded-full border-4 border-white"
									/>
									<div
										v-else
										class="flex items-center justify-center h-[100px] w-[100px] rounded-full border-4 border-white bg-surface-gray-2 text-3xl font-semibold text-ink-gray-7"
									>
										{{ (form.full_name || $user?.data?.full_name || 'S').charAt(0).toUpperCase() }}
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
								{{ form.full_name || __('Create Student Profile') }}
							</h2>
						</div>
						<p class="text-sm font-normal text-ink-gray-5 mt-1.5">
							{{ __('Fill in your profile details to register as a student on the platform.') }}
						</p>
					</div>
				</div>

				<!-- Loading state if settings or user info not ready -->
				<div v-if="loading" class="flex items-center justify-center py-20 bg-surface-white border border-outline-gray-2 rounded-md mt-8 max-w-2xl">
					<div class="flex flex-col items-center gap-3">
						<div class="h-8 w-8 animate-spin rounded-full border-4 border-ink-gray-7 border-t-transparent"></div>
						<p class="text-sm text-ink-gray-5 font-medium">{{ __('Loading profile setup...') }}</p>
					</div>
				</div>

				<div v-else class="space-y-8 max-w-2xl mt-8">
					<form @submit.prevent="saveProfile" class="space-y-8">
						<div class="space-y-4">
							<FormControl
								v-model="form.full_name"
								type="text"
								:label="__('Full Name')"
								:required="true"
								placeholder="e.g. Jane Doe"
							/>
							<FormControl
								v-model="form.phone_number"
								type="text"
								:label="__('Phone Number')"
								:required="true"
								placeholder="e.g. +1 555-0199"
							/>
							<FormControl
								v-model="form.time_zone"
								type="select"
								:options="tzOptions"
								:label="__('Timezone')"
								:required="true"
							/>
						</div>

						<div class="space-y-4 pt-4 border-t border-outline-gray-2">
							<h3 class="text-base font-semibold text-ink-gray-9">
								{{ __('Academic Details') }}
							</h3>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<FormControl
									v-model="form.board"
									type="text"
									:label="__('Board')"
									:required="true"
									placeholder="e.g. CBSE"
								/>
								<FormControl
									v-model="form.class"
									type="text"
									:label="__('Class')"
									:required="true"
									placeholder="e.g. Class 10"
								/>
							</div>
							<FormControl
								v-model="form.school"
								type="text"
								:label="__('School')"
								placeholder="e.g. Lincoln High School"
							/>
						</div>

						<!-- Form Actions -->
						<div class="flex justify-end gap-3 pt-6 border-t border-outline-gray-2">
							<router-link :to="{ name: 'Home' }" custom v-slot="{ navigate }">
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
								{{ __('Complete Setup') }}
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
import { Breadcrumbs, Button, FormControl, FileUploader, call, toast as frappeToast, usePageMeta } from 'frappe-ui'
import { useStudentProfileStore } from '@/stores/useStudentProfileStore'
import { usersStore } from '@/stores/user'
import { getTimezones, validateFile } from '@/utils'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'
import { Camera } from 'lucide-vue-next'

const router = useRouter()
const profileStore = useStudentProfileStore()
const userStore = usersStore()
const $user = inject('$user')

usePageMeta(() => {
	return {
		title: __('Create Student Profile - Curiozee'),
	}
})

const breadcrumbs = computed(() => [
	{ label: __('Student Profile'), route: { name: 'StudentProfile' } },
	{ label: __('Create'), route: { name: 'StudentProfileCreate' } }
])

const loading = ref(true)
const saving = ref(false)

const timezoneOptions = getTimezones()
const tzOptions = computed(() => timezoneOptions.map(tz => ({ label: tz, value: tz })))

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
	full_name: '',
	phone_number: '',
	time_zone: getDetectedTimezone(),
	board: '',
	class: '',
	school: '',
	profile_photo: '',
})

onMounted(async () => {
	try {
		await userStore.userResource.promise
		const user = userStore.userResource.data
		if (user) {
			form.full_name = user.full_name || ''
			form.phone_number = user.mobile_no || user.phone || ''
			form.time_zone = user.time_zone || getDetectedTimezone()
		}
		
		// Attempt to fetch if profile already exists, if so redirect to view
		await profileStore.profile.submit()
		if (profileStore.profile.data && profileStore.profile.data.name) {
			profileStore.setExists(true)
			router.push({ name: 'StudentProfile' })
			return
		}
	} catch (e) {
		console.error('Failed to load initial onboarding data:', e)
	} finally {
		loading.value = false
	}
})

async function saveProfile() {
	if (!form.full_name || !form.phone_number || !form.time_zone || !form.board || !form.class) {
		frappeToast.warning(__('Please fill in all required fields.'))
		return
	}

	saving.value = true
	try {
		const res = await call('smart_learning.api.student_api.save_student_profile', {
			full_name: form.full_name,
			phone_number: form.phone_number,
			time_zone: form.time_zone,
			board: form.board,
			class_name: form.class,
			school: form.school || null,
			profile_photo: form.profile_photo || null,
		})
		if (res && res.success) {
			frappeToast.success(res.message)
			profileStore.setExists(true)
			await profileStore.profile.submit()
			await userStore.userResource.submit() // refresh user info to sync profile updates
			router.push({ name: 'Home' })
		} else {
			frappeToast.error(res.error || __('Failed to save student profile.'))
		}
	} catch (e) {
		console.error('Failed to save profile:', e)
		frappeToast.error(e.message || e.error || __('An error occurred while saving.'))
	} finally {
		saving.value = false
	}
}
</script>
