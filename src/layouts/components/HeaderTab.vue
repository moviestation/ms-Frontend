<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  items: {
    type: Array as PropType<{ title: string; icon: string; tab: string }[]>,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const currentValue = ref(props.modelValue)

watch(currentValue, newVal => {
  emit('update:modelValue', newVal)
})

watch(
  () => props.modelValue,
  value => {
    currentValue.value = value
  },
)

// Ref for the tabs container
const tabsContainerRef = ref<HTMLElement | null>(null)
// State for showing the scroll indicator
const showTabsScrollIndicator = ref(false)
// State for showing the scroll buttons
const showLeftButton = ref(false)
const showRightButton = ref(false)

// Function to scroll the tabs
const scrollTabs = (direction: 'left' | 'right') => {
  const el = tabsContainerRef.value
  if (!el) return

  const scrollAmount = 200 // 可以根据需要调整滚动量
  const scrollPosition = direction === 'left' ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount

  el.scrollTo({
    left: scrollPosition,
    behavior: 'smooth',
  })
}

// Function to check and update the indicator state
const updateTabsIndicator = () => {
  const el = tabsContainerRef.value
  if (!el) return

  const tolerance = 1 // Allow 1px tolerance
  const hasOverflow = el.scrollWidth > el.clientWidth + tolerance
  const isScrolledToEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - tolerance
  const isScrolledToStart = el.scrollLeft <= tolerance

  showTabsScrollIndicator.value = hasOverflow && !isScrolledToEnd
  showLeftButton.value = hasOverflow && !isScrolledToStart
  showRightButton.value = hasOverflow && !isScrolledToEnd
}

// Debounce resize handler
let resizeTimeout: ReturnType<typeof setTimeout> | null = null
const handleResize = () => {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    updateTabsIndicator()
  }, 150)
}

onMounted(async () => {
  // Add resize listener for tabs indicator
  window.addEventListener('resize', handleResize)
  // Initial check for tabs indicator after DOM update
  await nextTick() // Ensure element is rendered
  updateTabsIndicator()

  // Listen for scroll events specifically on the tabs container
  tabsContainerRef.value?.addEventListener('scroll', updateTabsIndicator, { passive: true })
})

onUnmounted(() => {
  // Remove resize listener
  window.removeEventListener('resize', handleResize)
  // Remove tabs scroll listener
  tabsContainerRef.value?.removeEventListener('scroll', updateTabsIndicator)
})
</script>
<template>
  <div class="tab-header rounded-t-lg">
    <VBtn v-if="showLeftButton" class="scroll-button left-button" @click="scrollTabs('left')" variant="text" icon>
      <VIcon icon="tabler-chevron-left" size="small" color="secondary" />
    </VBtn>

    <div ref="tabsContainerRef" class="header-tabs" :class="{ 'show-indicator': showTabsScrollIndicator }">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="header-tab"
        :class="{ 'active': currentValue === item.tab }"
        @click="currentValue = item.tab"
      >
        <VIcon v-if="item.icon" :icon="item.icon" size="small" class="header-tab-icon" />
        <span>{{ item.title }}</span>
      </div>
    </div>

    <VBtn v-if="showRightButton" class="scroll-button right-button" @click="scrollTabs('right')" variant="text" icon>
      <VIcon icon="tabler-chevron-right" size="small" color="secondary" />
    </VBtn>

    <slot name="append" />
  </div>
</template>
<style scoped lang="scss">
.tab-header {
  position: sticky;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(10px);
  border-block-end: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  inset-block-start: 0;
  margin-block-end: 16px;
  padding-block: 8px;
  padding-inline: 16px;
}

.scroll-button {
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  block-size: 28px;
  cursor: pointer;
  inline-size: 28px;
  outline: none;
  transition: background-color 0.2s ease;

  &.left-button {
    margin-inline-end: 6px;
  }

  &.right-button {
    margin-inline-start: 6px;
  }
}

.header-tabs {
  position: relative; // Needed for pseudo-element positioning
  display: flex;
  flex-grow: 1;
  gap: 12px;

  // Clip content that overflows, useful with padding
  mask-image: linear-gradient(to right, black 95%, transparent 100%);
  min-inline-size: 0;
  overflow-x: auto;
  padding-block: 4px;
  padding-inline: 0;

  // Add padding-right to make space for the indicator visually
  padding-inline-end: 20px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  // Gradient indicator pseudo-element
  &::after {
    position: absolute;
    z-index: 1; // Ensure it's above the tabs but below other header elements if needed
    background: linear-gradient(to left, rgba(var(--v-theme-background), 10.3) 30%, transparent);
    content: '';
    inline-size: 40px; // Width of the fade effect
    inset-block: 0;
    inset-inline-end: 0;
    opacity: 0; // Hidden by default
    pointer-events: none; // Allow interaction with content behind it
    transition: opacity 0.2s ease-in-out;
  }
}

.header-tab-icon {
  color: rgba(var(--v-theme-on-background), 0.6);
  margin-inline-end: 6px;
  transition: color 0.2s ease;
}

.header-tab {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 20px;
  background-color: transparent;
  color: rgba(var(--v-theme-on-background), 0.7);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  padding-block: 6px;
  padding-inline: 14px;
  transition: all 0.2s ease;
  white-space: nowrap;

  &::after {
    position: absolute;
    border-radius: 3px;
    background-color: rgb(var(--v-theme-primary));
    block-size: 3px;
    content: '';
    inline-size: 70%;
    inset-block-end: -4px;
    inset-inline-start: 50%;
    transform: translateX(-50%) scaleX(0);
    transition: transform 0.2s ease;
  }

  &.active {
    color: rgb(var(--v-theme-primary));

    &::after {
      transform: translateX(-50%) scaleX(1);
    }

    .header-tab-icon {
      color: rgb(var(--v-theme-primary));
    }
  }

  &:hover:not(.active) {
    background-color: rgba(var(--v-theme-primary), 0.05);
    color: rgba(var(--v-theme-on-background), 1);
  }
}
</style>
