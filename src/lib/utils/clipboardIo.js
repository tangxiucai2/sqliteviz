import dataUrlToBlob from 'dataurl-to-blob'

// 简单的通知函数
function showNotification(message) {
  // 创建通知元素
  const notification = document.createElement('div')
  notification.style.position = 'fixed'
  notification.style.top = '20px'
  notification.style.right = '20px'
  notification.style.padding = '12px 20px'
  notification.style.backgroundColor = '#333'
  notification.style.color = '#fff'
  notification.style.borderRadius = '4px'
  notification.style.zIndex = '9999'
  notification.style.fontSize = '14px'
  notification.style.transition = 'all 0.3s ease'
  notification.style.opacity = '0'
  notification.style.transform = 'translateX(100%)'
  notification.textContent = message
  
  // 添加到文档
  document.body.appendChild(notification)
  
  // 显示通知
  setTimeout(() => {
    notification.style.opacity = '1'
    notification.style.transform = 'translateX(0)'
  }, 10)
  
  // 3秒后隐藏通知
  setTimeout(() => {
    notification.style.opacity = '0'
    notification.style.transform = 'translateX(100%)'
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 3000)
}

export default {
  async copyText(str, notifyMessage) {
    await navigator.clipboard.writeText(str)
    if (notifyMessage) {
      showNotification(notifyMessage)
    }
  },

  async copyImage(source) {
    if (source instanceof HTMLCanvasElement) {
      return this._copyCanvas(source)
    } else {
      return this._copyFromDataUrl(source)
    }
  },

  async _copyBlob(blob) {
    await navigator.clipboard.write([
      new ClipboardItem({
        // eslint-disable-line no-undef
        [blob.type]: blob
      })
    ])
  },

  async _copyFromDataUrl(url) {
    const blob = dataUrlToBlob(url)
    await this._copyBlob(blob)
    showNotification('Image copied to clipboard successfully')
  },

  async _copyCanvas(canvas) {
    canvas.toBlob(
      async blob => {
        await this._copyBlob(blob)
        showNotification('Image copied to clipboard successfully')
      },
      'image/png',
      1
    )
  }
}
