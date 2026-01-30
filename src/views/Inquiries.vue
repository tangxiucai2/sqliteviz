<template>
  <div id="my-inquiries-container">
    <div v-if="allInquiries.length === 0" id="start-guide">
      您目前还没有保存的查询。
      <span class="link" @click="emitCreateTabEvent">创建</span>
      一个新查询或从文件
      <span class="link" @click="importInquiries">导入</span>。
    </div>
    <div
      v-if="$store.state.loadingPredefinedInquiries"
      id="loading-predefined-status"
    >
      <loading-indicator />
      正在加载预定义查询...
    </div>
    <div
      v-show="allInquiries.length > 0"
      id="my-inquiries-content"
      ref="my-inquiries-content"
    >
      <div id="my-inquiries-toolbar">
        <div id="toolbar-buttons">
          <button
            id="toolbar-btns-import"
            class="toolbar"
            @click="importInquiries"
          >
            导入
          </button>
          <button
            v-show="selectedInquiriesCount > 0"
            id="toolbar-btns-export"
            class="toolbar"
            @click="exportSelectedInquiries()"
          >
            导出
          </button>
          <button
            v-show="selectedNotPredefinedCount > 0"
            id="toolbar-btns-delete"
            class="toolbar"
            @click="showDeleteDialog(selectedInquiriesIds)"
          >
            删除
          </button>
        </div>
        <div id="toolbar-search">
          <text-field
            v-model="filter"
            placeholder="按名称搜索查询"
            width="300px"
          />
        </div>
      </div>

      <div v-show="showedInquiries.length === 0" id="inquiries-not-found">
        未找到查询
      </div>

      <div v-show="showedInquiries.length > 0" class="rounded-bg">
        <div class="header-container">
          <div>
            <div ref="name-th" class="fixed-header">
              <check-box
                ref="mainCheckBox"
                theme="light"
                @click="toggleSelectAll"
              />
              <div class="name-th">名称</div>
            </div>
            <div class="fixed-header">报表类别</div>
            <div class="fixed-header">类型</div>
            <div class="fixed-header">创建时间</div>
            <div class="fixed-header">操作</div>
          </div>
        </div>
        <div
          class="table-container"
          :style="{ 'max-height': `${maxTableHeight}px` }"
        >
          <table ref="table" class="sqliteviz-table">
            <tbody>
              <tr
                v-for="(inquiry, index) in showedInquiries"
                :key="inquiry.id"
                @click="openInquiry(index)"
              >
                <td ref="name-td">
                  <div class="cell-data">
                    <check-box
                      ref="rowCheckBox"
                      :init="selectAll || selectedInquiriesIds.has(inquiry.id)"
                      data-test="rowCheckBox"
                      @click="toggleRow($event, inquiry.id)"
                    />
                    <div class="name">{{ inquiry.name }}</div>
                  </div>
                </td>
                <td>
                  <div class="category-column">
                    {{ inquiry.category || '默认类别' }}
                  </div>
                </td>
                <td>
                  <div class="type-column">
                    {{ inquiry.type === 'system' ? '系统内置' : '自定义' }}
                  </div>
                </td>
                <td>
                  <div class="date-container">
                    {{ createdAtFormatted(inquiry.createdAt) }}
                  </div>
                </td>
                <td>
                  <div class="actions-container">
                    <span
                      v-if="inquiry.type !== 'system'"
                      class="action-item"
                      @click="showRenameDialog(inquiry.id)"
                    >
                      <rename-icon class="action-icon" />
                      <span class="action-text">修改</span>
                    </span>
                    <span
                      class="action-item"
                      @click="duplicateInquiry(index)"
                    >
                      <copy-icon class="action-icon" />
                      <span class="action-text">复制</span>
                    </span>
                    <span
                      class="action-item"
                      @click="exportToFile([inquiry], `${inquiry.name}.json`)"
                    >
                      <export-icon class="action-icon" />
                      <span class="action-text">导出</span>
                    </span>
                    <span
                      v-if="inquiry.type !== 'system'"
                      class="action-item"
                      @click="showDeleteDialog(new Set().add(inquiry.id))"
                    >
                      <delete-icon class="action-icon" />
                      <span class="action-text">删除</span>
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!--Rename Inquiry dialog  -->
    <modal modalId="rename" class="dialog" contentStyle="width: 560px;">
      <div class="dialog-header">
        重命名查询
        <close-icon @click="$modal.hide('rename')" />
      </div>
      <div class="dialog-body">
        <text-field
          v-model="newName"
          label="新查询名称"
          :errorMsg="errorMsg"
          width="100%"
        />
      </div>
      <div class="dialog-buttons-container">
        <button class="secondary" @click="$modal.hide('rename')">取消</button>
        <button class="primary" @click="renameInquiry">重命名</button>
      </div>
    </modal>

    <!--Delete Inquiry dialog  -->
    <modal modalId="delete" class="dialog" contentStyle="width: 480px;">
      <div class="dialog-header">
        删除{{ deleteGroup ? '查询' : '查询' }}
        <close-icon @click="$modal.hide('delete')" />
      </div>
      <div class="dialog-body">
        {{ deleteDialogMsg }}
        <div
          v-show="selectedInquiriesCount > selectedNotPredefinedCount"
          id="note"
        >
          <img src="~@/assets/images/info.svg" />
          注意：您选择的预定义查询不会被删除
        </div>
      </div>
      <div class="dialog-buttons-container">
        <button class="secondary" @click="$modal.hide('delete')">取消</button>
        <button class="primary" @click="deleteInquiry">删除</button>
      </div>
    </modal>
  </div>
</template>

<script>
import CheckBox from '@/components/Common/CheckBox'
import LoadingIndicator from '@/components/Common/LoadingIndicator'
import TextField from '@/components/Common/TextField'
import CloseIcon from '@/components/svg/close'
import CopyIcon from '@/components/svg/copy'
import DeleteIcon from '@/components/svg/delete'
import ExportIcon from '@/components/svg/export'
import RenameIcon from '@/components/svg/rename'
import eventBus from '@/lib/eventBus'
import storedInquiries from '@/lib/storedInquiries'
import tooltipMixin from '@/tooltipMixin'

export default {
  name: 'Inquiries',
  components: {
    RenameIcon,
    CopyIcon,
    ExportIcon,
    DeleteIcon,
    CloseIcon,
    TextField,
    CheckBox,
    LoadingIndicator
  },
  mixins: [tooltipMixin],
  data() {
    return {
      filter: null,
      newName: null,
      processedInquiryId: null,
      errorMsg: null,
      selectedInquiriesIds: new Set(),
      selectedInquiriesCount: 0,
      selectedNotPredefinedCount: 0,
      selectAll: false,
      deleteGroup: false,
      resizeObserver: null,
      maxTableHeight: 0
    }
  },
  computed: {
    inquiries() {
      return this.$store.state.inquiries
    },
    predefinedInquiries() {
      return this.$store.state.predefinedInquiries.map(inquiry => {
        inquiry.isPredefined = true
        return inquiry
      })
    },
    predefinedInquiriesIds() {
      return new Set(this.predefinedInquiries.map(inquiry => inquiry.id))
    },
    showedInquiries() {
      let showedInquiries = this.allInquiries
      if (this.filter) {
        showedInquiries = showedInquiries.filter(
          inquiry =>
            inquiry.name.toUpperCase().indexOf(this.filter.toUpperCase()) >= 0
        )
      }
      return showedInquiries
    },

    allInquiries() {
      return this.predefinedInquiries.concat(this.inquiries)
    },
    processedInquiryIndex() {
      return this.inquiries.findIndex(
        inquiry => inquiry.id === this.processedInquiryId
      )
    },
    deleteDialogMsg() {
      if (
        !this.deleteGroup &&
        (this.processedInquiryIndex === null ||
          this.processedInquiryIndex < 0 ||
          this.processedInquiryIndex > this.inquiries.length)
      ) {
        return ''
      }

      const deleteItem = this.deleteGroup
        ? `${this.selectedNotPredefinedCount} ${
            this.selectedNotPredefinedCount > 1 ? 'inquiries' : 'inquiry'
          }`
        : `"${this.inquiries[this.processedInquiryIndex].name}"`

      return `您确定要删除${deleteItem}吗？`
    }
  },
  watch: {
    showedInquiries: {
      handler() {
        this.selectedInquiriesIds = new Set(
          this.showedInquiries
            .filter(inquiry => this.selectedInquiriesIds.has(inquiry.id))
            .map(inquiry => inquiry.id)
        )
        this.selectedInquiriesCount = this.selectedInquiriesIds.size
        this.selectedNotPredefinedCount = [...this.selectedInquiriesIds].filter(
          id => !this.predefinedInquiriesIds.has(id)
        ).length

        if (this.selectedInquiriesIds.size < this.showedInquiries.length) {
          if (this.$refs.mainCheckBox) {
            this.$refs.mainCheckBox.checked = false
          }
          this.selectAll = false
        }
      },
      deep: true
    }
  },
  async created() {
    const loadingPredefinedInquiries =
      this.$store.state.loadingPredefinedInquiries
    const predefinedInquiriesLoaded =
      this.$store.state.predefinedInquiriesLoaded
    if (!predefinedInquiriesLoaded && !loadingPredefinedInquiries) {
      try {
        this.$store.commit('setLoadingPredefinedInquiries', true)
        const inquiries = await storedInquiries.readPredefinedInquiries()
        this.$store.commit('updatePredefinedInquiries', inquiries)
        this.$store.commit('setPredefinedInquiriesLoaded', true)
      } catch (e) {
        console.error(e)
      }
      this.$store.commit('setLoadingPredefinedInquiries', false)
    }
  },
  mounted() {
    this.resizeObserver = new ResizeObserver(this.calcMaxTableHeight)
    this.resizeObserver.observe(this.$refs['my-inquiries-content'])

    this.tableResizeObserver = new ResizeObserver(this.calcNameWidth)
    this.tableResizeObserver.observe(this.$refs.table)
    this.calcNameWidth()
    this.calcMaxTableHeight()
  },
  beforeUnmount() {
    this.resizeObserver.unobserve(this.$refs['my-inquiries-content'])
    this.tableResizeObserver.unobserve(this.$refs.table)
  },
  methods: {
    emitCreateTabEvent() {
      eventBus.$emit('createNewInquiry')
    },
    createdAtFormatted(value) {
      if (!value) {
        return ''
      }
      const date = new Date(value)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    calcNameWidth() {
      const nameWidth =
        this.$refs['name-td'] && this.$refs['name-td'][0]
          ? this.$refs['name-td'][0].getBoundingClientRect().width
          : 0
      this.$refs['name-th'].style = `width: ${nameWidth}px`
    },
    calcMaxTableHeight() {
      const freeSpace = this.$refs['my-inquiries-content'].offsetHeight - 200
      this.maxTableHeight = freeSpace - (freeSpace % 40) + 1
    },
    openInquiry(index) {
      const tab = this.showedInquiries[index]
      setTimeout(() => {
        this.$store.dispatch('addTab', tab).then(id => {
          this.$store.commit('setCurrentTabId', id)
          this.$router.push('/workspace')
        })
      })
    },
    showRenameDialog(id) {
      this.errorMsg = null
      this.processedInquiryId = id
      this.newName = this.inquiries[this.processedInquiryIndex].name
      this.$modal.show('rename')
    },
    renameInquiry() {
      if (!this.newName) {
        this.errorMsg = '查询名称不能为空'
        return
      }
      this.$store.dispatch('renameInquiry', {
        inquiryId: this.processedInquiryId,
        newName: this.newName
      })

      // hide dialog
      this.$modal.hide('rename')
    },
    duplicateInquiry(index) {
      const newInquiry = storedInquiries.duplicateInquiry(
        this.showedInquiries[index]
      )
      this.$store.dispatch('addInquiry', newInquiry)
    },
    showDeleteDialog(idsSet) {
      this.deleteGroup = idsSet.size > 1
      if (!this.deleteGroup) {
        this.processedInquiryId = idsSet.values().next().value
      }
      this.$modal.show('delete')
    },
    deleteInquiry() {
      this.$modal.hide('delete')
      if (!this.deleteGroup) {
        this.$store.dispatch(
          'deleteInquiries',
          new Set().add(this.processedInquiryId)
        )

        // Clear checkbox
        if (this.selectedInquiriesIds.has(this.processedInquiryId)) {
          this.selectedInquiriesIds.delete(this.processedInquiryId)
        }
      } else {
        this.$store.dispatch('deleteInquiries', this.selectedInquiriesIds)

        // Clear checkboxes
        this.selectedInquiriesIds.clear()
      }
      this.selectedInquiriesCount = this.selectedInquiriesIds.size
    },
    exportToFile(inquiryList, fileName) {
      storedInquiries.export(inquiryList, fileName)
    },
    exportSelectedInquiries() {
      const inquiryList = this.allInquiries.filter(inquiry =>
        this.selectedInquiriesIds.has(inquiry.id)
      )

      this.exportToFile(inquiryList, 'My sqliteviz inquiries.json')
    },

    importInquiries() {
      storedInquiries.importInquiries().then(importedInquiries => {
        this.$store.commit(
          'setInquiries',
          this.inquiries.concat(importedInquiries)
        )
      })
    },

    toggleSelectAll(checked) {
      this.selectAll = checked
      this.$refs.rowCheckBox.forEach(item => {
        item.checked = checked
      })

      this.selectedInquiriesIds = checked
        ? new Set(this.showedInquiries.map(inquiry => inquiry.id))
        : new Set()

      this.selectedInquiriesCount = this.selectedInquiriesIds.size
      this.selectedNotPredefinedCount = checked
        ? [...this.selectedInquiriesIds].filter(
            id => !this.predefinedInquiriesIds.has(id)
          ).length
        : 0
    },

    toggleRow(checked, id) {
      const isPredefined = this.predefinedInquiriesIds.has(id)
      if (checked) {
        this.selectedInquiriesIds.add(id)
        if (!isPredefined) {
          this.selectedNotPredefinedCount += 1
        }
      } else {
        if (this.selectedInquiriesIds.size === this.showedInquiries.length) {
          this.$refs.mainCheckBox.checked = false
          this.selectAll = false
        }
        this.selectedInquiriesIds.delete(id)
        if (!isPredefined) {
          this.selectedNotPredefinedCount -= 1
        }
      }
      this.selectedInquiriesCount = this.selectedInquiriesIds.size
    }
  }
}
</script>

<style scoped>
#my-inquiries-container {
  position: relative;
}

#loading-predefined-status {
  position: absolute;
  right: 0;
  display: flex;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-light-2);
  align-items: center;
  padding: 8px;
}

#start-guide {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--color-text-base);
  font-size: 14px;
  text-align: center;
}

#inquiries-not-found {
  padding: 35px 5px;
  border-radius: 5px;
  border: 1px solid var(--color-border-light);
  color: var(--color-text-base);
  font-size: 14px;
  text-align: center;
}

#my-inquiries-content {
  padding: 52px;
  height: 100%;
  box-sizing: border-box;
}

#my-inquiries-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
  margin: 0 auto 8px;
  max-width: 1500px;
  width: 100%;
}

.rounded-bg {
  padding-top: 40px;
  margin: 0 auto;
  max-width: 1500px;
  width: 100%;
}
.fixed-header {
  padding: 11px 24px;
}
.fixed-header:first-child {
  display: flex;
  align-items: center;
  padding-left: 12px;
}
.fixed-header:first-child .name-th {
  margin-left: 24px;
}

table.sqliteviz-table {
  margin-top: 0;
  width: 100%;
}

.sqliteviz-table tbody tr td {
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  text-align: left;
}

.sqliteviz-table tbody tr td:first-child {
  width: 30%;
  max-width: 0;
  padding: 0 12px;
}

.sqliteviz-table tbody tr td:nth-child(2),
.sqliteviz-table tbody tr td:nth-child(3) {
  width: 15%;
  max-width: 0;
  padding: 0 12px;
}

.sqliteviz-table tbody tr td:nth-child(4) {
  width: 20%;
  max-width: 0;
  padding: 0 12px;
}

.sqliteviz-table tbody tr td:last-child {
  width: 20%;
  max-width: 0;
  padding: 0 12px;
}

.sqliteviz-table tbody .cell-data {
  display: flex;
  align-items: center;
  max-width: 100%;
  width: 100%;
}
.sqliteviz-table tbody .cell-data div.name {
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: 24px;
}

.sqliteviz-table tbody tr:hover td {
  cursor: pointer;
}

.sqliteviz-table tbody tr:hover td {
  color: var(--color-text-active);
}

/* 操作容器样式 */
.actions-container {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

/* 操作项样式 */
.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: var(--color-primary);
  font-size: 14px;
  transition: color 0.2s;
}

.action-item:hover {
  color: var(--color-primary-dark);
}

/* 操作图标样式 */
.action-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

/* 操作文字样式 */
.action-text {
  white-space: nowrap;
}

/* 日期容器样式 */
.date-container {
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dialog input {
  width: 100%;
}

button.toolbar {
  margin-right: 16px;
}

/* 移除旧的图标容器样式 */
.icons-container,
.badge {
  display: none;
}

#note {
  margin-top: 24px;
}
#note img {
  vertical-align: middle;
}
.icon-tooltip {
  display: block;
  width: 149px;
  white-space: normal;
  height: auto;
  line-height: normal;
  padding: 6px;
}
</style>
