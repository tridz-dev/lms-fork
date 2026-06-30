<template>
	<div class="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-6 text-white font-sans">
		<div class="max-w-md w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden group">
			<!-- Visual accent glow -->
			<div class="absolute -top-24 -left-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl group-hover:bg-red-500/30 transition-all duration-700"></div>
			<div class="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all duration-700"></div>

			<!-- Animated Icon Container -->
			<div class="mx-auto w-24 h-24 bg-gradient-to-tr from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 transform transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
				<!-- SVG Lock Icon -->
				<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
				</svg>
			</div>

			<!-- Title -->
			<h1 class="text-3xl font-extrabold tracking-tight mt-8 bg-gradient-to-r from-red-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
				403 Forbidden
			</h1>

			<!-- Subtitle -->
			<p class="text-slate-300 font-medium text-lg mt-3">
				{{ __('Not Permitted') }}
			</p>

			<!-- Explanation -->
			<p class="text-slate-400 text-sm mt-2 px-2 leading-relaxed">
				{{ __('You do not have permission to access this page. This area is reserved for authenticated Tutors.') }}
			</p>

			<!-- Action Buttons -->
			<div class="mt-8 space-y-3">
				<router-link :to="{ name: 'Courses' }">
					<Button variant="solid" class="w-full justify-center !py-3 !rounded-xl !bg-gradient-to-r !from-indigo-600 !to-blue-600 hover:!from-indigo-500 hover:!to-blue-500 !text-white !font-semibold !border-none transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30">
						{{ __('Explore Courses') }}
					</Button>
				</router-link>

				<router-link :to="{ name: 'Sessions' }">
					<Button variant="outline" class="w-full justify-center !py-3 !rounded-xl !border-slate-600 hover:!border-slate-500 !text-slate-300 hover:!text-white hover:!bg-slate-700/30 transition-all duration-300">
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
