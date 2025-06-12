<script lang="ts" setup>
import SlideViewTitle from '@/components/slide/SlideViewTitle.vue'
import { useDisplay } from 'vuetify'

// 判断是否可以触摸
const display = useDisplay()
const isTouch = computed(() => display.mobile.value)

// 元素
const slideview_content = ref<HTMLElement | null>(null)
const sliderContainer = ref<HTMLElement | null>(null)
// 分页切换状态: 0-左边不可用 1-两边可用 2-右边不可用 3-两边都不可用
const disabled = ref(0)
// 记录滚动值
const slideview_scrollLeft = ref(0)
// 所有卡片数量
let slide_card_length: number
// 卡片间距
let slide_gap_px: number
// 卡片宽度
let card_width: number
// 容器最多显示N张卡片
let card_max: number
// 当前定位
let card_current: number
// 获取传入的链接地址
const props: any = inject('rankingPropsKey', { linkurl: '', title: '' })
const isScrolling = ref(false)
let scrollTimeout: ReturnType<typeof setTimeout> | null = null
const scrollTimeoutDuration = 1500 // 滚动停止后延迟时间 (ms)

// 分页切换
function slideNext(next: boolean) {
  let run_to_left_px
  if (next) {
    const card_index = card_current + card_max
    run_to_left_px = card_index * card_width
    if (run_to_left_px >= slideview_content.value!.scrollWidth - slideview_content.value!.clientWidth)
      run_to_left_px = slideview_content.value!.scrollWidth - slideview_content.value!.clientWidth
  } else {
    const card_index = card_current - card_max
    run_to_left_px = card_index * card_width
    if (run_to_left_px <= 0) run_to_left_px = 0
  }
  slideview_content.value!.scrollTo({
    top: 0,
    left: run_to_left_px,
    behavior: 'smooth',
  })

  // 点击后强制显示并重置计时器
  isScrolling.value = true
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
  scrollTimeout = setTimeout(() => {
    isScrolling.value = false
  }, scrollTimeoutDuration)
}

// 计算最大显示数量
function countMaxNumber() {
  if (!slideview_content.value || !slideview_content.value.firstElementChild) return
  slide_card_length = slideview_content.value.children.length
  card_width = slideview_content.value.firstElementChild.getBoundingClientRect().width
  slide_gap_px = slideview_content.value.scrollWidth / slide_card_length - card_width
  card_width += slide_gap_px
  card_max = Math.trunc(slideview_content.value.clientWidth / card_width)
  countDisabled()
}

// 修改分页切换按钮状态 & 处理滚动状态
function handleContentScroll() {
  if (!slideview_content.value) return
  // 更新按钮禁用状态
  countDisabled()

  // 更新滚动状态并重置计时器
  isScrolling.value = true
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
  scrollTimeout = setTimeout(() => {
    isScrolling.value = false
  }, scrollTimeoutDuration) // 使用常量
}

// 原始的 countDisabled 逻辑，现在由 handleContentScroll 调用
function countDisabled() {
  if (!slideview_content.value) return
  slideview_scrollLeft.value = slideview_content.value.scrollLeft
  card_current =
    slideview_content.value.scrollLeft === 0
      ? 0
      : Math.trunc((slideview_content.value.scrollLeft + card_width / 2) / card_width)
  if (slide_card_length * card_width <= slideview_content.value.clientWidth) disabled.value = 3
  else if (slideview_content.value.scrollLeft === 0) disabled.value = 0
  else if (
    slideview_content.value.scrollLeft >=
    slideview_content.value.scrollWidth - slideview_content.value.clientWidth - 2
  )
    disabled.value = 2
  else disabled.value = 1
}

// 组件加载完成
onMounted(() => {
  // 初次获取元素参数
  countMaxNumber()
  // 窗口大小发生改变时
  window.addEventListener('resize', countMaxNumber)
})

onUnmounted(() => {
  // 卸载事件
  window.removeEventListener('resize', countMaxNumber)
})

onActivated(() => {
  if (slideview_scrollLeft.value !== 0) {
    slideview_content.value!.scrollLeft = slideview_scrollLeft.value
  }
})
</script>

<template>
  <div ref="sliderContainer" class="slider-container" :class="{ 'is-scrolling': isScrolling }">
    <div class="slider-header">
      <slot name="title">
        <SlideViewTitle />
      </slot>
      <!-- 查看全部按钮 -->
      <RouterLink v-if="props.linkurl" :to="props.linkurl" class="view-all-button">
        <span>更多</span>
        <svg width="16" height="16" viewBox="0 0 24 24" class="arrow-svg">
          <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
        </svg>
      </RouterLink>
    </div>

    <div class="slider-content-wrapper">
      <div class="slider-content-container">
        <div ref="slideview_content" class="slider-content" tabindex="0" @scroll="handleContentScroll">
          <slot name="content" />
        </div>
      </div>

      <!-- 左侧导航按钮 -->
      <VBtn
        class="nav-button nav-button-left"
        @click.stop="slideNext(false)"
        v-show="disabled !== 0 && disabled !== 3 && !isTouch"
        variant="text"
        icon
        color="secondary"
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" />
        </svg>
      </VBtn>

      <!-- 右侧导航按钮 -->
      <VBtn
        class="nav-button nav-button-right"
        @click.stop="slideNext(true)"
        v-show="disabled !== 2 && disabled !== 3 && !isTouch"
        variant="text"
        icon
        color="secondary"
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
        </svg>
      </VBtn>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.slider-container {
  position: relative;
  margin-block-end: 24px;
}

.slider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-block-end: 12px;
  padding-block: 0;
  padding-inline: 8px;

  & > :first-child {
    flex-grow: 1;
    min-inline-size: 0;
  }
}

.view-all-button {
  .arrow-svg {
    fill: currentcolor;
    margin-inline-start: 2px;
    transition: transform 0.3s ease;
  }

  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  border-radius: 8px;
  background-color: transparent;
  color: rgb(var(--v-theme-primary));
  font-size: 0.85rem;
  font-weight: 500;
  padding-block: 5px;
  padding-inline: 12px;
  text-decoration: none;
  transition: all 0.25s ease;

  &:hover {
    border-color: rgba(var(--v-theme-primary), 0.5);
    background-color: rgba(var(--v-theme-primary), 0.08);
    transform: translateY(-1px);

    .arrow-svg {
      transform: translateX(3px);
    }
  }

  span {
    margin-inline-end: 4px;
  }
}

.slider-content-wrapper {
  position: relative;
  inline-size: 100%;
}

.slider-content-container {
  position: relative;
  overflow: hidden;
  inline-size: 100%;
}

.nav-button {
  position: absolute;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 50%;
  backdrop-filter: blur(8px);
  background-color: rgba(var(--v-theme-background), 0.3);
  block-size: 36px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 8%);
  cursor: pointer;
  inline-size: 36px;
  inset-block-start: 50%;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-50%);
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.3s ease,
    box-shadow 0.3s ease, border-color 0.3s ease;

  svg {
    block-size: 22px;
    fill: currentcolor;
    filter: none;
    inline-size: 22px;
    opacity: 0.7;
    transition: all 0.3s ease;
  }

  &:hover {
    color: rgb(var(--v-theme-primary));
    transform: translateY(-50%) scale(1.05);

    svg {
      opacity: 1;
    }
  }
}

.nav-button-left {
  inset-inline-start: 8px;
}

.nav-button-right {
  inset-inline-end: 8px;
}

.slider-content {
  display: grid;
  overflow: scroll hidden !important;
  justify-content: start;
  gap: 16px;
  grid-auto-flow: column;
  grid-template-rows: 1fr;
  -ms-overflow-style: none !important;
  overscroll-behavior-x: contain !important;
  padding-block: 8px;
  padding-inline: 12px;
  scroll-behavior: smooth;
  scrollbar-width: none !important;

  &::-webkit-scrollbar {
    display: none;
  }
}

// 触摸设备：滚动时显示 (通过 JS 添加的类控制)
// 这个规则会在不支持 hover 的设备上生效
.slider-container.is-scrolling .nav-button {
  opacity: 1;
  pointer-events: auto;
}

// 桌面设备：悬停时显示
@media (hover: hover) {
  .slider-container:hover .nav-button {
    // 这个规则会覆盖 .is-scrolling 的效果 (如果同时存在)
    // 或者在非 scrolling 状态下，hover 时也能显示
    opacity: 1;
    pointer-events: auto;
  }

  // 在 hover 设备上，即使在滚动，如果鼠标不悬停，按钮也应该隐藏
  // 因此，基础 .nav-button 的 opacity: 0 规则在这里仍然是必要的
  // (之前错误地以为 hover 会完全覆盖，但滚动时 class 和 hover 可能同时存在)
  // .nav-button { opacity: 0; pointer-events: none; } // 这行其实不需要重复，默认就是这样
}
</style>
