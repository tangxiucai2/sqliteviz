import config from '@/config'
import events from '@/lib/utils/events'

function getNewDatabase() {
  return new Database()
}

export default {
  getNewDatabase
}

class Database {
  constructor() {
    this.dbName = 'database'
    this.schema = null
  }

  shutDown() {
    // No need to shut down anything with backend API
  }

  createProgressCounter(callback) {
    // Not needed with backend API
    return 0
  }

  deleteProgressCounter(id) {
    // Not needed with backend API
  }

  async addTableFromCsv(tabName, data, progressCounterId) {
    // Not implemented with backend API
    throw new Error('CSV import is not supported with backend API')
  }

  async loadDb(file) {
    // Not needed with backend API
    this.dbName = 'database'
    // Don't load schema from database, it will be handled by backend
    events.send('database.import', 0, {
      from: 'api',
      new_db: true
    })
  }

  async refreshSchema() {
    // Schema refresh is not needed with backend API
    // Backend will handle schema management
    this.schema = []
  }

  async execute(commands) {
    try {
      const { baseUrl, apiPrefix, endpoints } = config.backend
      const apiUrl = `${baseUrl}${apiPrefix}/${endpoints.executeSql}`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: commands,
          params: []
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const responseData = await response.json()
      // API returns { code: 200, msg: "success", data: [results] }
      // if it was more than one select - take only the last one
      const results = responseData.data || []
      return results[results.length - 1]
    } catch (error) {
      throw new Error(error.message)
    }
  }

  async export(fileName) {
    // Not implemented with backend API
    throw new Error('Export is not supported with backend API')
  }

  async validateTableName(name) {
    if (name.startsWith('sqlite_')) {
      throw new Error("Table name can't start with sqlite_")
    }

    if (/[^\w]/.test(name)) {
      throw new Error(
        'Table name can contain only letters, digits and underscores'
      )
    }

    if (/^(\d)/.test(name)) {
      throw new Error("Table name can't start with a digit")
    }

    // Skip the actual validation with database, as we're using backend API
    // and table creation is handled by backend
  }

  sanitizeTableName(tabName) {
    return tabName
      .replace(/[^\w]/g, '_') // replace everything that is not letter, digit or _  with _
      .replace(/^(\d)/, '_$1') // add _ at beginning if starts with digit
      .replace(/_{2,}/g, '_') // replace multiple _ with one _
  }
}
