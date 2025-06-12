<script setup lang="ts">
import api from '@/api'
import { FileItem } from '@/api/types'

const props = defineProps({
  modelValue: {
    type: String,
    default: '/',
  },
  root: {
    type: String,
    default: '/',
    required: true,
  },
  storage: {
    type: String,
    default: 'local',
  },
})

const emit = defineEmits(['update:modelValue'])

const menuVisible = ref(false)

const treeItems = ref<FileItem[]>([
  {
    name: '/',
    path: props.root,
    children: [],
    type: 'dir',
    basename: props.root,
    storage: props.storage,
  },
])

const activedDirs = ref<FileItem[]>([])

const openedDirs = ref<FileItem[]>([])

// 调用API查询子目录
async function fetchDirs(item: any) {
  return api
    .post('/storage/list', item)
    .then((data: any) => {
      data = data.filter((i: any) => i.type === 'dir')
      item.children?.push(...data)
    })
    .catch(err => console.warn(err))
}

// 递归查询路径
function findPath(item: FileItem, path: string): FileItem | null {
  if (item.path === path) {
    return item
  }
  if (item.children) {
    for (const child of item.children) {
      const res: FileItem | null = findPath(child, path)
      if (res) {
        return res
      }
    }
  }
  return null
}

// 根据路径展开所有子目录
async function expandDirs(path: string) {
  // 分割路径
  const paths = path.split('/').filter(i => i)
  // 展开根目录
  const root_item = treeItems.value[0]
  await fetchDirs(root_item)
  openedDirs.value.push(root_item)
  // 逐级展开
  let currentPath = '/'
  for (const p of paths) {
    currentPath += `${p}/`
    // 查询当前目录
    const item = findPath(root_item, currentPath)
    if (!item) {
      break
    }
    // 加载子目录
    if (item.children?.length === 0) {
      await fetchDirs(item)
    }
    // 打开当前目录
    if (!openedDirs.value.includes(item) && path != currentPath) {
      openedDirs.value.push(item)
    }
    // 选中当前目录
    if (path == currentPath) {
      activedDirs.value = [item]
    }
  }
}

// 当前选中项
const selectedPath = computed(() => {
  if (activedDirs.value.length > 0) {
    return activedDirs.value[0].path
  }
  return ''
})

watch(activedDirs, newVal => {
  if (!newVal.length) return
  emit('update:modelValue', selectedPath.value)
})

watch(
  () => menuVisible.value,
  async visible => {
    if (visible) {
      treeItems.value = [
        {
          name: '/',
          path: props.root,
          children: [],
          type: 'dir',
          basename: props.root,
          storage: props.storage,
        },
      ]
      openedDirs.value = []
      activedDirs.value = []
      await expandDirs(props.modelValue)
    }
  },
)

watch(
  () => props.storage,
  async newVal => {
    treeItems.value = [
      {
        name: '/',
        path: props.root,
        children: [],
        type: 'dir',
        basename: props.root,
        storage: newVal,
      },
    ]
    activedDirs.value = []
    openedDirs.value = []
  },
)
</script>

<template>
  <div>
    <VMenu v-model="menuVisible" :close-on-content-click="false" content-class="cursor-default">
      <template v-slot:activator="{ props }">
        <slot name="activator" :menuprops="props" />
      </template>
      <VTreeview
        v-model:activated="activedDirs"
        v-model:opened="openedDirs"
        :items="treeItems"
        :load-children="fetchDirs"
        item-key="path"
        item-title="name"
        item-value="path"
        activatable
        return-object
        max-height="20rem"
        expand-icon="mdi-folder"
        collapse-icon="mdi-folder-open"
      />
    </VMenu>
  </div>
</template>
