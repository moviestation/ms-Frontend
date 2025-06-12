<script lang="ts" setup>
import type { Context } from '@/api/types'
import TorrentItem from '@/components/cards/TorrentItem.vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

// 显示器宽度
const display = useDisplay()

// 国际化
const { t } = useI18n()

// 定义输入参数
const props = defineProps({
  items: Array as PropType<Context[]>,
})

// 过滤表单
const filterForm: Record<string, string[]> = reactive({
  // 站点
  site: [] as string[],
  // 季
  season: [] as string[],
  // 制作组
  releaseGroup: [] as string[],
  // 视频编码
  videoCode: [] as string[],
  // 促销状态
  freeState: [] as string[],
  // 质量
  edition: [] as string[],
  // 分辨率
  resolution: [] as string[],
})

// 过滤项映射（保持中文标题）
const filterTitles: Record<string, string> = {
  site: t('torrent.filterSite'),
  season: t('torrent.filterSeason'),
  freeState: t('torrent.filterFreeState'),
  videoCode: t('torrent.filterVideoCode'),
  edition: t('torrent.filterEdition'),
  resolution: t('torrent.filterResolution'),
  releaseGroup: t('torrent.filterReleaseGroup'),
}

// 排序中文名
const sortTitles: Record<string, string> = {
  default: t('torrent.sortDefault'),
  site: t('torrent.sortSite'),
  size: t('torrent.sortSize'),
  seeder: t('torrent.sortSeeder'),
}

// 统一存储过滤选项
const filterOptions: Record<string, string[]> = reactive({
  site: [] as string[],
  season: [] as string[],
  freeState: [] as string[],
  edition: [] as string[],
  resolution: [] as string[],
  videoCode: [] as string[],
  releaseGroup: [] as string[],
})

// 排序字段
const sortField = ref('default')
// 降序
const sortType = ref<'asc' | 'desc'>('desc')

// 数据列表
const dataList = ref<Array<Context>>([])

// 显示用的数据列表
const displayDataList = ref<Array<Context>>([])

// 计算已选择的过滤条件数量
const getFilterCount = computed(() => {
  let count = 0
  for (const key in filterForm) {
    count += filterForm[key].length
  }
  return count
})

// 计算已选择的过滤条件
const getSelectedFilters = computed(() => {
  const filters: Record<string, string[]> = {}
  for (const key in filterForm) {
    if (filterForm[key].length > 0) {
      filters[key] = [...filterForm[key]]
    }
  }
  return filters
})

// 移除单个过滤条件
function removeFilter(key: string, value: string) {
  const index = filterForm[key].indexOf(value)
  if (index !== -1) {
    filterForm[key].splice(index, 1)
  }
}

// 清除所有过滤条件
function clearAllFilters() {
  for (const key in filterForm) {
    filterForm[key] = []
  }
}

// 初始化过滤选项
function initOptions(data: Context) {
  const { torrent_info, meta_info } = data
  const optionValue = (options: Array<string>, value: string | undefined) => {
    if (value && !options.includes(value)) {
      options.push(value)
      // 如果是season选项，立即触发重新计算
      if (options === filterOptions.season) {
        // 季集选项排序
        sortSeasonOptions()
      }
    }
  }

  optionValue(filterOptions.site, torrent_info?.site_name)
  optionValue(filterOptions.season, meta_info?.season_episode)
  optionValue(filterOptions.releaseGroup, meta_info?.resource_team)
  optionValue(filterOptions.videoCode, meta_info?.video_encode)
  optionValue(filterOptions.freeState, torrent_info?.volume_factor)
  optionValue(filterOptions.edition, meta_info?.edition)
  optionValue(filterOptions.resolution, meta_info?.resource_pix)
}

// 直接在组件中添加季集排序函数，而不是用计算属性
function sortSeasonOptions() {
  if (filterOptions.season.length <= 1) {
    return // 不需要排序
  }

  // 预解析所有选项
  const parsedOptions = filterOptions.season.map((option, index) => {
    // 修改正则表达式以适配 "S01 E07" 格式（注意季号和集号之间的空格）
    const match = option.match(/^S(\d+)(?:-S(\d+))?\s*(?:E(\d+)(?:-E(\d+))?)?$/)

    if (!match) {
      // 格式不符合规范的放到最后
      return {
        original: option,
        seasonNum: 0,
        episodeNum: 0,
        maxEpisodeNum: 0,
        isWholeSeason: false,
        index,
      }
    }

    const seasonNum = parseInt(match[1], 10)
    const episodeNum = match[3] ? parseInt(match[3], 10) : 0
    const maxEpisodeNum = match[4] ? parseInt(match[4], 10) : episodeNum
    const isWholeSeason = !match[3] // 没有E部分表示整季

    return {
      original: option,
      seasonNum,
      episodeNum,
      maxEpisodeNum,
      isWholeSeason,
      index,
    }
  })

  // 先对所有项进行分类
  const wholeSeasons = parsedOptions.filter(item => item.isWholeSeason)
  const episodes = parsedOptions.filter(item => !item.isWholeSeason)

  // 对整季按季号降序排序
  wholeSeasons.sort((a, b) => {
    if (a.seasonNum !== b.seasonNum) {
      return b.seasonNum - a.seasonNum // 季号降序
    }
    return a.index - b.index // 相同季号按原始索引
  })

  // 对单集先按季号降序排序，季号相同时按集号降序排序
  episodes.sort((a, b) => {
    if (a.seasonNum !== b.seasonNum) {
      return b.seasonNum - a.seasonNum // 季号降序
    }
    // 使用最大集号进行排序 (对于范围如 E01-E06)
    const aMaxEp = a.maxEpisodeNum || a.episodeNum
    const bMaxEp = b.maxEpisodeNum || b.episodeNum
    if (aMaxEp !== bMaxEp) {
      return bMaxEp - aMaxEp // 集号降序
    }
    // 如果最大集号相同，再比较起始集号
    if (a.episodeNum !== b.episodeNum) {
      return b.episodeNum - a.episodeNum
    }
    return a.index - b.index // 都相同时按原始索引
  })

  // 合并结果：整季在前，单集在后
  const sortedOptions = [...wholeSeasons, ...episodes].map(item => item.original)

  // 直接更新 filterOptions.season
  filterOptions.season = sortedOptions
}

// 修改watch监听，同时监听排序字段的变化
watch([filterForm, sortField, sortType], filterData)

// 计算过滤后的列表
function filterData() {
  // 清空列表
  dataList.value = []
  displayDataList.value = []
  // 匹配过滤函数
  const match = (filter: Array<string>, value: string | undefined) =>
    filter.length === 0 || (value && filter.includes(value))

  // 先收集所有过滤选项，再过滤数据
  if (props.items?.length) {
    // 首先收集所有过滤选项
    props.items.forEach(data => {
      initOptions(data)
    })

    // 筛选数据
    let filteredData: Context[] = []

    // 然后根据过滤条件筛选数据
    props.items.forEach(data => {
      const { meta_info, torrent_info } = data
      if (
        // 站点过滤
        match(filterForm.site, torrent_info.site_name) &&
        // 促销状态过滤
        match(filterForm.freeState, torrent_info.volume_factor) &&
        // 季过滤
        match(filterForm.season, meta_info.season_episode) &&
        // 制作组过滤
        match(filterForm.releaseGroup, meta_info.resource_team) &&
        // 视频编码过滤
        match(filterForm.videoCode, meta_info.video_encode) &&
        // 分辨率过滤
        match(filterForm.resolution, meta_info.resource_pix) &&
        // 质量过滤
        match(filterForm.edition, meta_info.edition)
      ) {
        filteredData.push(data)
      }
    })

    // 排序
    if (sortType.value === 'desc') {
      if (sortField.value === 'default') {
        filteredData = filteredData.sort((a, b) => b.torrent_info.pri_order - a.torrent_info.pri_order)
      } else if (sortField.value === 'site') {
        filteredData = filteredData.sort((a, b) =>
          (a.torrent_info.site_name || '').localeCompare(b.torrent_info.site_name || ''),
        )
      } else if (sortField.value === 'size') {
        filteredData = filteredData.sort((a, b) => b.torrent_info.size - a.torrent_info.size)
      } else if (sortField.value === 'seeder') {
        filteredData = filteredData.sort((a, b) => b.torrent_info.seeders - a.torrent_info.seeders)
      }
    } else {
      if (sortField.value === 'default') {
        filteredData = filteredData.sort((a, b) => a.torrent_info.pri_order - b.torrent_info.pri_order)
      } else if (sortField.value === 'site') {
        filteredData = filteredData.sort((a, b) =>
          (b.torrent_info.site_name || '').localeCompare(a.torrent_info.site_name || ''),
        )
      } else if (sortField.value === 'size') {
        filteredData = filteredData.sort((a, b) => a.torrent_info.size - b.torrent_info.size)
      } else if (sortField.value === 'seeder') {
        filteredData = filteredData.sort((a, b) => a.torrent_info.seeders - b.torrent_info.seeders)
      }
    }

    // 显示前20个
    displayDataList.value = filteredData.slice(0, 20)
    // 保存剩余数据
    dataList.value = filteredData.slice(20)
  }

  // 确保在数据筛选完成后重新排序季集选项
  if (filterOptions.season.length > 0) {
    // 直接排序，不再使用延时
    sortSeasonOptions()
  }
}

// 过滤菜单相关
const filterMenuOpen = ref(false)
const currentFilter = ref('site')
const currentFilterTitle = computed(() => filterTitles[currentFilter.value])
const currentFilterOptions = computed(() => {
  return filterOptions[currentFilter.value]
})

// 添加全部筛选菜单相关
const allFilterMenuOpen = ref(false)

// 开关全部筛选菜单
function toggleAllFilterMenu() {
  allFilterMenuOpen.value = !allFilterMenuOpen.value
}

// 给定过滤类型返回不同图标
function getFilterIcon(key: string) {
  const icons: Record<string, string> = {
    site: 'mdi-server-network',
    season: 'mdi-television-classic',
    freeState: 'mdi-gift-outline',
    resolution: 'mdi-monitor-screenshot',
    videoCode: 'mdi-video-vintage',
    edition: 'mdi-quality-high',
    releaseGroup: 'mdi-account-group-outline',
  }
  return icons[key] || 'mdi-filter-variant'
}

// 全选某个过滤项
function selectAll(key: string) {
  if (key === 'season') {
    filterForm[key] = [...filterOptions[key]]
  } else {
    filterForm[key] = [...filterOptions[key]]
  }
}

// 清除某个过滤项
function clearFilter(key: string) {
  filterForm[key] = []
}

// 添加toggleFilterMenu函数
function toggleFilterMenu(key: string) {
  if (currentFilter.value === key && filterMenuOpen.value) {
    filterMenuOpen.value = false
  } else {
    currentFilter.value = key
    filterMenuOpen.value = true

    // 如果是季集选项，确保已排序
    if (key === 'season' && filterOptions.season.length > 0) {
      sortSeasonOptions()
    }
  }
}

function loadMore({ done }: { done: any }) {
  // 从 dataList 中获取最前面的 20 个元素
  const itemsToMove = dataList.value.splice(0, 20)
  displayDataList.value.push(...itemsToMove)
  done('ok')
}

// 处理图标点击
const handleSortIconClick = () => {
  // 切换排序方向
  sortType.value = sortType.value === 'asc' ? 'desc' : 'asc'
}

onMounted(() => {
  filterData()
})
</script>

<template>
  <div class="torrent-view">
    <!-- 搜索头部容器 - 新增，用于固定在顶部 -->
    <div class="search-header d-none d-sm-block">
      <!-- PC端页面头部和筛选栏 -->
      <VCard class="view-header mb-3">
        <div class="d-flex align-center flex-wrap pa-3">
          <VChip color="primary" variant="flat" size="small" class="search-count me-3" prepend-icon="mdi-magnify">
            {{ dataList.length }} {{ t('torrent.resources') }}
          </VChip>
          <div class="filter-bar">
            <!-- 排序选择 -->
            <VSelect
              v-model="sortField"
              :items="Object.entries(sortTitles).map(([key, title]) => ({ title, value: key }))"
              item-title="title"
              item-value="value"
              density="compact"
              hide-details
              class="sort-select"
              variant="plain"
            >
              <template #prepend-inner>
                <!-- 添加排序点击事件 -->
                <VIcon @mousedown.stop.prevent="handleSortIconClick">
                  {{ sortType === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending' }}
                </VIcon>
              </template>
            </VSelect>
            <div class="filter-divider"></div>

            <!-- 筛选按钮 -->
            <VBtn
              v-for="(title, key) in filterTitles"
              v-show="filterOptions[key].length > 0"
              :key="key"
              variant="tonal"
              size="small"
              :color="filterForm[key].length > 0 ? 'primary' : undefined"
              :prepend-icon="getFilterIcon(key)"
              class="filter-btn"
              rounded="pill"
            >
              {{ title }}
              <VChip v-if="filterForm[key].length > 0" size="small" color="primary" class="ms-1" variant="elevated">
                {{ filterForm[key].length }}
              </VChip>
              <VMenu activator="parent" :close-on-content-click="false" scrim>
                <VCard max-width="20rem">
                  <VCardText class="filter-menu-content">
                    <div class="flex justify-between">
                      <VBtn variant="text" size="small" color="primary" @click="selectAll(key)">
                        {{ t('torrent.selectAll') }}
                      </VBtn>
                      <VBtn
                        v-if="filterForm[key].length > 0"
                        variant="text"
                        size="small"
                        color="error"
                        @click="clearFilter(key)"
                      >
                        {{ t('torrent.clear') }}
                      </VBtn>
                    </div>
                    <VChipGroup v-model="filterForm[key]" column multiple class="filter-options">
                      <VChip
                        v-for="option in filterOptions[key]"
                        :key="option"
                        :value="option"
                        filter
                        variant="elevated"
                        class="ma-1 filter-chip"
                        size="small"
                      >
                        {{ option }}
                      </VChip>
                    </VChipGroup>
                  </VCardText>
                </VCard>
              </VMenu>
            </VBtn>

            <!-- 全部筛选按钮 -->
            <VBtn
              variant="tonal"
              size="small"
              color="primary"
              class="filter-btn me-2"
              prepend-icon="mdi-filter-variant"
              rounded="pill"
              @click="toggleAllFilterMenu"
            >
              {{ t('torrent.allFilters') }}
              <VChip v-if="getFilterCount > 0" size="small" color="primary" class="ms-1" variant="elevated">
                {{ getFilterCount }}
              </VChip>
            </VBtn>

            <!-- 清除全部筛选按钮 -->
            <VBtn
              v-if="getFilterCount > 0"
              variant="text"
              size="small"
              color="error"
              @click="clearAllFilters"
              class="filter-btn"
              prepend-icon="mdi-close-circle-outline"
            >
              {{ t('torrent.clearFilters') }}
            </VBtn>
          </div>
        </div>

        <!-- 已选择的过滤项显示 -->
        <div v-if="getFilterCount > 0" class="selected-filters">
          <div class="d-flex flex-wrap align-center">
            <template v-for="(values, key) in getSelectedFilters" :key="key">
              <VChip
                v-for="(value, index) in values"
                :key="`${key}-${index}`"
                color="primary"
                size="small"
                closable
                variant="elevated"
                class="me-1 mb-1 mt-1 filter-tag"
                @click:close="removeFilter(key, value)"
              >
                <VIcon size="small" :icon="getFilterIcon(key)" class="me-1"></VIcon>
                <strong>{{ filterTitles[key] }}:</strong> {{ value }}
              </VChip>
            </template>
          </div>
        </div>
      </VCard>
    </div>

    <!-- 移动端头部和筛选区域 -->
    <VCard class="d-block d-sm-none search-header-mobile mb-3">
      <!-- 移动端头部 -->
      <div class="view-header">
        <div class="d-flex align-center flex-wrap pa-2">
          <div class="d-flex align-center w-100">
            <VChip
              color="primary"
              variant="elevated"
              size="small"
              class="search-count me-auto"
              prepend-icon="mdi-magnify"
            >
              {{ props.items?.length || 0 }} {{ t('torrent.resources') }}
            </VChip>

            <!-- 排序选择 -->
            <VSelect
              v-model="sortField"
              :items="Object.entries(sortTitles).map(([key, title]) => ({ title, value: key }))"
              item-title="title"
              item-value="value"
              density="compact"
              hide-details
              class="mobile-sort-select"
              variant="plain"
            >
              <template #prepend-inner>
                <!-- 添加排序点击事件 -->
                <VIcon @mousedown.stop.prevent="handleSortIconClick">
                  {{ sortType === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending' }}
                </VIcon>
              </template>
            </VSelect>
          </div>

          <!-- 筛选图标按钮区域 -->
          <div class="filter-buttons-grid w-100 mt-2">
            <!-- 全部筛选按钮 -->
            <VBtn variant="text" color="primary" class="filter-btn-mobile" @click="toggleAllFilterMenu">
              <VIcon icon="mdi-filter-variant" class="filter-icon me-1"></VIcon>
              <span class="filter-label">
                {{ t('torrent.allFilters') }}
              </span>
              <VBadge
                v-if="getFilterCount > 0"
                :content="getFilterCount"
                color="primary"
                location="top end"
                offset-x="-10"
                offset-y="-10"
              ></VBadge>
            </VBtn>

            <VBtn
              v-for="(title, key) in filterTitles"
              v-show="filterOptions[key].length > 0"
              variant="text"
              color="primary"
              class="filter-btn-mobile"
              @click="toggleFilterMenu(key)"
            >
              <VIcon :icon="getFilterIcon(key)" class="filter-icon me-1"></VIcon>
              <span class="filter-label">
                {{ title }}
              </span>
              <VBadge
                v-if="filterForm[key].length > 0"
                :content="filterForm[key].length"
                color="primary"
                location="top end"
                offset-x="-10"
                offset-y="-10"
              ></VBadge>
            </VBtn>
          </div>
        </div>
      </div>
    </VCard>

    <!-- 全部筛选弹窗 -->
    <VDialog
      v-model="allFilterMenuOpen"
      max-width="50rem"
      location="center"
      scrollable
      :fullscreen="!display.mdAndUp.value"
    >
      <VCard>
        <VDialogCloseBtn @click="allFilterMenuOpen = false" />
        <VCardTitle class="py-3 d-flex align-center">
          <VIcon icon="mdi-filter-variant" class="me-2"></VIcon>
          <span>{{ t('torrent.allFilters') }}</span>
          <VSpacer />
          <VBtn
            v-if="getFilterCount > 0"
            class="me-10"
            variant="text"
            size="small"
            color="error"
            @click="clearAllFilters"
          >
            {{ t('torrent.clearAll') }}
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText>
          <div class="all-filters-grid">
            <VCard
              v-for="(title, key) in filterTitles"
              variant="tonal"
              :key="key"
              class="filter-section"
              v-show="filterOptions[key].length > 0"
            >
              <VCardItem class="py-2">
                <template #prepend>
                  <VIcon :icon="getFilterIcon(key)" class="me-2"></VIcon>
                </template>
                <VCardTitle>{{ title }}</VCardTitle>
                <template #append>
                  <VBtn variant="text" size="small" color="primary" @click="selectAll(key)">
                    {{ t('torrent.selectAll') }}
                  </VBtn>
                  <VBtn
                    v-if="filterForm[key].length > 0"
                    variant="text"
                    size="small"
                    color="error"
                    @click="clearFilter(key)"
                  >
                    {{ t('torrent.clear') }}
                  </VBtn>
                </template>
              </VCardItem>
              <VCardText>
                <VChipGroup v-model="filterForm[key]" column multiple class="filter-options">
                  <VChip
                    v-for="option in filterOptions[key]"
                    :key="option"
                    :value="option"
                    filter
                    variant="elevated"
                    class="ma-1 filter-chip"
                    size="small"
                  >
                    {{ option }}
                  </VChip>
                </VChipGroup>
              </VCardText>
            </VCard>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- 筛选弹窗 -->
    <VDialog v-model="filterMenuOpen" max-width="25rem" max-height="85vh" location="center">
      <VCard>
        <VCardTitle class="py-3 d-flex align-center">
          <VIcon :icon="getFilterIcon(currentFilter)" class="me-2"></VIcon>
          <span>{{ currentFilterTitle }}</span>
          <VSpacer />
          <VBtn
            v-if="filterForm[currentFilter].length > 0"
            variant="text"
            size="small"
            color="error"
            @click="clearFilter(currentFilter)"
          >
            {{ t('torrent.clear') }}
          </VBtn>
          <VBtn variant="text" size="small" color="primary" @click="selectAll(currentFilter)">
            {{ t('torrent.selectAll') }}
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VChipGroup v-model="filterForm[currentFilter]" column multiple class="filter-options">
            <VChip
              v-for="option in currentFilterOptions"
              :key="option"
              :value="option"
              filter
              variant="elevated"
              class="ma-1 filter-chip"
              size="small"
            >
              {{ option }}
            </VChip>
          </VChipGroup>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="primary" prepend-icon="mdi-check" class="px-5" @click="filterMenuOpen = false">
            {{ t('torrent.confirm') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- 资源列表容器 -->
    <VCard class="resource-list-container">
      <!-- 无结果时显示 -->
      <div v-if="displayDataList.length === 0" class="no-results">
        <VIcon icon="mdi-file-search-outline" size="64" color="grey-lighten-1" />
        <div class="text-h6 text-grey mt-4">{{ t('torrent.noResults') }}</div>
      </div>
      <!-- 资源列表 -->
      <VInfiniteScroll
        v-else
        mode="intersect"
        side="end"
        :items="displayDataList"
        class="resource-list overflow-visible"
        @load="loadMore"
      >
        <template #loading />
        <template #empty />
        <div v-for="(item, index) in displayDataList" :key="`${item.torrent_info?.enclosure || ''}-${index}`">
          <TorrentItem :torrent="item" />
          <VDivider v-if="index < displayDataList.length - 1" class="my-2" />
        </div>
      </VInfiniteScroll>
    </VCard>
  </div>
</template>

<style scoped>
.torrent-view {
  position: relative;
  block-size: 100%;
}

.search-header {
  position: sticky;
  z-index: 10;
  backdrop-filter: blur(10px);
  inset-block-start: 0;
}

.search-header-mobile {
  position: sticky;
  z-index: 10;
  backdrop-filter: blur(10px);
  inset-block-start: 0;
}

.view-header {
  overflow: hidden;
}

.search-count {
  font-weight: 500;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.filter-divider {
  background-color: rgba(var(--v-theme-on-surface), 0.12);
  block-size: 24px;
  inline-size: 1px;
  margin-block: 0;
  margin-inline: 8px;
}

.filter-btn {
  min-inline-size: 0;
  transition: transform 0.2s;
}

.filter-btn:hover {
  transform: translateY(-2px);
}

.filter-menu-content {
  max-block-size: 50vh;
  overflow-y: auto;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
}

.filter-chip {
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  margin: 4px;
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
  color: rgba(var(--v-theme-on-surface), 0.9) !important;
  font-weight: 500;
  transition: all 0.2s ease;
}

.filter-chip:hover {
  background-color: rgba(var(--v-theme-primary), 0.15) !important;
  transform: translateY(-2px);
}

.filter-chip.v-chip--selected {
  background-color: rgba(var(--v-theme-primary), 0.85) !important;
  box-shadow: 0 2px 4px rgba(var(--v-theme-primary), 0.3);
  color: rgb(var(--v-theme-on-primary)) !important;
  font-weight: 600;
}

.filter-tag {
  font-weight: 500;
  transition: all 0.2s;
}

.filter-tag:hover {
  transform: translateY(-2px);
}

.selected-filters {
  overflow: hidden;
  background-color: rgba(var(--v-theme-surface-variant), 0.08);
  padding-block: 8px;
  padding-inline: 12px;
}

.resource-list-container {
  padding: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-block-size: 300px;
}

.filter-buttons-grid {
  display: grid;
  gap: 4px;
  grid-template-columns: repeat(3, 1fr);
}

.filter-btn-mobile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 8px;
  background-color: rgba(var(--v-theme-surface), 0.5);
  block-size: auto;
  min-block-size: 48px;
  padding-block: 4px;
  padding-inline: 0;
}

.filter-icon {
  font-size: 18px;
  margin-block-end: 2px;
}

.filter-label {
  font-size: 0.8rem;
  text-align: center;
}

.mobile-sort-select {
  max-inline-size: 130px;
  min-inline-size: 80px;
}

.all-filters-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.filter-section {
  background-color: rgba(var(--v-theme-surface-variant), 0.08);
}
</style>
