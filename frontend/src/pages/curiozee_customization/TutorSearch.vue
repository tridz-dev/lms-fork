<template>
	<div>
		<LayoutHeader>
			<template #left-header>
				<Breadcrumbs
					class="h-7"
					:items="breadcrumbs"
				/>
			</template>
		</LayoutHeader>

		<div class="flex min-h-0 w-full flex-1 flex-col p-5 pb-10">
			<div class="space-y-6">
				<div class="border-b pb-4">
					<h2 class="text-2xl font-semibold text-ink-gray-9">
						{{ __('Explore Our Tutors') }}
					</h2>
					<p class="text-sm text-ink-gray-5 mt-1">
						{{ __('Find the best mentors customized for your curriculum and goals.') }}
					</p>
				</div>

				<!-- Tutor Grid -->
				<div v-if="tutorStore.tutorsList.loading" class="flex justify-center py-20">
					<Spinner class="w-10 h-10 text-gray-400" />
				</div>
				<div v-else-if="tutors && tutors.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					<TutorCard
						v-for="tutor in tutors"
						:key="tutor.name"
						:tutor="tutor"
					/>
				</div>
				<div v-else class="text-center py-20">
					<p class="text-sm text-ink-gray-5">{{ __('No tutors match the criteria or are verified currently.') }}</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed } from 'vue'
import { Breadcrumbs, Spinner } from 'frappe-ui'
import { useTutorStore } from '@/stores/useTutorStore'
import TutorCard from '@/components/curiozee_customization/TutorCard.vue'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'

const tutorStore = useTutorStore()
const tutors = computed(() => tutorStore.tutorsList.data || [])

const breadcrumbs = computed(() => [
	{ label: __('Tutors'), route: { name: 'TutorSearch' } }
])
</script>
