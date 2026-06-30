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
				<h2 class="text-2xl font-extrabold text-ink-gray-9 tracking-tight">
					{{ __('Create Student Profile') }}
				</h2>
				<p class="text-sm text-ink-gray-5 mt-1">
					{{ __('Fill in your profile details to register as a student on the platform.') }}
				</p>
			</div>

			<!-- Loading state if settings or user info not ready -->
			<div v-if="loading" class="flex items-center justify-center py-20 bg-surface-white border border-outline-gray-2 rounded-2xl shadow-sm">
				<div class="flex flex-col items-center gap-3">
					<div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
					<p class="text-sm text-ink-gray-5 font-medium">{{ __('Loading profile setup...') }}</p>
				</div>
			</div>

			<!-- Form Container -->
			<form v-else @submit.prevent="saveProfile" class="space-y-6">
				<!-- Section 1: Basic Details -->
				<div class="bg-surface-white border border-outline-gray-2 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 space-y-5">
					<h3 class="text-lg font-bold text-ink-gray-9 border-b pb-3 mb-4 flex items-center gap-2">
						<span class="h-5 w-1 bg-indigo-600 rounded-full"></span>
						{{ __('Basic Information') }}
					</h3>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
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
					</div>

					<div class="grid grid-cols-1 gap-5">
						<FormControl
							v-model="form.time_zone"
							type="select"
							:options="tzOptions"
							:label="__('Timezone')"
							:required="true"
						/>
					</div>
				</div>

				<!-- Section 2: Academic Details -->
				<div class="bg-surface-white border border-outline-gray-2 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 space-y-5">
					<h3 class="text-lg font-bold text-ink-gray-9 border-b pb-3 mb-4 flex items-center gap-2">
						<span class="h-5 w-1 bg-indigo-600 rounded-full"></span>
						{{ __('Academic Profile') }}
					</h3>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
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

					<div class="grid grid-cols-1 gap-5">
						<FormControl
							v-model="form.school"
							type="text"
							:label="__('School (Optional)')"
							placeholder="e.g. Lincoln High School"
						/>
					</div>
				</div>

				<!-- Form Actions -->
				<div class="flex justify-end gap-4 pt-6 border-t border-outline-gray-2">
					<Button
						:loading="saving"
						variant="solid"
						type="submit"
						class="rounded-xl text-sm font-semibold px-8 py-3.5 !bg-gradient-to-r !from-indigo-600 !to-blue-600 hover:!from-indigo-500 hover:!to-blue-500 !text-white !border-none transition-all duration-300 shadow-md hover:shadow-lg"
					>
						{{ __('Complete Setup') }}
					</Button>
				</div>
			</form>
		</div>
	</div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Breadcrumbs, Button, FormControl, call, toast as frappeToast, usePageMeta } from 'frappe-ui'
import { useStudentProfileStore } from '@/stores/useStudentProfileStore'
import { usersStore } from '@/stores/user'
import { getTimezones } from '@/utils'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'

const router = useRouter()
const profileStore = useStudentProfileStore()
const userStore = usersStore()

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
