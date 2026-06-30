<template>
	<div
		@click="showDetails = true"
		class="flex flex-col border rounded-md p-5 bg-surface-white hover:border-outline-gray-3 transition-colors cursor-pointer"
	>
		<div class="flex items-start justify-between pb-3 border-b">
			<div>
				<h4 class="font-semibold text-base text-ink-gray-9">
					{{ session.tutor_name || __('Tutor') }}
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
				<span class="font-semibold text-ink-gray-8">{{ session.amount }} {{ session.currency }}</span>
			</div>
			<div>
				<span class="text-ink-gray-4 block mb-0.5 uppercase tracking-wider text-[10px]">{{ __('Payment') }}</span>
				<Badge
					:label="paymentLabel"
					:theme="paymentTheme"
					size="sm"
				/>
			</div>
		</div>

		<div class="flex items-center justify-between pt-3">
			<!-- Meeting Link -->
			<div v-if="session.booking_status === 'Confirmed' && session.meeting_link">
				<a
					@click.stop
					:href="session.meeting_link"
					target="_blank"
				>
					<Button variant="solid">
						<template #prefix>
							<Video class="w-3.5 h-3.5" />
						</template>
						{{ __('Join Meeting') }}
					</Button>
				</a>
			</div>
			<div v-else-if="session.booking_status === 'Confirmed'">
				<span class="text-xs text-ink-gray-5 italic">
					{{ __('Generating meeting link...') }}
				</span>
			</div>
			<div v-else-if="session.booking_status === 'Pending Payment' || session.booking_status === 'Failed'">
				<Button
					@click.stop="$emit('retryPayment', session.name)"
					variant="solid"
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
							<h4 class="font-semibold text-base text-ink-gray-9">{{ session.tutor_name || __('Tutor') }}</h4>
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
							<Card
								:title="__('Scheduled Date & Time')"
								class="!p-4 shadow-none border bg-gray-50/50"
							>
								<div class="flex items-center gap-2">
									<Calendar class="h-4 w-4 text-blue-600 shrink-0" />
									<span class="font-semibold text-ink-gray-9 text-sm leading-relaxed">
										{{ formatSlotTime(session.start_datetime, session.end_datetime) }}
									</span>
								</div>
							</Card>
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
							<Badge
								:label="paymentLabel"
								:theme="paymentTheme"
								size="sm"
								class="w-fit"
							/>
						</div>
					</div>

					<!-- Meeting Link Section -->
					<div v-if="session.booking_status === 'Confirmed'" class="mt-3">
						<Card
							:title="__('Meeting Room')"
							class="!p-4 shadow-none border bg-gray-50/50"
						>
							<template #actions>
								<Badge label="Google Meet" theme="blue" size="sm" />
							</template>
							<div class="flex items-center justify-between">
								<p class="text-xs text-ink-gray-5">{{ __('Online live tutoring session') }}</p>
								<div v-if="session.meeting_link">
									<Button
										:href="session.meeting_link"
										target="_blank"
										as="a"
										variant="solid"
										theme="blue"
										size="sm"
									>
										<template #icon>
											<Video class="w-3.5 h-3.5" />
										</template>
										{{ __('Join Meeting') }}
									</Button>
								</div>
								<div v-else class="text-xs text-ink-gray-4 italic">
									{{ __('Generating meeting link...') }}
								</div>
							</div>
						</Card>
					</div>
				</div>
			</template>
			<template #actions>
				<div class="flex justify-between w-full">
					<div>
						<Button
							v-if="isCancellable"
							variant="outline"
							theme="red"
							@click="promptCancellation"
						>
							{{ __('Cancel Session') }}
						</Button>
					</div>
					<Button
						variant="minimal"
						@click="showDetails = false"
					>
						{{ __('Close') }}
					</Button>
				</div>
			</template>
		</Dialog>

		<!-- Cancel Session Confirmation Dialog -->
		<Dialog
			v-model="showCancelDialog"
			:options="{
				title: __('Cancel Session'),
				size: 'md',
			}"
		>
			<template #body-content>
				<div class="space-y-4">
					<p class="text-sm text-ink-gray-7 leading-relaxed">
						{{ __('Are you sure you want to cancel this session?') }}
						<br />
						<span class="text-red-500 font-semibold mt-1 block">
							{{ __('This action will cancel the booking.') }}
						</span>
					</p>
					<div>
						<label class="text-xs font-medium text-ink-gray-5 block mb-1">
							{{ __('Reason for Cancellation') }} <span class="text-red-500">*</span>
						</label>
						<textarea
							v-model="cancelReason"
							class="w-full text-sm border rounded p-2 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
							rows="3"
							:placeholder="__('Please provide a reason...')"
						></textarea>
					</div>
				</div>
			</template>
			<template #actions>
				<div class="flex gap-2 justify-end">
					<Button
						variant="minimal"
						@click="showCancelDialog = false"
					>
						{{ __('Keep Session') }}
					</Button>
					<Button
						variant="solid"
						theme="red"
						:loading="sessionStore.sessionCanceller.loading"
						:disabled="!cancelReason.trim()"
						@click="confirmCancellation"
					>
						{{ __('Confirm') }}
					</Button>
				</div>
			</template>
		</Dialog>
	</div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { Dialog, Button, Badge, Card, toast } from 'frappe-ui'
import { Video, Calendar } from 'lucide-vue-next'
import { useSessionStore } from '@/stores/useSessionStore'
import { formatLocal, formatTimeRangeLocal, isSessionUpcoming } from '@/utils/timezone'

const props = defineProps({
	session: {
		type: Object,
		required: true,
	},
})

const emit = defineEmits(['retryPayment', 'sessionCancelled'])

const sessionStore = useSessionStore()
const showDetails = ref(false)
const showCancelDialog = ref(false)
const cancelReason = ref('')

const isUpcoming = computed(() => {
	return isSessionUpcoming(props.session.start_datetime)
})

const isCancellable = computed(() => {
	return ['Confirmed', 'Pending Payment', 'Failed'].includes(props.session.booking_status)
})

function promptCancellation() {
	cancelReason.value = ''
	showCancelDialog.value = true
}

async function confirmCancellation() {
	if (!cancelReason.value || !cancelReason.value.trim()) {
		toast.error(__('Cancellation reason is mandatory.'))
		return
	}
	try {
		await sessionStore.sessionCanceller.submit({
			booking_name: props.session.name,
			reason: cancelReason.value.trim(),
		})
		
		props.session.booking_status = 'Cancelled'
		if (props.session.payment_status === 'Pending') {
			props.session.payment_status = 'Failed'
		}
		
		toast.success(__('Session cancelled successfully.'))
		showCancelDialog.value = false
		showDetails.value = false
		emit('sessionCancelled', props.session.name)
	} catch (err) {
		toast.error(err.messages?.[0] || err.message || __('Failed to cancel session.'))
	}
}

const statusTheme = computed(() => {
	switch (props.session.booking_status) {
		case 'Confirmed':
			return 'blue'
		case 'Payment Success':
		case 'Completed':
			return 'green'
		case 'Pending Payment':
		case 'Cancellation Requested':
		case 'Refund Requested':
			return 'amber'
		case 'Refunded':
			return 'blue'
		case 'Cancelled':
		case 'Expired':
		case 'Failed':
			return 'gray'
		default:
			return 'gray'
	}
})

const paymentLabel = computed(() => {
	const status = props.session.payment_status?.toLowerCase() || ''
	const labelMap = {
		captured: 'Paid',
		authorized: 'Pending',
		created: 'Pending',
		pending: 'Pending',
		failed: 'Unpaid',
		refunded: 'Refunded',
		partially_refunded: 'Partially Refunded'
	}
	return labelMap[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending')
})

const paymentTheme = computed(() => {
	const status = props.session.payment_status?.toLowerCase() || ''
	switch (status) {
		case 'captured':
			return 'green'
		case 'authorized':
		case 'created':
		case 'pending':
			return 'orange'
		case 'failed':
			return 'red'
		case 'refunded':
			return 'blue'
		case 'partially_refunded':
			return 'purple'
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
