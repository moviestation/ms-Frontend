<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  value: Number,
  text: String,
})
</script>
<template>
  <!-- Progress Dialog -->
  <VDialog :scrim="false" width="25rem">
    <VCard elevation="3" color="primary">
      <VCardText class="text-center">
        {{ props.text || t('dialog.progress.processing') }}
        <VProgressLinear color="white" class="mb-0 mt-1" :model-value="props.value" indeterminate />
      </VCardText>
    </VCard>
  </VDialog>
</template>
