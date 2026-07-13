<template>
	<div>
		<LayoutHeader>
			<template #left-header>
				<Breadcrumbs class="h-7" :items="breadcrumbs" />
			</template>
		</LayoutHeader>

		<div class="flex min-h-0 w-full flex-1 flex-col pb-10">
			<!-- Loading State -->
			<div v-if="profileStore.profile.loading" class="flex justify-center py-20">
				<div class="flex flex-col items-center gap-3">
					<LoadingIndicator class="w-8 h-8 text-ink-gray-5" />
					<p class="text-sm text-ink-gray-5">{{ __('Loading profile...') }}</p>
				</div>
			</div>

			<!-- Empty State: No Profile -->
			<div v-else-if="!profile" class="p-5">
				<div class="text-center py-20 border border-outline-gray-2 rounded-md space-y-4 bg-surface-white">
					<div class="flex flex-col items-center justify-center space-y-2">
						<div class="p-3 bg-surface-gray-2 rounded-full">
							<User class="w-8 h-8 text-ink-gray-5 stroke-1.5" />
						</div>
						<h3 class="text-lg font-medium text-ink-gray-9">{{ __('No Student Profile Linked') }}</h3>
						<p class="text-sm text-ink-gray-7 max-w-sm">
							{{ __('Please setup your student profile to configure your academic details and start booking sessions.') }}
						</p>
					</div>
					<router-link :to="{ name: 'StudentProfileCreate' }" custom v-slot="{ navigate }">
						<Button variant="solid" @click="navigate" class="mt-2">
							{{ __('Create Student Profile') }}
						</Button>
					</router-link>
				</div>
			</div>

			<!-- Profile Edit/View Section -->
			<div v-else>
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
					<div class="flex flex-col md:flex-row items-center justify-between pb-5">
						<div class="flex flex-col md:flex-row items-center">
							<div>
								<div class="relative">
									<FileUploader
										v-if="!isReadOnly"
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
													v-if="form.profile_photo || profile?.profile_photo || $user?.data?.user_image"
													:src="form.profile_photo || profile?.profile_photo || $user?.data?.user_image"
													class="object-cover h-[100px] w-[100px] rounded-full border-4 border-white shadow-sm"
												/>
												<div
													v-else
													class="flex items-center justify-center h-[100px] w-[100px] rounded-full border-4 border-white bg-surface-gray-2 text-3xl font-semibold text-ink-gray-7 shadow-sm"
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
									<div v-else>
										<img
											v-if="form.profile_photo || profile?.profile_photo || $user?.data?.user_image"
											:src="form.profile_photo || profile?.profile_photo || $user?.data?.user_image"
											class="object-cover h-[100px] w-[100px] rounded-full border-4 border-white shadow-sm"
										/>
										<div
											v-else
											class="flex items-center justify-center h-[100px] w-[100px] rounded-full border-4 border-white bg-surface-gray-2 text-3xl font-semibold text-ink-gray-7 shadow-sm"
										>
											{{ (form.full_name || $user?.data?.full_name || 'S').charAt(0).toUpperCase() }}
										</div>
									</div>
								</div>
							</div>
							<div class="ms-5 mt-5 flex-1">
								<div class="flex items-center gap-3">
									<h2 class="text-2xl font-semibold text-ink-gray-9">
										{{ form.full_name || __('Student Profile') }}
									</h2>
									<Badge
										theme="gray"
										size="md"
										:label="__('Student')"
									/>
								</div>
								<p class="text-sm font-normal text-ink-gray-5 mt-1.5">
									{{ __('Manage your personal and academic details.') }}
								</p>
							</div>
						</div>

						<!-- Edit Mode Toggle Actions -->
						<div class="flex gap-2 shrink-0 mt-5 md:mt-0">
							<template v-if="isReadOnly">
								<Button
									variant="solid"
									@click="enterEditMode"
									class="h-9 px-5 rounded-lg font-semibold"
								>
									<template #prefix>
										<Edit class="w-3.5 h-3.5" />
									</template>
									{{ __('Edit Profile') }}
								</Button>
							</template>
							<template v-else>
								<Button
									variant="outline"
									@click="cancelEdit"
									class="h-9 px-5 rounded-lg font-semibold"
								>
									{{ __('Cancel') }}
								</Button>
								<Button
									:loading="saving"
									variant="solid"
									@click="saveProfile"
									class="h-9 px-5 rounded-lg font-semibold"
								>
									{{ __('Save Changes') }}
								</Button>
							</template>
						</div>
					</div>

					<!-- Tabs Navigation -->
					<div class="mt-6 mb-8">
						<TabButtons
							v-model="activeTab"
							:buttons="profileTabs"
						/>
					</div>

					<!-- Form Content -->
					<form @submit.prevent="saveProfile" class="space-y-8 max-w-2xl">
						<!-- TAB: Personal Details -->
						<div v-if="activeTab === 'personal'" class="space-y-8">
							<div class="space-y-4">
								<div class="space-y-4 pt-4">
									<FormControl
										v-model="form.full_name"
										type="text"
										:label="__('Full Name')"
										:required="!isReadOnly"
										:disabled="isReadOnly"
										placeholder="e.g. Jane Doe"
									/>
									<FormControl
										v-model="form.phone_number"
										type="text"
										:label="__('Phone Number')"
										:required="!isReadOnly"
										:disabled="isReadOnly"
										placeholder="e.g. +1 555-0199"
									/>
									<FormControl
										v-model="form.time_zone"
										:type="isReadOnly ? 'text' : 'select'"
										:options="tzOptions"
										:label="__('Timezone')"
										:required="!isReadOnly"
										:disabled="isReadOnly"
									/>
								</div>
							</div>
						</div>

						<!-- TAB: Academic Details -->
						<div v-if="activeTab === 'academic'" class="space-y-8">
							<div class="space-y-4">
								<div class="space-y-4 pt-4">
									<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<FormControl
											v-model="form.board"
											type="text"
											:label="__('Board')"
											:required="!isReadOnly"
											:disabled="isReadOnly"
											placeholder="e.g. CBSE"
										/>
										<FormControl
											v-model="form.class"
											type="text"
											:label="__('Class')"
											:required="!isReadOnly"
											:disabled="isReadOnly"
											placeholder="e.g. Class 10"
										/>
									</div>
									<FormControl
										v-model="form.school"
										type="text"
										:label="__('School')"
										:disabled="isReadOnly"
										placeholder="e.g. Lincoln High School"
									/>
								</div>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, inject, reactive, ref, onMounted } from 'vue'
import { Breadcrumbs, Button, FormControl, TabButtons, Badge, FileUploader, call, toast as frappeToast, usePageMeta, LoadingIndicator } from 'frappe-ui'
import { useStudentProfileStore } from '@/stores/useStudentProfileStore'
import { usersStore } from '@/stores/user'
import { getTimezones, validateFile } from '@/utils'
import { User, Edit, Camera } from 'lucide-vue-next'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'

const profileStore = useStudentProfileStore()
const userStore = usersStore()
const $user = inject('$user')

const isReadOnly = ref(true)
const saving = ref(false)
const activeTab = ref('personal')

const profileTabs = [
	{ value: 'personal', label: __('Personal Details') },
	{ value: 'academic', label: __('Academic Details') }
]

usePageMeta(() => {
	return {
		title: __('Student Profile - Curiozee'),
	}
})

const breadcrumbs = computed(() => [
	{ label: __('Student Profile'), route: { name: 'StudentProfile' } }
])

const timezoneOptions = getTimezones()
const tzOptions = computed(() => timezoneOptions.map(tz => ({ label: tz, value: tz })))

const profile = computed(() => profileStore.profile.data)

const form = reactive({
	full_name: '',
	phone_number: '',
	time_zone: '',
	board: '',
	class: '',
	school: '',
	profile_photo: '',
})

onMounted(async () => {
	try {
		await profileStore.profile.submit()
		resetForm()
	} catch (e) {
		console.error('Failed to load student profile details:', e)
	}
})

function resetForm() {
	if (profile.value) {
		form.full_name = profile.value.full_name || ''
		form.phone_number = profile.value.phone_number || ''
		form.time_zone = profile.value.time_zone || ''
		form.board = profile.value.board || ''
		form.class = profile.value.class || ''
		form.school = profile.value.school || ''
		form.profile_photo = profile.value.profile_photo || ''
	}
}

function enterEditMode() {
	isReadOnly.value = false
}

function cancelEdit() {
	resetForm()
	isReadOnly.value = true
}

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
			await profileStore.profile.submit()
			await userStore.userResource.submit() // sync user store state changes
			isReadOnly.value = true
		} else {
			frappeToast.error(res.error || __('Failed to update profile.'))
		}
	} catch (e) {
		console.error('Failed to save student profile:', e)
		frappeToast.error(e.message || e.error || __('An error occurred while saving.'))
	} finally {
		saving.value = false
	}
}
</script>
