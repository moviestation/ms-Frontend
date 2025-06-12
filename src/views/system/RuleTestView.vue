<script setup lang="ts">
import { reactive, ref } from 'vue'
import { requiredValidator } from '@/@validators'
import api from '@/api'
import { FilterRuleGroup } from '@/api/types'
import { useI18n } from 'vue-i18n'

// 国际化
const { t } = useI18n()

// 识别结果
const ruleTestResult = ref('')

// 名称识别表单
const ruleTestForm = reactive({
  title: null,
  subtitle: null,
  rulegroup: null,
})

// 识别按钮状态
const ruleTestLoading = ref(false)

// 识别按钮文本
const ruleTestText = ref(t('ruleTest.test'))

// 是否显示结果
const showResult = ref(false)

// 所有规则组列表
const filterRuleGroups = ref<FilterRuleGroup[]>([])

// 规则组选项
const filterRuleGroupItems = computed(() => {
  return filterRuleGroups.value.map(item => ({ title: item.name, value: item.name }))
})

// 加载规则组
async function queryFilterRuleGroups() {
  try {
    const result: { [key: string]: any } = await api.get('system/setting/UserFilterRuleGroups')
    filterRuleGroups.value = result.data?.value ?? []
  } catch (error) {
    console.log(error)
  }
}

// 调用API识别
async function ruleTest() {
  if (!ruleTestForm.title || !ruleTestForm.rulegroup) return

  try {
    ruleTestLoading.value = true
    ruleTestText.value = t('ruleTest.testing')
    showResult.value = false
    const result: { [key: string]: any } = await api.get('system/ruletest', {
      params: {
        title: ruleTestForm.title,
        subtitle: ruleTestForm.subtitle,
        rulegroup_name: ruleTestForm.rulegroup,
      },
    })
    if (result.success) ruleTestResult.value = t('ruleTest.priority', { value: result.data.priority })
    else ruleTestResult.value = t('ruleTest.noPriorityRule')

    ruleTestLoading.value = false
    ruleTestText.value = t('ruleTest.testAgain')
    showResult.value = true
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  queryFilterRuleGroups()
})
</script>

<template>
  <VForm @submit.prevent="() => {}">
    <VRow class="pt-2">
      <VCol cols="12" md="8">
        <VTextField
          v-model="ruleTestForm.title"
          :label="t('ruleTest.title')"
          :rules="[requiredValidator]"
          prepend-inner-icon="mdi-movie-open"
        />
      </VCol>
      <VCol cols="12" md="4">
        <VSelect
          v-model="ruleTestForm.rulegroup"
          :label="t('ruleTest.ruleGroup')"
          :items="filterRuleGroupItems"
          prepend-inner-icon="mdi-filter"
        />
      </VCol>
      <VCol cols="12">
        <VTextarea
          v-model="ruleTestForm.subtitle"
          :label="t('ruleTest.subtitle')"
          rows="2"
          auto-grow
          prepend-inner-icon="mdi-subtitles"
        />
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12" class="text-center">
        <VBtn :disabled="ruleTestLoading" @click="ruleTest">
          <template #prepend>
            <VIcon icon="mdi-filter-check-outline" />
          </template>
          {{ ruleTestText }}
        </VBtn>
      </VCol>
    </VRow>
  </VForm>
  <VExpandTransition>
    <div v-show="showResult">
      <VCol>
        <VAlert icon="mdi-alert-circle-outline">
          {{ ruleTestResult }}
        </VAlert>
      </VCol>
    </div>
  </VExpandTransition>
</template>
