<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { Document, MoreFilled, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

import folderIcon from '@src/assets/images/folder.png'
import listIcon from '@src/assets/images/list.png'
import formIcon from '@src/assets/images/form.png'
import type { MenuItem, PageBuilderMenuType, PageConfig } from '@pages/biz-tools/types'
import {
  collectSubtreeCodes,
  createPageConfig,
  generateMenuCode,
  normalizeMenuFileName,
  usePageBuilderMenuTree
} from '../menu-tree'
import {
  snapshotLocalMenuList,
  snapshotSystemMenuList,
  exportPageBuilderCode,
  syncPageBuilderMenusToTest,
  syncPageBuilderState,
  updatePageBuilderLocalStatus
} from '../page-builder-api'

const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  (event: 'update:collapsed', value: boolean): void
  (event: 'select', menu: MenuItem | null): void
}>()

const treeStore = usePageBuilderMenuTree()
const keyword = treeStore.keyword
const selectedId = treeStore.selectedId
const selectedMenu = treeStore.selectedMenu
// 同步用的勾选 ID 和按父子顺序整理后的待提交列表。
const checkedMenuIds = treeStore.checkedMenuIds
const checkedMenuListForSync = treeStore.checkedMenuListForSync
const treeMenuList = treeStore.treeMenuList
const flatMenuList = treeStore.flatMenuList
const createDraftMenuItem = treeStore.createDraftMenuItem
const findNextSortIndex = treeStore.findNextSortIndex
const getDraftById = treeStore.getDraftById
const selectMenu = treeStore.selectMenu
const addMenu = treeStore.addMenu
const updateMenu = treeStore.updateMenu
const setPrimaryList = treeStore.setPrimaryList
const deleteMenu = treeStore.deleteMenu
const markMenusSynced = treeStore.markMenusSynced
const setCheckedMenuIds = treeStore.setCheckedMenuIds
const loadFromDatabase = treeStore.loadFromDatabase

const formVisible = ref(false)
const formMode = ref<'add-root' | 'add-child' | 'edit'>('add-root')
const editingId = ref<string | null>(null)
const formRef = ref<FormInstance>()
// el-tree 实例，用来回写 / 恢复勾选状态。
const treeRef = ref<any>(null)
// 本地数据库和代码生成同步时的加载态。
const syncing = ref(false)
// 页面首次进入时从 database.json 恢复菜单树的加载态。
const loadingDatabase = ref(true)
type MenuFormModel = Pick<MenuItem, 'comment' | 'fileName' | 'code' | 'parentCode'>

/**
 * 父级菜单树节点。
 *
 * value 保存菜单编码，和 MenuItem.parentCode 保持一致；disabled 只影响选择，不改变树展示。
 */
interface ParentMenuTreeNode {
  value: string
  label: string
  disabled: boolean
  children: ParentMenuTreeNode[]
}

// 新增菜单支持的 PageBuilder 节点类型；菜单是容器，页面、列表和表单是实际页面节点。
const builderTypeOptions: Array<{ label: string; value: PageBuilderMenuType }> = [
  { label: '菜单', value: 'folder' },
  { label: '页面', value: 'page' },
  { label: '列表', value: 'list' },
  { label: '表单', value: 'form' }
]

// 已同步菜单的编码不允许再改，避免和系统里已落库的数据不一致。
const isCodeLocked = computed(() => formMode.value === 'edit' && draft.submitStatus === 'submitted')
const showPageConfig = computed(() => draft.builderType === 'list' || draft.builderType === 'form')
const isFolder = computed(() => draft.builderType === 'folder')
const draftParent = computed(() => {
  return flatMenuList.value.find(item => item.code === draft.parentCode) || null
})

// 页面下只能放列表或表单；其它父级仍可创建全部类型的子节点。
const availableBuilderTypeOptions = computed(() => {
  if (draftParent.value?.builderType === 'page') {
    return builderTypeOptions.filter(option => option.value === 'list' || option.value === 'form')
  }

  return builderTypeOptions
})

// TreeSelect 的字段映射，value 保存菜单编码，不额外引入界面专用字段到菜单数据中。
const parentMenuTreeProps = {
  value: 'value',
  label: 'label',
  children: 'children',
  disabled: 'disabled'
}

// 编辑菜单时，当前节点及所有子孙节点不能被选择为父级，避免形成循环树。
const blockedParentCodes = computed(() => {
  if (formMode.value !== 'edit' || !editingId.value) {
    return new Set<string>()
  }

  const current = getDraftById(editingId.value)
  if (!current) {
    return new Set<string>()
  }

  return new Set([current.code, ...collectSubtreeCodes(flatMenuList.value, current.code)])
})

// 判断节点能否作为当前草稿的父级：菜单/页面挂在菜单下，列表/表单挂在页面下。
const canSelectParentMenu = (item: MenuItem) => {
  if (blockedParentCodes.value.has(item.code)) {
    return false
  }

  return showPageConfig.value
    ? item.builderType === 'page'
    : item.builderType === 'folder'
}

// 将扁平菜单数据转换成完整树，同时保留不能选择的节点作为层级提示。
const buildParentMenuTree = (menus: MenuItem[]): ParentMenuTreeNode[] => {
  const nodesByCode = new Map<string, ParentMenuTreeNode>()
  const rootNodes: ParentMenuTreeNode[] = []

  menus.forEach(item => {
    nodesByCode.set(item.code, {
      value: item.code,
      label: `${item.comment} (${item.code})`,
      disabled: !canSelectParentMenu(item),
      children: []
    })
  })

  menus.forEach(item => {
    const node = nodesByCode.get(item.code)
    const parentNode = item.parentCode ? nodesByCode.get(item.parentCode) : undefined

    if (!node) {
      return
    }

    if (parentNode) {
      parentNode.children.push(node)
      return
    }

    rootNodes.push(node)
  })

  const sortNodes = (nodes: ParentMenuTreeNode[]) => {
    nodes.sort((left, right) => left.label.localeCompare(right.label, 'zh-Hans-CN'))
    nodes.forEach(node => sortNodes(node.children))
  }

  sortNodes(rootNodes)
  return rootNodes
}

// 新增/编辑时展示完整父级树，不匹配当前类型的节点显示为禁用状态。
const parentMenuTreeData = computed(() => buildParentMenuTree(flatMenuList.value))

// 判断当前节点是否允许新增子菜单。
const canAddChild = (node: MenuItem) => node.builderType === 'folder' || node.builderType === 'page'

// 根据类型区分必填项：
// - 页面和菜单(folder)：菜单名称、文件名称、菜单编码
// - 列表和表单：文件名称、功能编码、父级编码、功能名称
const fileNameValidator = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  // 空值交给 required 规则处理，避免同一个字段同时显示两条错误提示。
  if (!value?.trim()) {
    callback()
    return
  }

  if (!normalizeMenuFileName(value)) {
    callback(new Error('文件名称只能包含英文、数字和短横线'))
    return
  }
  callback()
}

const formRules = reactive<FormRules<MenuFormModel>>({
  comment: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
      // 页面和菜单(folder)的菜单名称必填，空值由 required 规则统一提示。
      if (!showPageConfig.value && value?.trim()) {
        callback()
        return
      }
      callback()
    }, trigger: 'blur' }
  ],
  fileName: [
    { required: true, message: '请输入文件名称', trigger: 'blur' },
    { validator: fileNameValidator, trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入菜单编码', trigger: 'blur' },
    { validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
      // 页面和菜单(folder)的菜单编码必填，空值由 required 规则统一提示。
      if (!showPageConfig.value && value?.trim()) {
        callback()
        return
      }
      callback()
    }, trigger: 'blur' }
  ],
  parentCode: [
    { required: true, message: '请输入父级编码', trigger: 'blur' },
    { validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
      // 列表和表单的父级编码必填，空值由 required 规则统一提示。
      if (showPageConfig.value && value?.trim()) {
        callback()
        return
      }
      callback()
    }, trigger: 'blur' }
  ]
})

// 表单草稿，新增和编辑都复用这一份。
const draft = reactive<MenuItem>(createDraftMenuItem())
const draftPageConfig = computed(() => {
  return draft.pageConfig || createPageConfig(draft.builderType, null, draft) as PageConfig
})

// 判断指定页面下是否已经存在主列表，编辑当前列表时排除自身。
const hasPrimaryList = (parentCode: string, excludeId = '') => {
  return flatMenuList.value.some(item => (
    item.builderType === 'list'
    && item.parentCode === parentCode
    && item.id !== excludeId
    && item.pageConfig?.isPrimaryList === true
  ))
}

// 页面已有主列表时，新列表只能作为子列表保存。
const primaryListExistsForDraft = computed(() => {
  return draft.builderType === 'list'
    && hasPrimaryList(draft.parentCode, editingId.value || '')
})

// 根据当前父级同步新增列表的主列表状态，避免同一页面出现多个主列表。
const normalizeDraftPrimaryList = () => {
  if (draft.builderType !== 'list' || !draft.pageConfig) {
    return
  }

  if (hasPrimaryList(draft.parentCode, editingId.value || '')) {
    draft.pageConfig.isPrimaryList = false
    return
  }

  if (formMode.value !== 'edit' && editingId.value == null) {
    // 新增列表所在页面没有主列表时，默认选中“是”。
    draft.pageConfig.isPrimaryList = true
  }
}

const collapsedProxy = computed({
  get: () => props.collapsed,
  set: value => emit('update:collapsed', value)
})

// 树数据变化后，把本地缓存的勾选状态重新打回树。
const syncTreeCheckedState = async () => {
  await nextTick()
  treeRef.value?.setCheckedKeys?.(checkedMenuIds.value)
}

watch(treeMenuList, () => {
  syncTreeCheckedState()
}, {
  deep: true,
  immediate: true
})

// 页面初始化只从本地数据库恢复。
onMounted(async () => {
  try {
    await loadFromDatabase()
  } catch {
    ElMessage.warning('本地数据库未连接，当前使用默认菜单；请先启动 PageBuilder 服务')
  } finally {
    loadingDatabase.value = false
    syncTreeCheckedState()
  }
})

const resetDraft = (parentCode = '') => {
  Object.assign(draft, createDraftMenuItem(parentCode))
}

// 节点类型变化时同步清理不适用的字段，并固定列表/表单类型值。
watch(() => draft.builderType, value => {
  const selectedParent = draftParent.value

  // 类型切换后，原父级不满足新类型要求时清空，交由树选择器重新选择。
  if (selectedParent && !canSelectParentMenu(selectedParent)) {
    draft.parentCode = ''
  }

  if (value === 'folder') {
    draft.resource = null
    draft.pageConfig = null
    return
  }

  const currentConfig: Partial<PageConfig> = draft.pageConfig || {}
  const nextConfig = value === 'list' && currentConfig.isPrimaryList == null
    ? {
        ...currentConfig,
        // 新增列表且当前页面没有主列表时，默认将它设为主列表。
        isPrimaryList: !hasPrimaryList(draft.parentCode, editingId.value || '')
      }
    : currentConfig

  draft.pageConfig = createPageConfig(value, nextConfig, {
    code: draft.code,
    comment: draft.comment,
    parentCode: draft.parentCode
  })
  normalizeDraftPrimaryList()
})

watch(() => draft.parentCode, () => {
  normalizeDraftPrimaryList()
})

// 打开新增菜单弹窗，并预填编码、父级和排序。
const openCreateDialog = (mode: 'add-root' | 'add-child', parentCode = '') => {
  const selected = selectedMenu.value

  if (mode === 'add-child' && selected && !canAddChild(selected)) {
    ElMessage.warning('列表和表单不能新增子菜单')
    return
  }

  formMode.value = mode
  editingId.value = null
  resetDraft(mode === 'add-child' ? (parentCode || selected?.code || '') : '')
  // 页面下的第一个子节点默认使用列表，且类型下拉框只展示列表和表单。
  if (mode === 'add-child' && selected?.builderType === 'page') {
    draft.builderType = 'list'
  }
  draft.code = generateMenuCode()
  draft.sortIndex = findNextSortIndex(flatMenuList.value, draft.parentCode)
  draft.tstatus = 1
  formVisible.value = true
}

// 打开编辑弹窗，先复制一份草稿避免直接改脏源数据。
const openEditDialog = (node?: MenuItem) => {
  const selected = node || selectedMenu.value

  if (!selected) {
    ElMessage.warning('请先选择一个菜单')
    return
  }

  const draftItem = getDraftById(selected.id)
  if (!draftItem) {
    return
  }

  formMode.value = 'edit'
  editingId.value = selected.id
  Object.assign(draft, draftItem)
  formVisible.value = true
}

// 点击节点内容时切换当前页面，复选框只负责同步勾选。
const handleNodeClick = (node: MenuItem) => {
  selectMenu(node.id)
  emit('select', node)
}

// 复选框变动时，立即保存勾选状态到本地数据库，保证刷新后不丢失。
const handleTreeCheckChange = async () => {
  const checkedKeys = treeRef.value?.getCheckedKeys?.() ?? []
  setCheckedMenuIds(checkedKeys.map((item: string | number) => String(item)))

  // 勾选状态必须立即持久化到本地数据库，避免刷新后恢复到上次保存的状态。
  try {
    await updatePageBuilderLocalStatus({
      syncedMenuIds: flatMenuList.value
        .filter(item => item.submitStatus === 'submitted')
        .map(item => item.id),
      checkedMenuIds: [...checkedMenuIds.value]
    })
  } catch {
    // 本地数据库未连接时不阻塞用户操作，只在内存中保持勾选状态。
  }
}

// 把新增、编辑、删除后的菜单树保存到本地 Node 服务，并生成本地渲染文件和可复制代码。
const persistPageBuilderState = async () => {
  syncing.value = true
  try {
    await syncPageBuilderState({
      // 本地数据库快照中的 systemMenus 只保留系统菜单字段。
      systemMenus: snapshotSystemMenuList(flatMenuList.value),
      localState: {
        // localState 只发送给本地 PageBuilder 服务，用于 database.json 和代码生成。
        menus: snapshotLocalMenuList(flatMenuList.value),
        checkedMenuIds: [...checkedMenuIds.value]
      }
    })

    return true
  } catch {
    return false
  } finally {
    syncing.value = false
  }
}

const handleExportCode = async (node: MenuItem) => {
  handleNodeClick(node)

  // 先重新保存当前菜单树，确保最新 artifact 都带有菜单映射关系。
  const localOk = await persistPageBuilderState()

  if (!localOk) {
    ElMessage.warning('本地数据库未连接，无法导出代码')
    return
  }

  syncing.value = true

  try {
    const response = await exportPageBuilderCode(node.id)
    const contentDisposition = String(response.headers['content-disposition'] || '')
    const encodedName = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
    const fileName = encodedName
      ? decodeURIComponent(encodedName)
      : `${normalizeMenuFileName(node.comment) || 'page-builder'}-代码.zip`
    const blob = response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: 'application/zip' })
    const downloadUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = downloadUrl
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(downloadUrl)
    ElMessage.success(`「${node.comment}」及以下菜单代码已导出`)
  } catch (error) {
    const message = error instanceof Error ? error.message : '代码导出失败'
    ElMessage.error(message)
  } finally {
    syncing.value = false
  }
}

// 切换页面的主列表，并立即保存本地数据和可复制代码。
const handleSetPrimaryList = async (node: MenuItem) => {
  if (node.builderType !== 'list' || node.pageConfig?.isPrimaryList === true) {
    return
  }

  setPrimaryList(node.id)
  const localOk = await persistPageBuilderState()

  if (localOk) {
    ElMessage.success(`「${node.comment}」已设为主列表`)
  } else {
    ElMessage.warning(`「${node.comment}」已设为主列表，但本地数据库未连接`)
  }
}

const handleNodeAction = (
  action: 'view' | 'add-child' | 'set-primary' | 'export-code' | 'edit' | 'delete',
  node: MenuItem
) => {
  if (action === 'view') {
    handleNodeClick(node)
    return
  }

  if (action === 'add-child') {
    handleNodeClick(node)
    openCreateDialog('add-child', node.code)
    return
  }

  if (action === 'set-primary') {
    handleSetPrimaryList(node)
    return
  }

  if (action === 'export-code') {
    handleExportCode(node)
    return
  }

  if (action === 'edit') {
    openEditDialog(node)
    return
  }

  if (action === 'delete') {
    confirmDelete(node)
  }
}

// 保存菜单草稿，先校验再落到树数据。
const submitDraft = async () => {
  if (!formRef.value) {
    return
  }

  // 统一校验所有必填字段
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  // 列表和表单需要额外检查功能编码和功能名称
  if (showPageConfig.value) {
    const pageConfig = draft.pageConfig || createPageConfig(draft.builderType, null, draft) as PageConfig
    
    if (!pageConfig.functionCode?.trim()) {
      ElMessage.warning('请输入功能编码')
      return
    }
    
    if (!pageConfig.functionName?.trim()) {
      ElMessage.warning('请输入功能名称')
      return
    }
  }

  const current = formMode.value === 'edit' && editingId.value ? getDraftById(editingId.value) : null
  const lockedCode = current?.submitStatus === 'submitted' ? current.code.trim() : ''
  // 页面和菜单(folder)使用菜单编码；列表和表单使用功能编码
  const code = showPageConfig.value 
    ? (draftPageConfig.value.functionCode?.trim() || generateMenuCode())
    : (lockedCode || draft.code.trim() || generateMenuCode())
  const fileName = normalizeMenuFileName(draft.fileName)

  if (!fileName) {
    ElMessage.warning('请输入文件名称')
    return
  }

  let comment = draft.comment.trim()

  // 页面和菜单(folder)类型必须有菜单名称，用于菜单树显示和路径生成。
  if (!showPageConfig.value && !comment) {
    ElMessage.warning('请输入菜单名称')
    return
  }

  // 所有父级都必须是菜单或页面，列表和表单不能作为父级。
  if (draft.parentCode) {
    const parentMenu = flatMenuList.value.find(item => item.code === draft.parentCode.trim())

    // 本地菜单存在时，校验类型是否匹配。
    if (parentMenu && showPageConfig.value && parentMenu.builderType !== 'page') {

      ElMessage.warning('列表和表单只能选择页面作为父级')
      return
    }


    if (parentMenu && !showPageConfig.value && parentMenu.builderType !== 'folder') {
      ElMessage.warning('菜单和页面只能选择菜单作为父级')
      return
    }

    // 本地菜单不存在时，视为外部系统菜单编码，给出提示但不阻止保存。
    if (!parentMenu && !showPageConfig.value) {
      console.info(
        `[PageBuilder] 父级编码 "${draft.parentCode.trim()}" 不在本地菜单树中，` +
        `同步时会作为系统菜单的子菜单提交。请确认该编码在测试环境中存在。`
      )
    }
  }

  if (showPageConfig.value) {
    const pageConfig = createPageConfig(draft.builderType, draft.pageConfig, {
      code,
      comment: draft.comment.trim(),
      parentCode: draft.parentCode
    }) as PageConfig

    // 同一页面已有主列表时，当前列表只能保存为子列表。
    if (draft.builderType === 'list' && hasPrimaryList(draft.parentCode, editingId.value || '')) {
      pageConfig.isPrimaryList = false
    }

    draft.pageConfig = pageConfig
    // 列表/表单没有单独的菜单名称，功能名称同时作为菜单名称保存。
    comment = pageConfig.functionName.trim()
  } else {
    draft.pageConfig = null
  }

  if (isFolder.value) {
    draft.resource = null
  }

  const duplicate = flatMenuList.value.find(item => item.code === code && item.id !== editingId.value)
  if (duplicate) {
    ElMessage.warning('菜单编码已存在')
    return
  }

  if (lockedCode) {
    draft.code = lockedCode
  }

  if (draft.parentCode) {
    const fileNameDuplicate = flatMenuList.value.find(item => (
      item.parentCode === draft.parentCode
      && normalizeMenuFileName(item.fileName) === fileName
      && item.id !== editingId.value
    ))

    if (fileNameDuplicate) {
      ElMessage.warning('同级文件名称已存在')
      return
    }
  }

  draft.code = code
  draft.comment = comment
  draft.fileName = fileName

  if (formMode.value === 'edit' && editingId.value) {
    const current = getDraftById(editingId.value)
    if (current) {
      const invalidParents = new Set([current.code, ...collectSubtreeCodes(flatMenuList.value, current.code)])
      if (draft.parentCode && invalidParents.has(draft.parentCode)) {
        ElMessage.warning('父级不能选择自己或自己的子节点')
        return
      }
    }
  }

  if (formMode.value === 'add-child' && selectedMenu.value && draft.parentCode === draft.code.trim()) {
    ElMessage.warning('父级不能选择自己或自己的子节点')
    return
  }

  if (formMode.value === 'edit' && editingId.value) {
    const updatedMenu = updateMenu(editingId.value, draft)
    if (updatedMenu) {
      emit('select', updatedMenu)
    }
  } else {
    const createdMenu = addMenu(draft)
    // 新增后默认选中新节点，但不改变同步勾选状态。
    emit('select', createdMenu)
  }

  formVisible.value = false

  const remoteOk = await persistPageBuilderState()
  if (remoteOk) {
    ElMessage.success(formMode.value === 'edit' ? '菜单已更新' : '菜单已新增')
  } else {
    ElMessage.warning(`${formMode.value === 'edit' ? '菜单已更新' : '菜单已新增'}，但本地数据库未连接`)
  }
}

// 删除节点时级联清理其子节点。
const confirmDelete = async (node?: MenuItem) => {
  const target = node || selectedMenu.value

  if (!target) {
    ElMessage.warning('请先选择一个菜单')
    return
  }

  try {
    await ElMessageBox.confirm(`确认删除「${target.comment}」及其子节点吗？`, '删除菜单', { type: 'warning' })
    deleteMenu(target.id)
    emit('select', selectedMenu.value)
    const remoteOk = await persistPageBuilderState()
    if (remoteOk) {
      ElMessage.success('菜单已删除')
    } else {
      ElMessage.warning('菜单已删除，但本地数据库未连接')
    }
  } catch {
    // 取消删除
  }
}

// 同步按钮只提交测试环境，并更新本地菜单的同步标记，不重新生成本地代码。
const syncTree = async () => {
  const menusToSync = checkedMenuListForSync.value
  const idsToSync = menusToSync.map(item => item.id)

  if (!menusToSync.length) {
    ElMessage.info('请先勾选需要同步的菜单')
    return
  }

  syncing.value = true

  try {
    await syncPageBuilderMenusToTest(menusToSync)
    const localStatusResponse = await updatePageBuilderLocalStatus({
      syncedMenuIds: idsToSync,
      checkedMenuIds: [...checkedMenuIds.value]
    })
    const localOk = localStatusResponse.data?.code === 0

    if (!localOk) {
      ElMessage.warning('测试环境已同步，但本地数据库未连接')
      return
    }

    // 测试环境和本地数据库都成功后，才显示“已同步”。
    markMenusSynced(idsToSync)
    ElMessage.success(`已同步 ${menusToSync.length} 个菜单到测试环境`)
  } catch (error) {
    const message = error instanceof Error ? error.message : '测试环境同步失败'
    ElMessage.error(message)
  } finally {
    syncing.value = false
  }
}
</script>

<template>
  <section class="panel-card" :class="{ 'is-collapsed': collapsedProxy }" v-loading="syncing || loadingDatabase">
    <template v-if="!collapsedProxy">
      <div class="panel-search">
        <el-input
          v-model="keyword"
          placeholder="搜索菜单名称 / 编码 / 路径"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="panel-actions">
        <el-button size="small" type="primary" :disabled="syncing || loadingDatabase" @click="openCreateDialog('add-root')">
          <el-icon><Plus /></el-icon>
          新增菜单
        </el-button>
        <el-button size="small" type="success" :disabled="syncing || loadingDatabase" @click="syncTree">
          <el-icon><Refresh /></el-icon>
          同步
        </el-button>
      </div>

      <div class="tree-shell">
        <template v-if="treeMenuList.length">
          <!-- 树支持勾选，勾选结果会作为“待同步菜单”单独保存。 -->
          <el-tree
            ref="treeRef"
            :data="treeMenuList"
            node-key="id"
            highlight-current
            :current-node-key="selectedId"
            :expand-on-click-node="false"
            :check-strictly="true"
            show-checkbox
            default-expand-all
            class="tree-view"
            @check-change="handleTreeCheckChange"
          >
          <template #default="{ data }">
            <div class="tree-node" @click.stop="handleNodeClick(data)">
              <img
                v-if="data.builderType === 'folder'"
                :src="folderIcon"
                alt="菜单"
                class="tree-node-icon tree-node-icon-image"
              />
              <img
                v-else-if="data.builderType === 'list'"
                :src="listIcon"
                alt="列表"
                class="tree-node-icon tree-node-icon-image"
              />
              <img
                v-else-if="data.builderType === 'form'"
                :src="formIcon"
                alt="表单"
                class="tree-node-icon tree-node-icon-image"
              />
              <el-icon v-else class="tree-node-icon">
                <Document />
              </el-icon>
              <div class="tree-node-main">
                <span class="tree-node-label">{{ data.comment }}</span>
                <span v-if="data.builderType === 'list' && data.pageConfig?.isPrimaryList === true" class="tree-node-primary">主</span>
                <span v-if="data.submitStatus === 'submitted'" class="tree-node-status">已同步</span>
              </div>

              <el-dropdown trigger="click" @command="(command: any) => handleNodeAction(command, data)">
                <el-button text class="more-btn" @click.stop>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-if="canAddChild(data)" command="add-child">新增子菜单</el-dropdown-item>
                      <el-dropdown-item
                        v-if="data.builderType === 'list'"
                        command="set-primary"
                        :disabled="data.pageConfig?.isPrimaryList === true"
                      >
                        设为主列表
                      </el-dropdown-item>
                      <el-dropdown-item command="export-code">导出代码</el-dropdown-item>
                      <el-dropdown-item command="edit">编辑</el-dropdown-item>
                      <el-dropdown-item command="view">查看</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-tree>
        </template>

        <el-empty v-else description="没有匹配的菜单" />
      </div>
    </template>

    <el-dialog
      v-model="formVisible"
      :title="formMode === 'edit' ? '编辑菜单' : formMode === 'add-child' ? '新增子菜单' : '新增菜单'"
      width="780px"
    >
      <el-form ref="formRef" :model="draft" :rules="formRules" label-position="right" label-width="88px" size="small" class="menu-form">
        <div class="form-flow">
          <el-form-item label="类型">
            <el-select v-model="draft.builderType" class="w-full">
              <el-option
                v-for="option in availableBuilderTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item v-if="!showPageConfig" label="菜单名称" prop="comment" required>
            <el-input v-model="draft.comment" />
          </el-form-item>
          <el-form-item v-if="!showPageConfig" label="文件名称" prop="fileName" required>
            <el-input v-model="draft.fileName" placeholder="例如 menu-two" />
          </el-form-item>
          <el-form-item v-if="!showPageConfig && !isFolder" label="菜单路径">
            <el-input v-model="draft.resource" placeholder="/biz-tools/..." />
          </el-form-item>
          <el-form-item v-if="!showPageConfig" label="排序">
            <el-input-number v-model="draft.sortIndex" :min="0" :max="9999" class="w-full" />
          </el-form-item>
          <el-form-item v-if="!showPageConfig" label="菜单编码" prop="code" required>
            <el-input v-model="draft.code" :disabled="isCodeLocked" />
          </el-form-item>
          <el-form-item v-if="!showPageConfig" label="父级菜单">
            <el-tree-select
              v-model="draft.parentCode"
              :data="parentMenuTreeData"
              :props="parentMenuTreeProps"
              node-key="value"
              check-strictly
              clearable
              filterable
              default-expand-all
              class="w-full"
              placeholder="选择本地父级菜单或清空后手动输入系统菜单编码"
            />
          </el-form-item>

          <el-form-item v-if="!showPageConfig" label="父级编码">
            <el-input
              v-model="draft.parentCode"
              :disabled="Boolean(draftParent)"
              placeholder="可输入系统现有菜单编码"
            />
          </el-form-item>

          <el-form-item v-if="showPageConfig" label="文件名称" prop="fileName" required>
            <el-input v-model="draft.fileName" placeholder="例如 menu-two" />
          </el-form-item>
          <el-form-item v-if="showPageConfig" label="父级菜单" prop="parentCode" required>
            <el-tree-select
              v-model="draft.parentCode"
              :data="parentMenuTreeData"
              :props="parentMenuTreeProps"
              node-key="value"
              check-strictly
              filterable
              default-expand-all
              class="w-full"
              :disabled="formMode === 'add-child'"
              placeholder="请选择页面"
            />
          </el-form-item>
          <el-form-item v-if="showPageConfig" label="功能编码" required>
            <el-input v-model="draftPageConfig.functionCode" />
          </el-form-item>
          <el-form-item v-if="showPageConfig" label="功能名称" required>
            <el-input v-model="draftPageConfig.functionName" />
          </el-form-item>
          <el-form-item v-if="showPageConfig" label="功能类型">
            <el-input :model-value="draft.builderType === 'form' ? '表单' : '列表'" disabled />
          </el-form-item>

          <el-form-item v-if="draft.builderType === 'list'" label="是否主列表" required>
            <el-radio-group v-model="draftPageConfig.isPrimaryList">
              <el-radio :value="true" :disabled="primaryListExistsForDraft">是</el-radio>
              <el-radio :value="false">否</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="draft.builderType === 'list'" label="请求方式">
            <el-select v-model="draftPageConfig.apiUrlRequestMapping" class="w-full">
              <el-option label="GET" value="GET" />
              <el-option label="POST" value="POST" />
              <el-option label="PUT" value="PUT" />
              <el-option label="DELETE" value="DELETE" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="draft.builderType === 'list'" label="请求地址">
            <el-input v-model="draftPageConfig.apiUrl" placeholder="/api/..." />
          </el-form-item>
          <el-form-item v-if="draft.builderType === 'list'" label="选择子系统">
            <el-input v-model="draftPageConfig.systemOfConfigSource" />
          </el-form-item>
          <el-form-item v-if="draft.builderType === 'list'" label="数据来源">
            <el-input v-model="draftPageConfig.configSource" />
          </el-form-item>

          <el-form-item v-if="showPageConfig" label="备注">
            <el-input v-model="draftPageConfig.remark" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button :disabled="syncing" @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="syncing" @click="submitDraft">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.panel-card {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 18px 16px;
  background: #fff;
}

.panel-card.is-collapsed {
  padding: 16px 10px;
}

.panel-search {
  margin-bottom: 10px;
}

.panel-search :deep(.el-input__wrapper) {
  min-height: 38px;
  border-radius: 10px;
}

.panel-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.panel-actions :deep(.el-button) {
  justify-content: flex-start;
  min-height: 34px;
  padding: 0 10px;
  font-size: 12px;
}

.tree-shell {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.tree-view {
  background: transparent;
}

.tree-view :deep(.el-tree-node__content) {
  height: auto;
  padding: 6px 0;
}

.tree-node {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tree-node-main {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  justify-content: space-between;
}

.tree-node-icon {
  color: #1677ff;
  flex-shrink: 0;
}

.tree-node-icon-image {
  width: 16px;
  height: 16px;
  display: block;
  object-fit: contain;
}

.tree-node-label {
  min-width: 0;
  color: #172033;
  font-size: 13px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node-status {
  color: #2f9e68;
  font-size: 11px;
  line-height: 1.2;
  font-weight: 500;
}

.tree-node-primary {
  color: #1677ff;
  font-size: 11px;
  line-height: 1.2;
  font-weight: 600;
}

.more-btn {
  color: #98a2b3;
  flex-shrink: 0;
}

.menu-form {
  padding-right: 4px;
}

.form-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
}

.form-flow > .el-form-item {
  flex: 0 0 calc(50% - 8px);
  min-width: 0;
}

.w-full {
  width: 100%;
}

@media (max-width: 1280px) {
  .panel-card {
    padding: 18px 14px 14px;
  }
}

@media (max-width: 760px) {
  .form-flow > .el-form-item {
    flex-basis: 100%;
  }
}
</style>



