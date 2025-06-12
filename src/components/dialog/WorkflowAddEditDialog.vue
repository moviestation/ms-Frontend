<script lang="ts" setup>
import { useToast } from 'vue-toast-notification'
import type { Workflow } from '@/api/types'
import { doneNProgress, startNProgress } from '@/api/nprogress'
import { requiredValidator } from '@/@validators'
import api from '@/api'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'

// 多语言支持
const { t } = useI18n()

// 输入参数
const props = defineProps({
  // 任务信息
  workflow: Object as PropType<Workflow>,
})

// 新增或修改字样
const title = computed(() =>
  props.workflow ? t('dialog.workflowAddEdit.editTitle') : t('dialog.workflowAddEdit.addTitle'),
)

// 显示器宽度
const display = useDisplay()

// 注册事件
const emit = defineEmits(['save', 'remove', 'close'])

// 站点编辑表单数据
const workflowForm = ref<Workflow>(
  props.workflow || {
    name: undefined,
    timer: undefined,
    description: undefined,
    state: 'P',
    run_count: 0,
  },
)

// 提示框
const $toast = useToast()

// 调用API 新增任务
async function addWorkflow() {
  if (!workflowForm.value.name || !workflowForm.value.timer) {
    $toast.error(t('dialog.workflowAddEdit.nameRequired'))
    return
  }
  startNProgress()
  try {
    const result: { [key: string]: string } = await api.post('workflow/', workflowForm.value)
    if (result.success) {
      $toast.success(t('dialog.workflowAddEdit.addSuccess'))
      emit('save')
    } else {
      $toast.error(t('dialog.workflowAddEdit.addFailed', { message: result.message }))
    }
  } catch (error) {
    console.error(error)
  }
  doneNProgress()
}

// 调用API 编辑任务
async function editWorkflow() {
  if (!workflowForm.value.name || !workflowForm.value.timer) {
    $toast.error(t('dialog.workflowAddEdit.nameRequired'))
    return
  }
  startNProgress()
  try {
    const result: { [key: string]: string } = await api.put(`workflow/${workflowForm.value.id}`, workflowForm.value)
    if (result.success) {
      $toast.success(t('dialog.workflowAddEdit.editSuccess'))
      emit('save')
    } else {
      $toast.error(t('dialog.workflowAddEdit.editFailed', { message: result.message }))
    }
  } catch (error) {
    console.error(error)
  }
  doneNProgress()
}
</script>

<template>
  <VDialog scrollable :close-on-back="false" eager max-width="30rem" :fullscreen="!display.mdAndUp.value">
    <VCard>
      <VCardItem>
        <template #prepend>
          <VIcon icon="mdi-clock-outline" class="me-2" />
        </template>
        <VCardTitle>{{ title }}</VCardTitle>
      </VCardItem>
      <VDialogCloseBtn @click="emit('close')" />
      <VDivider />
      <VCardText>
        <VForm @submit.prevent="() => {}">
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="workflowForm.name"
                :label="t('dialog.workflowAddEdit.name')"
                :rules="[requiredValidator]"
                persistent-hint
                :hint="t('dialog.workflowAddEdit.namePlaceholder')"
                prepend-inner-icon="mdi-workflow"
              />
            </VCol>
            <VCol cols="12">
              <VCronField
                v-model="workflowForm.timer"
                :label="t('dialog.workflowAddEdit.schedule')"
                :rules="[requiredValidator]"
                placeholder="5位cron表达式"
                persistent-hint
                :hint="t('dialog.workflowAddEdit.cronExprDesc')"
                prepend-inner-icon="mdi-clock-outline"
              />
            </VCol>
            <VCol cols="12">
              <VTextarea
                v-model="workflowForm.description"
                :label="t('dialog.workflowAddEdit.desc')"
                :placeholder="t('dialog.workflowAddEdit.descPlaceholder')"
                prepend-inner-icon="mdi-text-box-outline"
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
      <VCardActions class="pt-3">
        <VSpacer />
        <VBtn v-if="workflow" color="primary" @click="editWorkflow" prepend-icon="mdi-content-save" class="px-5">
          {{ t('dialog.workflowAddEdit.confirm') }}
        </VBtn>
        <VBtn v-else color="primary" @click="addWorkflow" prepend-icon="mdi-plus" class="px-5">
          {{ t('dialog.workflowAddEdit.confirm') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
