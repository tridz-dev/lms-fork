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
					<div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
					<p class="text-sm text-ink-gray-5">{{ __('Loading profile...') }}</p>
				</div>
			</div>

			<!-- Empty State: No Profile -->
			<div v-else-if="!profile" class="p-5">
				<div class="text-center py-16 border border-outline-gray-2 rounded-md space-y-5 bg-surface-white max-w-xl mx-auto mt-10">
					<div class="flex flex-col items-center justify-center space-y-3 px-6">
						<div class="p-4 bg-surface-gray-2 rounded-full text-ink-gray-7">
							<User class="w-8 h-8 stroke-1.5" />
						</div>
						<h3 class="text-xl font-semibold text-ink-gray-9">{{ __('No Student Profile Linked') }}</h3>
						<p class="text-sm text-ink-gray-6 max-w-sm">
							{{ __('Please setup your student profile to configure your academic details and start booking sessions.') }}
						</p>
					</div>
					<router-link :to="{ name: 'StudentProfileCreate' }">
						<Button variant="solid" size="md" class="mt-2">
							{{ __('Create Student Profile') }}
						</Button>
					</router-link>
				</div>
			</div>

			<!-- Profile Edit/View Section -->
			<div v-else>
				<!-- Banner Cover Image -->
				<div class="group relative h-[130px] w-full">
					<img
						v-if="$user?.data?.cover_image"
						:src="$user.data.cover_image"
						class="h-[130px] w-full object-cover object-center"
					/>
					<div
						v-else
						class="h-[130px] w-full bg-surface-gray-2"
					></div>
				</div>

				<!-- Main Layout Container -->
				<div class="mx-auto -mt-10 md:-mt-4 max-w-4xl w-full px-5">
					<div class="flex flex-col md:flex-row items-center justify-between pb-5">
						<div class="flex flex-col md:flex-row items-center">
							<div>
								<div class="relative">
									<img
										v-if="form.profile_photo || profile?.profile_photo || $user?.data?.user_image"
										:src="form.profile_photo || profile?.profile_photo || $user?.data?.user_image"
										class="object-cover h-[100px] w-[100px] rounded-full border-4 border-white"
									/>
									<div
										v-else
										class="flex items-center justify-center h-[100px] w-[100px] rounded-full border-4 border-white bg-surface-gray-2 text-3xl font-semibold text-ink-gray-7"
									>
										{{ (form.full_name || $user?.data?.full_name || 'S').charAt(0).toUpperCase() }}
									</div>
								</div>
							</div>
							<div class="ms-6 mt-5 text-center md:text-left">
								<div class="flex items-center gap-3 justify-center md:justify-start">
									<h2 class="text-3xl font-semibold text-ink-gray-9">
										{{ form.full_name || __('Student Profile') }}
									</h2>
									<Badge theme="blue" size="sm" :label="__('Student')" />
								</div>
								<p class="text-sm text-ink-gray-5 mt-1">
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
								>
									<template #prefix>
										<Edit class="w-3.5 h-3.5 text-ink-white" />
									</template>
									{{ __('Edit Profile') }}
								</Button>
							</template>
							<template v-else>
								<Button
									variant="outline"
									@click="cancelEdit"
								>
									{{ __('Cancel') }}
								</Button>
								<Button
									:loading="saving"
									variant="solid"
									@click="saveProfile"
								>
									{{ __('Save Changes') }}
								</Button>
							</template>
						</div>
					</div>

					<!-- Tabs Navigation -->
					<div class="mb-4 mt-10">
						<TabButtons class="inline-block" :buttons="profileTabs" v-model="activeTab" />
					</div>

					<!-- Form Content -->
					<form @submit.prevent="saveProfile" class="space-y-6 max-w-2xl mt-6">
						<!-- TAB: Personal Details -->
						<div v-if="activeTab === 'personal'" class="space-y-6">
							<Uploader
								v-if="!isReadOnly"
								v-model="form.profile_photo"
								:label="__('Profile Photo')"
								:required="false"
								shape="circle"
							/>
							
							<div class="bg-surface-white p-5 space-y-5">
								<h3 class="text-lg font-semibold text-ink-gray-9 border-b pb-3">
									{{ __('Personal Details') }}
								</h3>

								<div class="space-y-4">
									<div v-if="isReadOnly" class="grid grid-cols-1 sm:grid-cols-2 gap-6">
										<div class="space-y-1">
											<span class="text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Full Name') }}</span>
											<p class="text-base text-ink-gray-9 font-small">{{ form.full_name }}</p>
										</div>
										<div class="space-y-1">
											<span class="text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Phone Number') }}</span>
											<p class="text-base text-ink-gray-9 font-small">{{ form.phone_number || __('Not specified') }}</p>
										</div>
										<div class="space-y-1 sm:col-span-2">
											<span class="text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Time Zone') }}</span>
											<p class="text-base text-ink-gray-9 font-small">{{ form.time_zone }}</p>
										</div>
									</div>
									
									<div v-else class="space-y-4">
										<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<FormControl
												v-model="form.full_name"
												type="text"
												:label="__('Full Name')"
												:required="true"
											/>
											<FormControl
												v-model="form.phone_number"
												type="text"
												:label="__('Phone Number')"
												:required="true"
											/>
										</div>
										<FormControl
											v-model="form.time_zone"
											type="select"
											:options="tzOptions"
											:label="__('Timezone')"
											:required="true"
										/>
									</div>
								</div>
							</div>
						</div>

						<!-- TAB: Academic Details -->
						<div v-if="activeTab === 'academic'" class="space-y-6">
							<div class="bg-surface-white p-5 space-y-5">
								<h3 class="text-lg font-semibold text-ink-gray-9 border-b pb-3">
									{{ __('Academic Details') }}
								</h3>

								<div class="space-y-4">
									<div v-if="isReadOnly" class="grid grid-cols-1 sm:grid-cols-2 gap-6">
										<div class="space-y-1">
											<span class="text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Board') }}</span>
											<p class="text-base text-ink-gray-9 font-small">{{ form.board }}</p>
										</div>
										<div class="space-y-1">
											<span class="text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Class') }}</span>
											<p class="text-base text-ink-gray-9 font-small">{{ form.class }}</p>
										</div>
										<div class="space-y-1">
											<span class="text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('School') }}</span>
											<p class="text-base text-ink-gray-9 font-small">{{ form.school || __('Not specified') }}</p>
										</div>
									</div>

									<div v-else class="space-y-4">
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
											<FormControl
												v-model="form.school"
												type="text"
												:label="__('School')"
												placeholder="e.g. Lincoln High School"
											/>
										</div>
									</div>
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
import { Breadcrumbs, Button, FormControl, TabButtons, Badge, call, toast as frappeToast, usePageMeta } from 'frappe-ui'
import { useStudentProfileStore } from '@/stores/useStudentProfileStore'
import { usersStore } from '@/stores/user'
import { getTimezones } from '@/utils'
import { User, Edit } from 'lucide-vue-next'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'
import Uploader from '@/components/Controls/Uploader.vue'

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
