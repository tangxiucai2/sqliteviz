<template>
  <modal
    :modalId="dialogName"
    class="dialog"
    contentClass="import-modal"
    scrollable
    :clickToClose="false"
  >
    <div class="dialog-header">
      {{ typeName }} 导入
      <close-icon :disabled="disableDialog" @click="cancelImport" />
    </div>
    <div class="dialog-body">
      <text-field
        id="csv-json-table-name"
        v-model="tableName"
        label="表名"
        width="484px"
        :disabled="disableDialog"
        :errorMsg="tableNameError"
      />
      <div v-if="!isJson && !isNdJson" class="chars">
        <delimiter-selector
          v-model="delimiter"
          width="210px"
          class="char-input"
          :disabled="disableDialog"
          @input="preview"
        />
        <text-field
          id="quote-char"
          v-model="quoteChar"
          label="引用字符"
          hint="用于引用字段的字符。"
          width="93px"
          :disabled="disableDialog"
          class="char-input"
          @input="preview"
        />
        <text-field
          id="escape-char"
          v-model="escapeChar"
          label="转义字符"
          hint='
            用于在字段内转义引号字符的字符
            （例如 "包含""引号"" 的文本列"）。
          '
          maxHintWidth="242px"
          width="93px"
          :disabled="disableDialog"
          class="char-input"
          @input="preview"
        />
      </div>
      <check-box
        v-if="!isJson && !isNdJson"
        :init="header"
        label="使用第一行作为列标题"
        :disabled="disableDialog"
        @click="changeHeaderDisplaying"
      />
      <sql-table
        v-if="previewData && previewData.rowCount > 0"
        :data-set="previewData"
        :preview="true"
        class="preview-table"
      />
      <div v-else class="no-data">无数据</div>
      <logs class="import-errors" :messages="importMessages" />
    </div>
    <div class="dialog-buttons-container">
      <button
        id="import-cancel"
        class="secondary"
        :disabled="disableDialog"
        @click="cancelImport"
      >
        取消
      </button>
      <button
        v-show="!importCompleted"
        id="import-start"
        class="primary"
        :disabled="disableDialog || disableImport"
        @click="loadToDb(file)"
      >
        导入
      </button>
      <button
        v-show="importCompleted"
        id="import-finish"
        class="primary"
        :disabled="disableDialog"
        @click="finish"
      >
        完成
      </button>
    </div>
  </modal>
</template>

<script>
import CheckBox from '@/components/Common/CheckBox'
import Logs from '@/components/Common/Logs'
import TextField from '@/components/Common/TextField'
import SqlTable from '@/components/SqlTable'
import CloseIcon from '@/components/svg/close'
import csv from '@/lib/csv'
import events from '@/lib/utils/events'
import fIo from '@/lib/utils/fileIo'
import time from '@/lib/utils/time'
import DelimiterSelector from './DelimiterSelector'

export default {
  name: 'CsvJsonImport',
  components: {
    CloseIcon,
    TextField,
    DelimiterSelector,
    CheckBox,
    SqlTable,
    Logs
  },
  props: {
    file: File,
    db: Object,
    dialogName: String
  },
  emits: ['cancel', 'finish'],
  data() {
    return {
      disableDialog: false,
      disableImport: false,
      tableName: '',
      delimiter: '',
      quoteChar: '"',
      escapeChar: '"',
      header: true,
      importCompleted: false,
      importMessages: [],
      previewData: null,
      addedTable: null,
      tableNameError: ''
    }
  },
  computed: {
    isJson() {
      return fIo.isJSON(this.file)
    },
    isNdJson() {
      return fIo.isNDJSON(this.file)
    },
    typeName() {
      return this.isJson || this.isNdJson ? 'JSON' : 'CSV'
    }
  },
  watch: {
    isJson() {
      if (this.isJson) {
        this.delimiter = '\u001E'
        this.header = false
      }
    },
    isNdJson() {
      if (this.isNdJson) {
        this.delimiter = '\u001E'
        this.header = false
      }
    },
    tableName: time.debounce(function () {
      this.tableNameError = ''
      if (!this.tableName) {
        return
      }
      this.db.validateTableName(this.tableName).catch(err => {
        this.tableNameError = err.message + '。请尝试其他表名。'
      })
    }, 400)
  },
  methods: {
    changeHeaderDisplaying(e) {
      this.header = e
      this.preview()
    },
    cancelImport() {
      if (!this.disableDialog) {
        if (this.addedTable) {
          this.db.execute(`DROP TABLE "${this.addedTable}"`)
          this.db.refreshSchema()
        }
        this.$modal.hide(this.dialogName)
        this.$emit('cancel')
      }
    },
    reset() {
      this.header = !this.isJson && !this.isNdJson
      this.quoteChar = '"'
      this.escapeChar = '"'
      this.delimiter = !this.isJson && !this.isNdJson ? '' : '\u001E'
      this.tableName = ''
      this.disableDialog = false
      this.disableImport = false
      this.importCompleted = false
      this.importMessages = []
      this.previewData = null
      this.addedTable = null
      this.tableNameError = ''
    },
    open() {
      this.tableName = this.db.sanitizeTableName(fIo.getFileName(this.file))
      this.$modal.show(this.dialogName)
    },
    async preview() {
      this.disableImport = false
      if (!this.file) {
        return
      }
      this.importCompleted = false
      const config = {
        preview: 3,
        quoteChar: this.quoteChar || '"',
        escapeChar: this.escapeChar,
        header: this.header,
        delimiter: this.delimiter,
        columns: !this.isJson && !this.isNdJson ? null : ['doc']
      }
      try {
        const start = new Date()
        const parseResult = this.isJson
          ? await this.getJsonParseResult(this.file)
          : await csv.parse(this.file, config)
        const end = new Date()
        this.previewData = parseResult.data
        this.previewData.rowCount = parseResult.rowCount
        this.delimiter = parseResult.delimiter

        // In parseResult.messages we can get parse errors
        this.importMessages = parseResult.messages || []

        if (this.previewData.rowCount === 0) {
          this.disableImport = true
          this.importMessages.push({
            type: 'info',
            message: '没有要导入的行。'
          })
        }

        if (!parseResult.hasErrors) {
          this.importMessages.push({
            message: `预览解析已在 ${time.getPeriod(start, end)} 内完成。`,
            type: 'success'
          })
        }
      } catch (err) {
        console.error(err)
        this.importMessages = [
          {
            message: err,
            type: 'error'
          }
        ]
      }
    },
    async getJsonParseResult(file) {
      const jsonContent = await fIo.getFileContent(file)
      const isEmpty = !jsonContent.trim()
      return {
        data: {
          columns: ['doc'],
          values: { doc: !isEmpty ? [jsonContent] : [] }
        },
        hasErrors: false,
        messages: [],
        rowCount: +!isEmpty
      }
    },
    async loadToDb(file) {
      if (!this.tableName) {
        this.tableNameError = '表名不能为空'
        return
      }

      this.disableDialog = true
      const config = {
        quoteChar: this.quoteChar || '"',
        escapeChar: this.escapeChar,
        header: this.header,
        delimiter: this.delimiter,
        columns: !this.isJson && !this.isNdJson ? null : ['doc']
      }
      let parsingMsg = {}
      this.importMessages.push({
        message: `正在解析 ${this.typeName}...`,
        type: 'info'
      })
      // Get *reactive* link to parsing message for later updates
      parsingMsg = this.importMessages[this.importMessages.length - 1]
      const parsingLoadingIndicator = setTimeout(() => {
        parsingMsg.type = 'loading'
      }, 1000)

      let importMsg = {}
      let importLoadingIndicator = null

      const updateProgress = progress => {
        importMsg.progress = progress
      }
      const progressCounterId = this.db.createProgressCounter(updateProgress)

      try {
        let start = new Date()
        const parseResult = this.isJson
          ? await this.getJsonParseResult(file)
          : await csv.parse(this.file, config)

        let end = new Date()

        if (!parseResult.hasErrors) {
          const rowCount = parseResult.rowCount
          let period = time.getPeriod(start, end)
          parsingMsg.type = 'success'

          if (parseResult.messages.length > 0) {
            this.importMessages = this.importMessages.concat(
              parseResult.messages
            )
            parsingMsg.message = `${rowCount} 行已在 ${period} 内解析。`
          } else {
            // Inform about parsing success
            parsingMsg.message = `${rowCount} 行已在 ${period} 内成功解析。`
          }

          // Loading indicator for parsing is not needed anymore
          clearTimeout(parsingLoadingIndicator)

          // Add info about import start
          this.importMessages.push({
            message: `正在将 ${this.typeName} 导入数据库...`,
            type: 'info'
          })
          importMsg = this.importMessages[this.importMessages.length - 1]

          // Show import progress after 1 second
          importLoadingIndicator = setTimeout(() => {
            importMsg.type = 'loading'
          }, 1000)

          // Add table
          start = new Date()
          await this.db.addTableFromCsv(
            this.tableName,
            parseResult.data,
            progressCounterId
          )
          end = new Date()

          this.addedTable = this.tableName
          // Inform about import success
          period = time.getPeriod(start, end)
          importMsg.message = `将 ${this.typeName} 导入 SQLite 数据库已在 ${period} 内完成。`
          importMsg.type = 'success'

          // Loading indicator for import is not needed anymore
          clearTimeout(importLoadingIndicator)

          this.importCompleted = true
        } else {
          parsingMsg.message = '解析结束，存在错误。'
          parsingMsg.type = 'info'
          this.importMessages = this.importMessages.concat(parseResult.messages)
        }
      } catch (err) {
        console.error(err)
        if (parsingMsg.type === 'loading') {
          parsingMsg.type = 'info'
        }

        if (importMsg.type === 'loading') {
          importMsg.type = 'info'
        }

        this.importMessages.push({
          message: err,
          type: 'error'
        })
      }

      clearTimeout(parsingLoadingIndicator)
      clearTimeout(importLoadingIndicator)
      this.db.deleteProgressCounter(progressCounterId)
      this.disableDialog = false
    },
    async finish() {
      this.$modal.hide(this.dialogName)
      const stmt = this.getQueryExample()
      const tabId = await this.$store.dispatch('addTab', { query: stmt })
      this.$store.commit('setCurrentTabId', tabId)
      this.importCompleted = false
      this.$emit('finish')
      events.send('inquiry.create', null, { auto: true })
    },
    getQueryExample() {
      return this.isNdJson
        ? this.getNdJsonQueryExample()
        : this.isJson
          ? this.getJsonQueryExample()
          : [
              '/*',
              ` * 您的 CSV 文件已导入到 ${this.addedTable} 表中。`,
              ' * 您可以运行此 SQL 查询，使所有 CSV 记录可用于图表绘制。',
              ' */',
              `SELECT * FROM "${this.addedTable}"`
            ].join('\n')
    },
    getNdJsonQueryExample() {
      try {
        const firstRowJson = JSON.parse(this.previewData.values.doc[0])
        const firstKey = Object.keys(firstRowJson)[0]
        return [
          '/*',
          ` * 您的 NDJSON 文件已导入到 ${this.addedTable} 表中。`,
          ` * 运行此 SQL 查询以获取属性 ${firstKey} 的值，` +
            '并使它们可用于图表绘制。',
          ' */',
          `SELECT doc->>'${firstKey}'`,
          `FROM "${this.addedTable}"`
        ].join('\n')
      } catch (err) {
        console.error(err)
        return [
          '/*',
          ` * 您的 NDJSON 文件已导入到 ${this.addedTable} 表中。`,
          ' */',
          'SELECT *',
          `FROM "${this.addedTable}"`
        ].join('\n')
      }
    },
    getJsonQueryExample() {
      try {
        const firstRowJson = JSON.parse(this.previewData.values.doc[0])
        const firstKey = Object.keys(firstRowJson)[0]
        return [
          '/*',
          ` * 您的 JSON 文件已导入到 ${this.addedTable} 表中。`,
          ` * 运行此 SQL 查询以获取属性 ${firstKey} 的值，` +
            '并使它们可用于图表绘制。',
          ' */',
          'SELECT *',
          `FROM "${this.addedTable}"`,
          `JOIN json_each(doc, '$.${firstKey}')`
        ].join('\n')
      } catch (err) {
        console.error(err)
        return [
          '/*',
          ` * 您的 NDJSON 文件已导入到 ${this.addedTable} 表中。`,
          ' */',
          'SELECT *',
          `FROM "${this.addedTable}"`
        ].join('\n')
      }
    }
  }
}
</script>

<style>
.import-modal {
  width: 80%;
  max-width: 1152px;
  margin: auto;
  left: 0 !important;
}
</style>

<style scoped>
.dialog-body {
  padding-bottom: 0;
}

#csv-json-table-name {
  margin-bottom: 24px;
}

.chars {
  display: flex;
  align-items: flex-end;
  margin: 0 0 20px;
}
.char-input {
  margin-right: 44px;
}
.preview-table {
  margin-top: 18px;
}

.import-errors {
  height: 136px;
  margin-top: 8px;
}
.no-data {
  margin-top: 32px;
  background-color: white;
  border-radius: 5px;
  position: relative;
  border: 1px solid var(--color-border-light);
  box-sizing: border-box;
  height: 147px;
  font-size: 13px;
  color: var(--color-text-base);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
