<template>
	<div class="min-h-screen flex items-center justify-center p-6 bg-surface-gray-2">
		<div class="max-w-md w-full bg-surface-white border border-outline-gray-2 rounded-md p-8 text-center space-y-6">
			<!-- Icon Container -->
			<div class="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
				<!-- SVG Lock Icon -->
				<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
				</svg>
			</div>

			<!-- Typography -->
			<div>
				<h1 class="text-2xl font-semibold text-ink-gray-9">
					403 Forbidden
				</h1>
				<p class="text-ink-gray-5 text-sm mt-1">
					{{ __('You do not have permission to access this page. This area is reserved for authenticated Tutors.') }}
				</p>
			</div>

			<!-- Action Buttons -->
			<div class="flex flex-col gap-2">
				<router-link :to="{ name: 'Courses' }">
					<Button variant="solid" class="w-full justify-center">
						{{ __('Explore Courses') }}
					</Button>
				</router-link>

				<router-link :to="{ name: 'Sessions' }">
					<Button variant="outline" class="w-full justify-center">
						{{ __('My Sessions') }}
					</Button>
				</router-link>
			</div>
		</div>
	</div>
</template>

<script setup>
import { Button, usePageMeta } from 'frappe-ui'
import { sessionStore } from '@/stores/session'

const { brand } = sessionStore()

usePageMeta(() => {
	return {
		title: __('Forbidden - Curiozee'),
		icon: brand.favicon,
	}
})
</script>
