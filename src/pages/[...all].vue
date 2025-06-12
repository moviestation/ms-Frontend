<script setup lang="ts">
import NoDataFound from '@/components/NoDataFound.vue'
import { useI18n } from 'vue-i18n'

// 国际化
const { t } = useI18n()
</script>

<template>
  <NoDataFound error-code="404" :error-title="t('notFound.title')" :error-description="t('notFound.description')">
    <template #button>
      <VBtn to="/" class="mt-10">
        {{ t('notFound.backButton') }}
      </VBtn>
    </template>
  </NoDataFound>
</template>
