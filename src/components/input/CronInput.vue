<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: String,
    default: '* * * * *',
  },
})

const emit = defineEmits(['update:modelValue'])

const currentCron = ref(props.modelValue)

watch(currentCron, newVal => {
  emit('update:modelValue', newVal)
})

watch(
  () => props.modelValue,
  value => {
    currentCron.value = value
  },
)
</script>

<template>
  <div>
    <VMenu :close-on-content-click="false" content-class="cursor-default" persistent>
      <template v-slot:activator="{ props }">
        <slot name="activator" :menuprops="props" />
      </template>
      <VList>
        <VListItem>
          <VCronVuetify v-model="currentCron" locale="zh-CN" :chip-props="{ color: 'success' }" class="mt-1" />
        </VListItem>
      </VList>
    </VMenu>
  </div>
</template>
