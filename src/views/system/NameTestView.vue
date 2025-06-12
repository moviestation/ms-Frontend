<script setup lang="ts">
import { reactive, ref } from 'vue'
import { requiredValidator } from '@/@validators'
import api from '@/api'
import type { Context } from '@/api/types'
import MediaInfoCard from '@/components/cards/MediaInfoCard.vue'
import { useI18n } from 'vue-i18n'

// 国际化
const { t } = useI18n()

// 识别结果
const nameTestResult = ref<Context>()

// 名称识别表单
const nameTestForm = reactive({
  title: '',
  subtitle: '',
})

// 识别按钮状态
const nameTestLoading = ref(false)

// 识别按钮文本
const nameTestText = ref(t('nameTest.recognize'))

// 是否显示结果
const showResult = ref(false)

// 调用API识别
async function nameTest() {
  if (!nameTestForm.title) return

  try {
    nameTestLoading.value = true
    nameTestText.value = t('nameTest.recognizing')
    showResult.value = false
    nameTestResult.value = await api.get('media/recognize', {
      params: {
        title: nameTestForm.title,
        subtitle: nameTestForm.subtitle,
      },
    })
    nameTestLoading.value = false
    nameTestText.value = t('nameTest.recognizeAgain')
    showResult.value = true
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <VForm @submit.prevent="() => {}">
    <VRow class="pt-2">
      <VCol cols="12">
        <VTextField
          v-model="nameTestForm.title"
          :label="t('nameTest.title')"
          :rules="[requiredValidator]"
          prepend-inner-icon="mdi-movie-open"
        />
      </VCol>
      <VCol cols="12">
        <VTextarea
          v-model="nameTestForm.subtitle"
          :label="t('nameTest.subtitle')"
          rows="2"
          auto-grow
          prepend-inner-icon="mdi-subtitles"
        />
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12" class="text-center">
        <VBtn :disabled="nameTestLoading" @click="nameTest">
          <template #prepend>
            <VIcon icon="mdi-text-recognition" />
          </template>
          {{ nameTestText }}
        </VBtn>
      </VCol>
    </VRow>
  </VForm>
  <VExpandTransition>
    <div v-show="showResult">
      <MediaInfoCard :context="nameTestResult" />
    </div>
  </VExpandTransition>
</template>
