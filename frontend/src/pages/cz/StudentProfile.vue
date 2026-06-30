<template>
	<div>
		<LayoutHeader>
			<template #left-header>
				<Breadcrumbs class="h-7" :items="breadcrumbs" />
			</template>
		</LayoutHeader>

		<div class="mx-auto flex min-h-0 w-full flex-1 flex-col p-6 max-w-4xl">
			<!-- Loading State -->
			<div v-if="profileStore.profile.loading" class="flex justify-center py-20">
				<div class="flex flex-col items-center gap-3">
					<div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
					<p class="text-sm text-ink-gray-5">{{ __('Loading profile...') }}</p>
				</div>
			</div>

			<!-- Empty State: No Profile -->
			<div v-else-if="!profile"
				class="text-center py-16 border border-outline-gray-2 rounded-2xl space-y-5 bg-surface-white shadow-sm max-w-xl mx-auto mt-10">
				<div class="flex flex-col items-center justify-center space-y-3 px-6">
					<div class="p-4 bg-indigo-50 rounded-full text-indigo-600">
						<User class="w-8 h-8 stroke-1.5" />
					</div>
					<h3 class="text-xl font-bold text-ink-gray-9">{{ __('No Student Profile Linked') }}</h3>
					<p class="text-sm text-ink-gray-6 max-w-sm">
						{{ __('Please setup your student profile to configure your academic details and start booking sessions.') }}
					</p>
				</div>
				<router-link :to="{ name: 'StudentProfileCreate' }">
					<Button variant="solid" class="font-semibold text-xs mt-2 !bg-indigo-600 hover:!bg-indigo-500 !text-white rounded-xl px-5 py-2.5">
						{{ __('Create Student Profile') }}
					</Button>
				</router-link>
			</div>

			<!-- Profile Edit/View Section -->
			<div v-else class="space-y-6">
				<!-- Header Card -->
				<div class="bg-surface-white border border-outline-gray-2 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<div class="flex items-center gap-3">
							<h2 class="text-2xl font-bold text-ink-gray-9">{{ form.full_name || __('Student Profile') }}</h2>
							<span class="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
								{{ __('Student') }}
							</span>
						</div>
						<p class="text-sm text-ink-gray-5 mt-1">{{ __('Manage your personal and academic details.') }}</p>
					</div>

					<!-- Edit Mode Toggle Actions -->
					<div class="flex gap-2 shrink-0">
						<template v-if="isReadOnly">
							<Button
								variant="solid"
								class="rounded-xl text-xs font-semibold px-4 py-2 !bg-indigo-600 hover:!bg-indigo-500 !text-white border-none"
								@click="enterEditMode"
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
								class="rounded-xl text-xs font-semibold px-4 py-2"
								@click="cancelEdit"
							>
								{{ __('Cancel') }}
							</Button>
							<Button
								:loading="saving"
								variant="solid"
								class="rounded-xl text-xs font-semibold px-4 py-2 !bg-indigo-600 hover:!bg-indigo-500 !text-white border-none"
								@click="saveProfile"
							>
								{{ __('Save Changes') }}
							</Button>
						</template>
					</div>
				</div>

				<!-- Form Content -->
				<form @submit.prevent="saveProfile" class="grid grid-cols-1 md:grid-cols-3 gap-6">
					
					<!-- Left Details Card (Personal) -->
					<div class="md:col-span-2 space-y-6">
						<div class="bg-surface-white border border-outline-gray-2 rounded-2xl p-6 shadow-sm space-y-5">
							<h3 class="text-lg font-bold text-ink-gray-9 border-b pb-3 flex items-center gap-2">
								<span class="h-5 w-1 bg-indigo-600 rounded-full"></span>
								{{ __('Personal Details') }}
							</h3>

							<div class="space-y-4">
								<div v-if="isReadOnly" class="grid grid-cols-1 sm:grid-cols-2 gap-6">
									<div class="space-y-1">
										<span class="text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Full Name') }}</span>
										<p class="text-base text-ink-gray-9 font-medium">{{ form.full_name }}</p>
									</div>
									<div class="space-y-1">
										<span class="text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Phone Number') }}</span>
										<p class="text-base text-ink-gray-9 font-medium">{{ form.phone_number || __('Not specified') }}</p>
									</div>
									<div class="space-y-1 sm:col-span-2">
										<span class="text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Time Zone') }}</span>
										<p class="text-base text-ink-gray-9 font-medium">{{ form.time_zone }}</p>
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

					<!-- Right Details Card (Academic) -->
					<div class="md:col-span-1 space-y-6">
						<div class="bg-surface-white border border-outline-gray-2 rounded-2xl p-6 shadow-sm space-y-5 h-full">
							<h3 class="text-lg font-bold text-ink-gray-9 border-b pb-3 flex items-center gap-2">
								<span class="h-5 w-1 bg-indigo-600 rounded-full"></span>
								{{ __('Academic Details') }}
							</h3>

							<div class="space-y-4">
								<div v-if="isReadOnly" class="space-y-4">
									<div class="space-y-1">
										<span class="text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Board') }}</span>
										<p class="text-base text-ink-gray-9 font-medium">{{ form.board }}</p>
									</div>
									<div class="space-y-1">
										<span class="text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('Class') }}</span>
										<p class="text-base text-ink-gray-9 font-medium">{{ form.class }}</p>
									</div>
									<div class="space-y-1">
										<span class="text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ __('School') }}</span>
										<p class="text-base text-ink-gray-9 font-medium">{{ form.school || __('Not specified') }}</p>
									</div>
								</div>

								<div v-else class="space-y-4">
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

				</form>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { Breadcrumbs, Button, FormControl, call, toast as frappeToast, usePageMeta } from 'frappe-ui'
import { useStudentProfileStore } from '@/stores/useStudentProfileStore'
import { usersStore } from '@/stores/user'
import { getTimezones } from '@/utils'
import { User, Edit } from 'lucide-vue-next'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'

const profileStore = useStudentProfileStore()
const userStore = usersStore()

const isReadOnly = ref(true)
const saving = ref(false)

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

<style scoped>
select {
	outline: none;
	box-shadow: none;
}
select:focus {
	border-color: #4f46e5 !important;
	background-color: #ffffff !important;
}
</style>
