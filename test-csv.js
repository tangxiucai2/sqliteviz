import Papa from 'papaparse'

// 测试数据：包含逗号的字段
const testData = {
  fields: ['姓名', '年龄', '地址'],
  data: [
    ['张三', 25, '北京市朝阳区, 建国路100号'],
    ['李四', 30, '上海市浦东新区, 张江高科技园区'],
    ['王五', 35, '广州市天河区, 珠江新城']
  ]
}

// 使用Papa Parse转换为CSV
const csvString = Papa.unparse(testData, { delimiter: ',' })

console.log('生成的CSV内容：')
console.log(csvString)

// 验证CSV格式是否正确
const lines = csvString.split('\n')
console.log('\nCSV行解析：')
lines.forEach((line, index) => {
  console.log(`行 ${index + 1}: ${line}`)
  // 简单验证：检查包含逗号的字段是否被引号包裹
  if (index > 0) {
    // 跳过表头
    const addressField = line.split(',')[2]
    console.log(`  地址字段: ${addressField}`)
    console.log(
      `  是否被引号包裹: ${addressField.startsWith('"') && addressField.endsWith('"')}`
    )
  }
})
