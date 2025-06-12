<script setup lang="ts">
import SubscribeListView from '@/views/subscribe/SubscribeListView.vue'
import SubscribePopularView from '@/views/subscribe/SubscribePopularView.vue'
import SubscribeShareView from '@/views/subscribe/SubscribeShareView.vue'
import SubscribeEditDialog from '@/components/dialog/SubscribeEditDialog.vue'
import { useI18n } from 'vue-i18n'

import { getSubscribeMovieTabs, getSubscribeTvTabs } from '@/router/i18n-menu'

// 国际化
const { t } = useI18n()

const route = useRoute()

const subType = route.meta.subType?.toString()
const subId = ref(route.query.id as string)
const activeTab = ref(route.query.tab)
const shareViewKey = ref(0)

// 获取标签页
const subscribeTabs = computed(() => {
  if (subType === '电影') {
    return getSubscribeMovieTabs()
  } else {
    return getSubscribeTvTabs()
  }
})

// 默认订阅设置弹窗
const subscribeEditDialog = ref(false)

// 订阅过滤弹窗
const filterSubscribeDialog = ref(false)

// 搜索订阅分享弹窗
const searchShareDialog = ref(false)

// 订阅过滤词
const subscribeFilter = ref('')

// 分享搜索词
const shareKeyword = ref('')

// 搜索分享
const searchShares = () => {
  searchShareDialog.value = false
  shareViewKey.value++
}
</script>

<template>
  <div>
    <VHeaderTab :items="subscribeTabs" v-model="activeTab">
      <template #append>
        <VMenu
          v-if="activeTab === 'mysub'"
          v-model="filterSubscribeDialog"
          width="20rem"
          :close-on-content-click="false"
          scrim
        >
          <template #activator="{ props }">
            <VBtn
              icon="mdi-filter-multiple-outline"
              variant="text"
              :color="subscribeFilter ? 'primary' : 'gray'"
              size="default"
              class="settings-icon-button"
              v-bind="props"
            />
          </template>
          <VCard>
            <VCardItem>
              <VCardTitle>
                <VIcon icon="mdi-filter-multiple-outline" class="mr-2" />
                {{ t('subscribe.filterSubscriptions') }}
              </VCardTitle>
              <VDialogCloseBtn @click="filterSubscribeDialog = false" />
            </VCardItem>
            <VCardText>
              <VTextField v-model="subscribeFilter" :label="t('subscribe.name')" clearable density="comfortable" />
            </VCardText>
          </VCard>
        </VMenu>
        <VMenu
          v-if="activeTab === 'share'"
          v-model="searchShareDialog"
          width="25rem"
          :close-on-content-click="false"
          scrim
        >
          <template #activator="{ props }">
            <VBtn
              icon="mdi-movie-search-outline"
              variant="text"
              :color="shareKeyword ? 'primary' : 'gray'"
              size="default"
              class="settings-icon-button"
              v-bind="props"
            />
          </template>
          <VCard>
            <VCardItem>
              <VCardTitle>
                <VIcon icon="mdi-movie-search-outline" class="mr-2" />
                {{ t('subscribe.searchShares') }}
              </VCardTitle>
              <VDialogCloseBtn @click="searchShareDialog = false" />
            </VCardItem>
            <VCardText>
              <VTextField v-model="shareKeyword" :label="t('subscribe.keyword')" clearable density="comfortable">
                <template #append>
                  <VBtn prepend-icon="mdi-magnify" color="primary" @click="searchShares">{{ t('common.search') }}</VBtn>
                </template>
              </VTextField>
            </VCardText>
          </VCard>
        </VMenu>
        <VBtn
          v-if="activeTab === 'mysub'"
          icon="mdi-clipboard-edit-outline"
          variant="text"
          color="gray"
          size="default"
          class="settings-icon-button"
          @click="subscribeEditDialog = true"
        />
      </template>
    </VHeaderTab>

    <VWindow v-model="activeTab" class="disable-tab-transition" :touch="false">
      <VWindowItem value="mysub">
        <transition name="fade-slide" appear>
          <div>
            <SubscribeListView :type="subType" :subid="subId" :keyword="subscribeFilter" />
          </div>
        </transition>
      </VWindowItem>
      <VWindowItem value="popular">
        <transition name="fade-slide" appear>
          <div>
            <SubscribePopularView :type="subType" />
          </div>
        </transition>
      </VWindowItem>
      <VWindowItem value="share">
        <transition name="fade-slide" appear>
          <div>
            <SubscribeShareView :keyword="shareKeyword" :key="shareViewKey" />
          </div>
        </transition>
      </VWindowItem>
    </VWindow>

    <!-- 订阅编辑弹窗 -->
    <SubscribeEditDialog
      v-if="subscribeEditDialog"
      v-model="subscribeEditDialog"
      :default="true"
      :type="subType"
      @save="subscribeEditDialog = false"
      @close="subscribeEditDialog = false"
    />
  </div>
</template>
