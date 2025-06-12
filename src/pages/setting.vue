<script lang="ts" setup>
import { useRoute } from 'vue-router'
import router from '@/router'
import AccountSettingNotification from '@/views/setting/AccountSettingNotification.vue'
import AccountSettingSite from '@/views/setting/AccountSettingSite.vue'
import AccountSettingWords from '@/views/setting/AccountSettingWords.vue'
import AccountSettingAbout from '@/views/setting/AccountSettingAbout.vue'
import AccountSettingSearch from '@/views/setting/AccountSettingSearch.vue'
import AccountSettingSubscribe from '@/views/setting/AccountSettingSubscribe.vue'
import AccountSettingSystem from '@/views/setting/AccountSettingSystem.vue'
import AccountSettingService from '@/views/setting/AccountSettingService.vue'
import AccountSettingDirectory from '@/views/setting/AccountSettingDirectory.vue'
import AccountSettingRule from '@/views/setting/AccountSettingRule.vue'
import AccountSettingCache from '@/views/setting/AccountSettingCache.vue'
import { getSettingTabs } from '@/router/i18n-menu'

const route = useRoute()

const activeTab = ref(route.query.tab)
const settingTabs = computed(() => getSettingTabs())
</script>

<template>
  <div>
    <VHeaderTab :items="settingTabs" v-model="activeTab" />
    <VWindow v-model="activeTab" class="mt-5 disable-tab-transition" :touch="false">
      <!-- 系统 -->
      <VWindowItem value="system">
        <transition name="fade-slide" appear>
          <div>
            <AccountSettingSystem />
          </div>
        </transition>
      </VWindowItem>

      <!-- 目录 -->
      <VWindowItem value="directory">
        <transition name="fade-slide" appear>
          <div>
            <AccountSettingDirectory />
          </div>
        </transition>
      </VWindowItem>

      <!-- 站点 -->
      <VWindowItem value="site">
        <transition name="fade-slide" appear>
          <div>
            <AccountSettingSite />
          </div>
        </transition>
      </VWindowItem>

      <!-- 规则 -->
      <VWindowItem value="rule">
        <transition name="fade-slide" appear>
          <div>
            <AccountSettingRule />
          </div>
        </transition>
      </VWindowItem>

      <!-- 搜索 -->
      <VWindowItem value="search">
        <transition name="fade-slide" appear>
          <div>
            <AccountSettingSearch />
          </div>
        </transition>
      </VWindowItem>

      <!-- 订阅 -->
      <VWindowItem value="subscribe">
        <transition name="fade-slide" appear>
          <div>
            <AccountSettingSubscribe />
          </div>
        </transition>
      </VWindowItem>

      <!-- 服务 -->
      <VWindowItem value="scheduler">
        <transition name="fade-slide" appear>
          <div>
            <AccountSettingService />
          </div>
        </transition>
      </VWindowItem>

      <!-- 缓存 -->
      <VWindowItem value="cache">
        <transition name="fade-slide" appear>
          <div>
            <AccountSettingCache />
          </div>
        </transition>
      </VWindowItem>

      <!-- 通知 -->
      <VWindowItem value="notification">
        <transition name="fade-slide" appear>
          <div>
            <AccountSettingNotification />
          </div>
        </transition>
      </VWindowItem>

      <!-- 词表 -->
      <VWindowItem value="words">
        <transition name="fade-slide" appear>
          <div>
            <AccountSettingWords />
          </div>
        </transition>
      </VWindowItem>

      <!-- 关于 -->
      <VWindowItem value="about">
        <transition name="fade-slide" appear>
          <div>
            <AccountSettingAbout />
          </div>
        </transition>
      </VWindowItem>
    </VWindow>
  </div>
</template>
