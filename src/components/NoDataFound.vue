<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// 国际化
const { t } = useI18n()

const props = defineProps<Props>()

interface Props {
  errorCode?: string
  errorTitle?: string
  errorDescription?: string
  icon?: string
  iconColor?: string
}
</script>

<template>
  <div class="no-data-container">
    <!-- 图标容器 -->
    <div class="icon-wrapper">
      <div class="icon-glow"></div>
      <div class="icon-container">
        <VIcon
          :icon="props.icon || 'mdi-file-search-outline'"
          :color="props.iconColor || 'white'"
          size="48"
          class="main-icon"
        />
      </div>
      <div class="pulse-ring"></div>
    </div>

    <!-- 标题 -->
    <div class="error-title">
      {{ props.errorTitle || t('common.noData') }}
    </div>

    <!-- 描述 -->
    <div class="error-description">
      {{ props.errorDescription || t('common.noContent') }}
    </div>

    <!-- 按钮插槽 -->
    <div class="actions-container">
      <slot name="button" />
    </div>
  </div>
</template>

<style scoped>
.no-data-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  inline-size: 100%;
  min-block-size: 300px;
  padding-block: 3rem;
  padding-inline: 1rem;
  text-align: center;
}

/* 图标样式 */
.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  block-size: 100px;
  inline-size: 100px;
  margin-block: 0 2rem;
  margin-inline: auto;
}

.icon-glow {
  position: absolute;
  border-radius: 50%;
  animation: pulse 3s infinite ease-in-out;
  background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.8) 0%, rgba(var(--v-theme-primary), 0) 70%);
  block-size: 80px;
  filter: blur(15px);
  inline-size: 80px;
  opacity: 0.8;
}

.icon-container {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.9), rgba(var(--v-theme-secondary), 0.8));
  block-size: 80px;
  inline-size: 80px;
}

.main-icon {
  animation: slight-bounce 3s infinite ease-in-out;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 30%));
}

.pulse-ring {
  position: absolute;
  z-index: 1;
  border: 2px solid rgba(var(--v-theme-primary), 0.5);
  border-radius: 50%;
  animation: ripple 2s infinite ease-out;
  block-size: 100px;
  inline-size: 100px;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  opacity: 0;
  transform: translate(-50%, -50%);
}

.pulse-ring::before {
  position: absolute;
  border: 2px solid rgba(var(--v-theme-primary), 0.3);
  border-radius: 50%;
  animation: ripple 2s infinite 0.5s ease-out;
  block-size: 85px;
  content: '';
  inline-size: 85px;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  transform: translate(-50%, -50%);
}

@keyframes ripple {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.9);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.5);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(0.8);
  }

  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@keyframes slight-bounce {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }
}

/* 文字样式 */
.error-title {
  position: relative;
  color: rgba(var(--v-theme-on-surface), 0.95);
  font-size: 1.75rem;
  font-weight: 700;
  margin-block-end: 0.75rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 5%);
}

.error-title::after {
  display: block;
  border-radius: 3px;
  background: linear-gradient(90deg, rgba(var(--v-theme-primary), 0.8), rgba(var(--v-theme-primary), 0.2));
  block-size: 3px;
  content: '';
  inline-size: 40px;
  margin-block: 0.5rem 0;
  margin-inline: auto;
}

.error-description {
  color: rgba(var(--v-theme-on-surface), 0.75);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-block-end: 1.5rem;
  margin-inline: auto;
  max-inline-size: 80%;
}

.actions-container {
  margin-block-start: 1.5rem;
}

.actions-container :deep(.v-btn) {
  transform: translateY(0);
  transition: transform 0.2s ease;
}

.actions-container :deep(.v-btn:hover) {
  transform: translateY(-2px);
}

/* 响应式调整 */
@media (width <= 600px) {
  .no-data-container {
    padding-block: 2rem;
    padding-inline: 1rem;
  }

  .icon-wrapper {
    block-size: 80px;
    inline-size: 80px;
    margin-block-end: 1.5rem;
  }

  .icon-container {
    block-size: 70px;
    inline-size: 70px;
  }

  .icon-glow {
    block-size: 70px;
    inline-size: 70px;
  }

  .pulse-ring,
  .pulse-ring::before {
    block-size: 80px;
    inline-size: 80px;
  }

  .error-title {
    font-size: 1.4rem;
  }

  .error-description {
    font-size: 0.95rem;
    max-inline-size: 90%;
  }
}
</style>
