<template>
	<!-- Booking flow when a tutor is selected via ?tutor= query param -->
	<div v-if="tutorName">
		<LayoutHeader>
			<template #left-header>
				<Breadcrumbs :items="breadcrumbItems" />
			</template>
		</LayoutHeader>

		<div class="flex min-h-0 w-full flex-1 flex-col pb-10">
			<!-- Loading State (Skeleton) -->
			<div v-if="tutorDetails.loading" class="w-full">
				<!-- Banner Cover Skeleton -->
				<div class="h-20 w-full bg-surface-gray-2 animate-pulse"></div>
				<!-- Content Skeleton -->
				<div class="mx-auto -mt-8 max-w-6xl w-full px-5 space-y-8 animate-pulse">
					<div class="flex flex-col md:flex-row justify-between items-center gap-6">
						<div class="flex flex-col md:flex-row items-center">
							<div class="h-[100px] w-[100px] rounded-full bg-surface-gray-3 border-4 border-white shrink-0 shadow-sm"></div>
							<div class="text-center md:text-left md:ms-6 mt-5 md:mt-0 space-y-3">
								<div class="h-6 w-48 rounded bg-surface-gray-3 mx-auto md:mx-0"></div>
								<div class="h-4 w-64 rounded bg-surface-gray-2 mx-auto md:mx-0"></div>
							</div>
						</div>
						<div class="h-16 w-32 rounded bg-surface-gray-3 shrink-0 shadow-sm"></div>
					</div>

					<!-- Bio Skeleton -->
					<div class="border border-outline-gray-2 rounded-xl p-6 bg-surface-white space-y-4">
						<div class="h-4 w-24 rounded bg-surface-gray-3"></div>
						<div class="space-y-2">
							<div class="h-3 w-full rounded bg-surface-gray-2"></div>
							<div class="h-3 w-11/12 rounded bg-surface-gray-2"></div>
							<div class="h-3 w-4/5 rounded bg-surface-gray-2"></div>
						</div>
					</div>

					<!-- Tags Skeleton -->
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div v-for="i in 3" :key="i" class="border border-outline-gray-2 rounded-xl p-5 bg-surface-white space-y-3">
							<div class="h-3 w-20 rounded bg-surface-gray-3"></div>
							<div class="flex flex-wrap gap-1.5 pt-1">
								<div class="h-6 w-16 rounded bg-surface-gray-2"></div>
								<div class="h-6 w-20 rounded bg-surface-gray-2"></div>
								<div class="h-6 w-14 rounded bg-surface-gray-2"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<div v-else-if="tutorDetails.data">
				<BookingFlow :tutor="tutorDetails.data" />
			</div>
			
			<div v-else class="p-5">
				<EmptyStateLayout
					name="Tutor"
					:title="__('Failed to load tutor details')"
					:description="__('Please go back and select a tutor.')"
				/>
			</div>
		</div>
	</div>

	<!-- Tutor discovery listing when no tutor is selected -->
	<div v-else>
		<LayoutHeader>
			<template #left-header>
				<Breadcrumbs :items="breadcrumbItems" />
			</template>

			<template #right-header>
				<!-- Desktop Layout: inline filter bar (visible on large screens and larger) -->
				<div class="hidden xl:flex items-center gap-2 flex-wrap">
					<FormControl
						v-model="localFilters.tutor"
						:placeholder="__('Search by Tutor')"
						type="text"
						class="min-w-36"
					/>
					<Select
						v-model="localFilters.subject"
						:options="subjectOptions"
						:placeholder="__('Subject')"
						class="min-w-28"
					/>
					<Select
						v-model="localFilters.class_name"
						:options="classOptions"
						:placeholder="__('Class')"
						class="min-w-28"
					/>
					<Select
						v-model="localFilters.board"
						:options="boardOptions"
						:placeholder="__('Board')"
						class="min-w-28"
					/>
					<Button variant="solid" @click="onSearch">
						<template #prefix>
							<Search class="size-4 stroke-1.5" />
						</template>
						{{ __('Search') }}
					</Button>
					<Button
						v-if="hasActiveFilters"
						variant="ghost"
						@click="clearFilters"
					>
						{{ __('Clear') }}
					</Button>
				</div>

				<!-- Mobile Layout: Collapsible Popover filter bar (visible on small/medium screens) -->
				<div class="flex xl:hidden items-center gap-2">
					<Popover placement="bottom-end">
						<template #target="{ togglePopover }">
							<Button @click="togglePopover" variant="outline">
								<template #prefix>
									<Filter class="size-4 stroke-1.5" />
								</template>
								{{ __('Filters') }}
								<span v-if="hasActiveFilters" class="ml-1.5 size-2 rounded-full bg-blue-500"></span>
							</Button>
						</template>
						<template #body="{ close }">
							<div class="p-4 w-72 space-y-3 bg-surface-white border rounded-lg shadow-xl mt-2">
								<h4 class="font-semibold text-sm text-ink-gray-9 mb-1">{{ __('Filter Tutors') }}</h4>
								<FormControl
									v-model="localFilters.tutor"
									:placeholder="__('Search by Tutor')"
									type="text"
								/>
								<Select
									v-model="localFilters.subject"
									:options="subjectOptions"
									:placeholder="__('Subject')"
								/>
								<Select
									v-model="localFilters.class_name"
									:options="classOptions"
									:placeholder="__('Class')"
								/>
								<Select
									v-model="localFilters.board"
									:options="boardOptions"
									:placeholder="__('Board')"
								/>
								<div class="flex gap-2 pt-2 border-t">
									<Button variant="solid" class="w-full" @click="() => { onSearch(); close(); }">
										{{ __('Apply') }}
									</Button>
									<Button
										v-if="hasActiveFilters"
										variant="ghost"
										theme="red"
										class="w-full"
										@click="() => { clearFilters(); close(); }"
									>
										{{ __('Clear') }}
									</Button>
								</div>
							</div>
						</template>
					</Popover>
				</div>
			</template>
		</LayoutHeader>

		<div class="flex min-h-0 w-full flex-1 flex-col p-5 pb-10">

			<!-- ── Recommended Tutors For You ───────────────────────────────── -->
			<div v-if="!hasActiveFilters" class="mb-8">
				<div class="mb-4 border-b pb-4">
					<h2 class="text-2xl font-semibold text-ink-gray-9">
						{{ __('Recommended Tutors For You') }}
					</h2>
					<p class="text-sm text-ink-gray-5 mt-1">
						{{ __('Matched based on your learning activity, weak subjects, and availability.') }}
					</p>
				</div>

				<!-- Skeleton -->
				<div
					v-if="recommendedTutors.loading"
					class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
				>
					<div
						v-for="i in 3"
						:key="i"
						class="border rounded-md bg-surface-white p-4 space-y-4 animate-pulse"
					>
						<div class="flex justify-between border-b pb-3">
							<div class="space-y-2">
								<div class="h-4 w-32 rounded bg-surface-gray-3"></div>
								<div class="h-3 w-20 rounded bg-surface-gray-2"></div>
							</div>
							<div class="h-5 w-10 rounded bg-surface-gray-2"></div>
						</div>
						<div class="space-y-1.5">
							<div class="h-3 w-full rounded bg-surface-gray-2"></div>
							<div class="h-3 w-4/5 rounded bg-surface-gray-2"></div>
						</div>
						<div class="flex gap-1.5 pt-3 border-t">
							<div class="h-5 w-14 rounded bg-surface-gray-2"></div>
							<div class="h-5 w-16 rounded bg-surface-gray-3"></div>
						</div>
						<div class="flex justify-between pt-3 border-t mt-auto">
							<div class="h-4 w-20 rounded bg-surface-gray-3"></div>
							<div class="h-7 w-16 rounded bg-surface-gray-3"></div>
						</div>
					</div>
				</div>

				<!-- Recommended grid -->
				<div
					v-else-if="recommendedTutorsList.length"
					class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
				>
					<TutorCard
						v-for="tutor in recommendedTutorsList"
						:key="tutor.name"
						:tutor="tutor"
					/>
				</div>

				<!-- No recommendations yet -->
				<p v-else class="text-sm text-ink-gray-5 pb-2">
					{{ __('No personalised recommendations yet — browse all tutors below.') }}
				</p>
			</div>

			<!-- ── All Tutors ────────────────────────────────────────────────── -->
			<div class="mb-5 border-b pb-4">
				<h2 class="text-2xl font-semibold text-ink-gray-9">{{ __('All Tutors') }}</h2>
				<p class="text-sm text-ink-gray-5 mt-1">
					{{ __('Find the best mentors customized for your curriculum and goals.') }}
				</p>
			</div>

			<!-- Skeleton while loading -->
			<div
				v-if="tutorsList.loading"
				class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
			>
				<div
					v-for="i in 8"
					:key="i"
					class="border rounded-md bg-surface-white p-4 space-y-4 animate-pulse"
				>
					<div class="flex justify-between border-b pb-3">
						<div class="space-y-2">
							<div class="h-4 w-32 rounded bg-surface-gray-3"></div>
							<div class="h-3 w-20 rounded bg-surface-gray-2"></div>
						</div>
						<div class="h-3 w-16 rounded bg-surface-gray-2 mt-1"></div>
					</div>
					<div class="space-y-1.5">
						<div class="h-3 w-full rounded bg-surface-gray-2"></div>
						<div class="h-3 w-5/6 rounded bg-surface-gray-2"></div>
					</div>
					<div class="flex gap-1.5 pt-3 border-t">
						<div class="h-5 w-14 rounded bg-surface-gray-2"></div>
						<div class="h-5 w-16 rounded bg-surface-gray-3"></div>
					</div>
					<div class="flex justify-between pt-3 border-t mt-auto">
						<div class="h-4 w-20 rounded bg-surface-gray-3"></div>
						<div class="h-7 w-16 rounded bg-surface-gray-3"></div>
					</div>
				</div>
			</div>

			<!-- Tutor grid -->
			<div
				v-else-if="allTutors.length"
				class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
			>
				<TutorCard
					v-for="tutor in allTutors"
					:key="tutor.name"
					:tutor="tutor"
				/>
			</div>

			<!-- Empty state exactly as LMS pattern -->
			<EmptyStateLayout
				v-else
				name="Tutors"
				:title="__('No Tutors Found')"
				:description="__('Try changing the filters to find tutors.')"
			/>

			<!-- Load More -->
			<div
				v-if="!tutorsList.loading && hasMore"
				class="mt-5 flex justify-center"
			>
				<Button @click="loadMore">
					{{ __('Load More') }}
				</Button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
	Breadcrumbs,
	Button,
	FormControl,
	Spinner,
	Popover,
	Select,
	createResource,
	usePageMeta,
} from 'frappe-ui'
import { Filter, Search } from 'lucide-vue-next'
import LayoutHeader from '@/components/Layouts/LayoutHeader.vue'
import EmptyStateLayout from '@/components/Layouts/EmptyStateLayout.vue'
import TutorCard from '@/components/curiozee_customization/TutorCard.vue'
import BookingFlow from '@/components/curiozee_customization/BookingFlow.vue'
import {
	filterState,
	tutorsList,
	subjectsList,
	boardsList,
	classesList,
} from '@/resources/bookTutor'

import { sessionStore } from '@/stores/session'
const route = useRoute()
const session = sessionStore()

// ── Breadcrumbs ────────────────────────────────────────────────────────────
const tutorName = computed(() => route.query.tutor)

const breadcrumbItems = computed(() => {
	const items = [{ label: __('Book a Tutor'), route: { name: 'BookSession' } }]
	if (tutorName.value && tutorDetails.data) {
		items.push({
			label: tutorDetails.data.tutor_name,
			route: { name: 'BookSession', query: { tutor: tutorName.value } },
		})
	}
	return items
})

// ── Tutor detail resource (booking flow) ───────────────────────────────────
const tutorDetails = createResource({
	url: 'smart_learning.api.tutor_api.get_tutor_profile',
	makeParams() {
		return { tutor_name: tutorName.value }
	},
})

watch(
	tutorName,
	(v) => { if (v) tutorDetails.submit() },
	{ immediate: true }
)

// ── Recommended Tutors ────────────────────────────────────────────────────
// Reuses the existing tutor_matching_service via get_recommended_tutors API.
// No duplicate logic — the same scoring engine and ranking used by the
// student_api.get_student_dashboard_summary is called here directly.
const recommendedTutors = createResource({
	url: 'smart_learning.api.student_api.get_recommended_tutors',
	params: { limit: 4 },
})

const recommendedTutorsList = computed(() =>
	recommendedTutors.data?.success ? (recommendedTutors.data.data?.tutors || []) : []
)

// ── Inline filter state (local, committed on Search click) ─────────────────
const localFilters = reactive({
	tutor: filterState.tutor,
	subject: filterState.subject,
	class_name: filterState.class_name,
	board: filterState.board,
})

const hasActiveFilters = computed(() =>
	!!(localFilters.tutor || localFilters.subject || localFilters.class_name || localFilters.board)
)

// ── Select option helpers ──────────────────────────────────────────────────
function toOptions(data, emptyLabel) {
	const base = [{ label: emptyLabel, value: '' }]
	if (!data) return base
	return base.concat(data.map((o) => ({ label: o.label, value: o.value })))
}

const subjectOptions = computed(() => toOptions(subjectsList.data, __('Subject')))
const classOptions   = computed(() => toOptions(classesList.data, __('Class')))
const boardOptions   = computed(() => toOptions(boardsList.data, __('Board')))

// ── Search (manual trigger) ────────────────────────────────────────────────
function onSearch() {
	filterState.tutor      = localFilters.tutor
	filterState.subject    = localFilters.subject
	filterState.class_name = localFilters.class_name
	filterState.board      = localFilters.board
	filterState.page       = 1
	allTutors.value = []
	tutorsList.submit()
}

function clearFilters() {
	localFilters.tutor = localFilters.subject = localFilters.class_name = localFilters.board = ''
	onSearch()
}

// ── Tutor list with infinite scroll accumulation ───────────────────────────
const allTutors = ref([])

const hasMore = computed(
	() => !tutorsList.loading && (tutorsList.data?.length ?? 0) === filterState.page_length
)

watch(
	() => tutorsList.data,
	(data) => {
		if (!data) return
		if (filterState.page === 1) {
			allTutors.value = [...data]
		} else {
			const seen = new Set(allTutors.value.map((t) => t.name))
			allTutors.value.push(...data.filter((t) => !seen.has(t.name)))
		}
	}
)

watch(
	() => session.isLoggedIn,
	(loggedIn) => {
		if (loggedIn) {
			recommendedTutors.fetch()
		}
	},
	{ immediate: true }
)

function loadMore() {
	filterState.page += 1
	tutorsList.submit()
}

onMounted(() => {
	if (!allTutors.value.length) tutorsList.submit()
})

usePageMeta(() => ({ title: __('Book a Tutor') }))
</script>
