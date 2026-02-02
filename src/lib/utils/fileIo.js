export default {
  isJSON(file) {
    return file && file.type === 'application/json'
  },
  isNDJSON(file) {
    return file && file.name.endsWith('.ndjson')
  },
  isDatabase(file) {
    const dbTypes = ['application/vnd.sqlite3', 'application/x-sqlite3']
    return file.type
      ? dbTypes.includes(file.type)
      : /\.(db|sqlite(3)?)+$/.test(file.name)
  },

  getFileName(file) {
    return file.name.replace(/\.[^.]+$/, '')
  },

  downloadFromUrl(url, fileName) {
    // Create downloader
    const downloader = document.createElement('a')
    downloader.href = url
    downloader.download = fileName

    // Trigger click
    downloader.click()

    // Clean up
    URL.revokeObjectURL(url)
  },

  async exportToFile(str, fileName, type = 'octet/stream') {
    const blob = new Blob([str], { type })
    const url = URL.createObjectURL(blob)
    this.downloadFromUrl(url, fileName)
  },

  /**
   * Note: if user press Cancel in file choosing dialog
   * it will be an unsettled promise. But it's grabbed by
   * the garbage collector (tested with FinalizationRegistry).
   */
  getFileFromUser(type) {
    return new Promise(resolve => {
      const uploader = document.createElement('input')

      uploader.type = 'file'
      uploader.accept = type

      uploader.addEventListener('change', () => {
        const file = uploader.files[0]
        resolve(file)
      })

      uploader.click()
    })
  },

  importFile() {
    return this.getFileFromUser('.json').then(file => {
      return this.getFileContent(file)
    })
  },

  getFileContent(file) {
    const reader = new FileReader()
    return new Promise(resolve => {
      reader.onload = e => resolve(e.target.result)
      reader.readAsText(file)
    })
  },

  readFile(path) {
    return fetch(path)
  },

  readAsArrayBuffer(file) {
    const fileReader = new FileReader()

    return new Promise((resolve, reject) => {
      fileReader.onerror = () => {
        fileReader.abort()
        reject(new Error('Problem parsing input file.'))
      }

      fileReader.onload = () => {
        resolve(fileReader.result)
      }
      fileReader.readAsArrayBuffer(file)
    })
  },

  async exportToZip(files, fileName) {
    try {
      // 动态导入JSZip库
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()
      
      // 添加文件到压缩包
      files.forEach(file => {
        zip.file(file.name, file.content)
      })
      
      // 生成压缩包
      const zipContent = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipContent)
      
      // 下载压缩包
      const downloader = document.createElement('a')
      downloader.href = url
      downloader.download = `${fileName}.zip`
      downloader.click()
      
      // 清理
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('生成压缩包时发生错误:', error)
      throw error
    }
  }
}
