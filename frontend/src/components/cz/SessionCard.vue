<template>
	<div
		@click="showDetails = true"
		class="flex flex-col border rounded-md p-4 bg-surface-white hover:border-outline-gray-3 transition-colors cursor-pointer"
	>
		<div class="flex items-start justify-between pb-3 border-b">
			<div>
				<h4 class="font-bold text-base text-ink-gray-9">
					{{ session.tutor }}
				</h4>
				<p class="text-xs text-ink-gray-5 mt-1.5 flex items-center">
					<span class="font-semibold text-ink-gray-4 mr-1.5 uppercase tracking-wider text-[10px]">{{ __('SLOT') }}:</span>
					{{ formatSlotTime(session.start_datetime, session.end_datetime) }}
				</p>
			</div>
			<div class="flex items-center">
				<Badge
					:label="session.booking_status"
					:theme="statusTheme"
					size="sm"
				/>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4 text-xs py-4 border-b">
			<div>
				<span class="text-ink-gray-4 block mb-0.5 uppercase tracking-wider text-[10px]">{{ __('Amount') }}</span>
				<span class="font-bold text-ink-gray-8">{{ session.amount }} {{ session.currency }}</span>
			</div>
			<div>
				<span class="text-ink-gray-4 block mb-0.5 uppercase tracking-wider text-[10px]">{{ __('Payment') }}</span>
				<span class="font-bold text-ink-gray-8">{{ session.payment_status }}</span>
			</div>
		</div>

		<div class="flex items-center justify-between pt-3">
			<!-- Meeting Link -->
			<div v-if="session.booking_status === 'Confirmed' && session.meeting_link">
				<a
					@click.stop
					:href="session.meeting_link"
					target="_blank"
					class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
				>
					<Video class="w-3.5 h-3.5" />
					{{ __('Join Meeting') }}
				</a>
			</div>
			<div v-else-if="session.booking_status === 'Confirmed'">
				<span class="text-xs text-ink-gray-5 italic">
					{{ __('Generating meeting link...') }}
				</span>
			</div>
			<div v-else-if="session.booking_status === 'Pending Payment'">
				<Button
					@click.stop="$emit('retryPayment', session.name)"
					variant="solid"
					class="text-xs px-4 py-2"
				>
					{{ __('Pay Now') }}
				</Button>
			</div>
			<div v-else>
				<span class="text-xs text-ink-gray-4 uppercase tracking-wider text-[10px]">{{ __('No Active Meeting') }}</span>
			</div>
		</div>

		<!-- Booking Details Dialog -->
		<Dialog
			v-model="showDetails"
			:options="{
				title: __('Booking Details'),
				size: 'md',
			}"
		>
			<template #body-content>
				<div class="space-y-4 text-sm text-ink-gray-7 p-1">
					<!-- Tutor and Status Header -->
					<div class="flex justify-between items-start border-b pb-3">
						<div>
							<h4 class="font-bold text-base text-ink-gray-9">{{ session.tutor }}</h4>
							<p class="text-xs text-ink-gray-4 mt-0.5">ID: {{ session.name }}</p>
						</div>
						<Badge
							:label="session.booking_status"
							:theme="statusTheme"
							size="sm"
						/>
					</div>

					<!-- Details Grid -->
					<div class="grid grid-cols-2 gap-4 py-2">
						<div class="col-span-2">
							<span class="text-xs font-semibold text-ink-gray-4 uppercase tracking-wider block mb-0.5">{{ __('Date & Time') }}</span>
							<span class="font-medium text-ink-gray-9 block leading-relaxed">
								{{ formatSlotTime(session.start_datetime, session.end_datetime) }}
							</span>
						</div>
						<div>
							<span class="text-xs font-semibold text-ink-gray-4 uppercase tracking-wider block mb-0.5">{{ __('Subject') }}</span>
							<span class="font-medium text-ink-gray-9 block">{{ session.subject || 'N/A' }}</span>
						</div>
						<div>
							<span class="text-xs font-semibold text-ink-gray-4 uppercase tracking-wider block mb-0.5">{{ __('Board') }}</span>
							<span class="font-medium text-ink-gray-9 block">{{ session.board || 'N/A' }}</span>
						</div>
						<div>
							<span class="text-xs font-semibold text-ink-gray-4 uppercase tracking-wider block mb-0.5">{{ __('Class') }}</span>
							<span class="font-medium text-ink-gray-9 block">{{ session.class || 'N/A' }}</span>
						</div>
						<div>
							<span class="text-xs font-semibold text-ink-gray-4 uppercase tracking-wider block mb-0.5">{{ __('Amount Paid') }}</span>
							<span class="font-medium text-ink-gray-9 block">{{ session.amount }} {{ session.currency }}</span>
						</div>
						<div class="col-span-2">
							<span class="text-xs font-semibold text-ink-gray-4 uppercase tracking-wider block mb-0.5">{{ __('Payment Status') }}</span>
							<span class="font-medium text-ink-gray-9 block">{{ session.payment_status }}</span>
						</div>
					</div>

					<!-- Meeting Link Section -->
					<div v-if="session.booking_status === 'Confirmed'" class="bg-blue-50 border border-blue-100 rounded-md p-3 mt-3">
						<span class="text-xs font-semibold text-blue-900 uppercase tracking-wider block mb-1">{{ __('Meeting Room') }}</span>
						<div v-if="session.meeting_link" class="flex items-center justify-between">
							<span class="text-xs text-blue-800 break-all select-all font-mono mr-2">{{ session.meeting_link }}</span>
							<a
								:href="session.meeting_link"
								target="_blank"
								class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
							>
								<Video class="w-3.5 h-3.5" />
								{{ __('Join') }}
							</a>
						</div>
						<div v-else class="text-xs text-blue-800 italic">
							{{ __('Generating meeting link...') }}
						</div>
					</div>

					<!-- Audit Details Section -->
					<div class="border-t pt-3 text-xs text-ink-gray-4 flex flex-col gap-1">
						<div class="flex justify-between">
							<span>{{ __('Locked At') }}</span>
							<span>{{ session.locked_at ? formatAuditTime(session.locked_at) : 'N/A' }}</span>
						</div>
						<div v-if="session.confirmed_at" class="flex justify-between">
							<span>{{ __('Confirmed At') }}</span>
							<span>{{ formatAuditTime(session.confirmed_at) }}</span>
						</div>
					</div>
				</div>
			</template>
		</Dialog>
	</div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { Dialog, Button, Badge } from 'frappe-ui'
import { Video } from 'lucide-vue-next'

const props = defineProps({
	session: {
		type: Object,
		required: true,
	},
})

defineEmits(['retryPayment'])

import { formatLocal, formatTimeRangeLocal } from '@/utils/timezone'

const showDetails = ref(false)

const statusTheme = computed(() => {
	switch (props.session.booking_status) {
		case 'Confirmed':
			return 'blue'
		case 'Completed':
			return 'green'
		case 'Pending Payment':
			return 'amber'
		case 'Cancelled':
		case 'Expired':
			return 'gray'
		default:
			return 'gray'
	}
})

function formatSlotTime(start, end) {
	return formatTimeRangeLocal(start, end, 'DD MMM YYYY, hh:mm A', 'hh:mm A')
}

function formatAuditTime(dateTimeStr) {
	return formatLocal(dateTimeStr, 'DD MMM YYYY, hh:mm A')
}
</script>
