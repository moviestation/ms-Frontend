<script lang="ts" setup>
import { useToast } from 'vue-toast-notification'
import api from '@/api'
import { useI18n } from 'vue-i18n'

// 国际化
const { t } = useI18n()

// 提示框
const $toast = useToast()

// 自定义识别词
const customIdentifiers = ref('')

// 自定义制作组
const customReleaseGroups = ref('')

// 自定义占位符
const customization = ref('')

// 文件整理屏蔽词
const transferExcludeWords = ref('')

// 查询已设置的识别词
async function queryCustomIdentifiers() {
  try {
    const result: { [key: string]: any } = await api.get('system/setting/CustomIdentifiers')
    if (result && result.data && result.data.value) customIdentifiers.value = result.data.value.join('\n')
  } catch (error) {
    console.log(error)
  }
}

// 查询已设置的制作组
async function queryCustomReleaseGroups() {
  try {
    const result: { [key: string]: any } = await api.get('system/setting/CustomReleaseGroups')
    if (result && result.data && result.data.value) customReleaseGroups.value = result.data.value.join('\n')
  } catch (error) {
    console.log(error)
  }
}

// 查询已设置的自定义占位符
async function queryCustomization() {
  try {
    const result: { [key: string]: any } = await api.get('system/setting/Customization')
    if (result && result.data && result.data.value) customization.value = result.data?.value.join('\n')
  } catch (error) {
    console.log(error)
  }
}

// 查询已设置的屏蔽词
async function queryTransferExcludeWords() {
  try {
    const result: { [key: string]: any } = await api.get('system/setting/TransferExcludeWords')
    if (result && result.data && result.data.value) transferExcludeWords.value = result.data?.value.join('\n')
  } catch (error) {
    console.log(error)
  }
}

// 保存用户设置的识别词
async function saveCustomIdentifiers() {
  try {
    const result: { [key: string]: any } = await api.post(
      'system/setting/CustomIdentifiers',
      customIdentifiers.value.split('\n'),
    )

    if (result.success) $toast.success(t('setting.words.identifierSaveSuccess'))
    else $toast.error(t('setting.words.identifierSaveFailed'))
  } catch (error) {
    console.log(error)
  }
}

// 保存自定义制作组
async function saveCustomReleaseGroups() {
  try {
    const result: { [key: string]: any } = await api.post(
      'system/setting/CustomReleaseGroups',
      customReleaseGroups.value.split('\n'),
    )

    if (result.success) $toast.success(t('setting.words.releaseGroupSaveSuccess'))
    else $toast.error(t('setting.words.releaseGroupSaveFailed'))
  } catch (error) {
    console.log(error)
  }
}

// 保存自定义占位符
async function saveCustomization() {
  try {
    const result: { [key: string]: any } = await api.post(
      'system/setting/Customization',
      customization.value.split('\n'),
    )

    if (result.success) $toast.success(t('setting.words.customizationSaveSuccess'))
    else $toast.error(t('setting.words.customizationSaveFailed'))
  } catch (error) {
    console.log(error)
  }
}

// 保存文件整理屏蔽词
async function saveTransferExcludeWords() {
  try {
    const result: { [key: string]: any } = await api.post(
      'system/setting/TransferExcludeWords',
      transferExcludeWords.value.split('\n'),
    )

    if (result.success) $toast.success(t('setting.words.excludeWordsSaveSuccess'))
    else $toast.error(t('setting.words.excludeWordsSaveFailed'))
  } catch (error) {
    console.log(error)
  }
}

onMounted(() => {
  queryCustomIdentifiers()
  queryCustomReleaseGroups()
  queryCustomization()
  queryTransferExcludeWords()
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardItem>
          <VCardTitle>{{ t('setting.words.customIdentifiers') }}</VCardTitle>
          <VCardSubtitle>{{ t('setting.words.identifiersDesc') }}</VCardSubtitle>
        </VCardItem>
        <VCardText>
          <VTextarea
            v-model="customIdentifiers"
            :placeholder="t('setting.words.identifiersPlaceholder')"
            :hint="t('setting.words.identifiersHint')"
            persistent-hint
            prepend-inner-icon="mdi-tag-text"
          />
        </VCardText>
        <VCardText>
          <VAlert type="info" variant="tonal" :title="t('setting.words.formatTitle')">
            <div style="white-space: pre-line" v-html="t('setting.words.formatContent').split('\n').join('<br>')"></div>
          </VAlert>
        </VCardText>
        <VCardText>
          <VForm @submit.prevent="() => {}">
            <div class="d-flex flex-wrap gap-4 mt-4">
              <VBtn type="submit" @click="saveCustomIdentifiers" prepend-icon="mdi-content-save">
                {{ t('common.save') }}
              </VBtn>
            </div>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardItem>
          <VCardTitle>{{ t('setting.words.customReleaseGroups') }}</VCardTitle>
          <VCardSubtitle>{{ t('setting.words.releaseGroupsDesc') }}</VCardSubtitle>
        </VCardItem>
        <VCardText>
          <VTextarea
            v-model="customReleaseGroups"
            :placeholder="t('setting.words.releaseGroupsPlaceholder')"
            :hint="t('setting.words.releaseGroupsHint')"
            persistent-hint
            prepend-inner-icon="mdi-account-group"
          />
        </VCardText>
        <VCardText>
          <VForm @submit.prevent="() => {}">
            <div class="d-flex flex-wrap gap-4 mt-4">
              <VBtn type="submit" @click="saveCustomReleaseGroups" prepend-icon="mdi-content-save">
                {{ t('common.save') }}
              </VBtn>
            </div>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardItem>
          <VCardTitle>{{ t('setting.words.customization') }}</VCardTitle>
          <VCardSubtitle>{{ t('setting.words.customizationDesc') }}</VCardSubtitle>
        </VCardItem>
        <VCardText>
          <VTextarea
            v-model="customization"
            :placeholder="t('setting.words.customizationPlaceholder')"
            :hint="t('setting.words.customizationHint')"
            persistent-hint
            prepend-inner-icon="mdi-code-braces"
          />
        </VCardText>
        <VCardText>
          <VForm @submit.prevent="() => {}">
            <div class="d-flex flex-wrap gap-4 mt-4">
              <VBtn type="submit" @click="saveCustomization" prepend-icon="mdi-content-save">
                {{ t('common.save') }}
              </VBtn>
            </div>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardItem>
          <VCardTitle>{{ t('setting.words.transferExcludeWords') }}</VCardTitle>
          <VCardSubtitle>{{ t('setting.words.excludeWordsDesc') }}</VCardSubtitle>
        </VCardItem>
        <VCardText>
          <VTextarea
            v-model="transferExcludeWords"
            :placeholder="t('setting.words.excludeWordsPlaceholder')"
            :hint="t('setting.words.excludeWordsHint')"
            persistent-hint
            prepend-inner-icon="mdi-block-helper"
          />
        </VCardText>
        <VCardText>
          <VForm @submit.prevent="() => {}">
            <div class="d-flex flex-wrap gap-4 mt-4">
              <VBtn type="submit" @click="saveTransferExcludeWords" prepend-icon="mdi-content-save">
                {{ t('common.save') }}
              </VBtn>
            </div>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
