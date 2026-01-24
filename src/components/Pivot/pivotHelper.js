import $ from 'jquery'
import 'pivottable'
import 'pivottable/dist/export_renderers.js'
import 'pivottable/dist/plotly_renderers.js'
import html2canvas from 'html2canvas'

export const zeroValAggregators = [
  'Count',
  'Count as Fraction of Total',
  'Count as Fraction of Rows',
  'Count as Fraction of Columns'
]

export const twoValAggregators = [
  'Sum over Sum',
  '80% Upper Bound',
  '80% Lower Bound'
]

export function _getDataSources(pivotData) {
  const rowKeys = pivotData.getRowKeys()
  const colKeys = pivotData.getColKeys()

  const dataSources = {
    'Column keys': colKeys.map(colKey => colKey.join('-')),
    'Row keys': rowKeys.map(rowKey => rowKey.join('-'))
  }

  const dataSourcesByRows = {}
  const dataSourcesByCols = {}

  const rowAttrs = pivotData.rowAttrs.join('-')
  const colAttrs = pivotData.colAttrs.join('-')

  colKeys.forEach(colKey => {
    const sourceColKey = colAttrs + ':' + colKey.join('-')
    dataSourcesByCols[sourceColKey] = []
    rowKeys.forEach(rowKey => {
      const value = pivotData.getAggregator(rowKey, colKey).value()
      dataSourcesByCols[sourceColKey].push(value)
      const sourceRowKey = rowAttrs + ':' + rowKey.join('-')
      if (!dataSourcesByRows[sourceRowKey]) {
        dataSourcesByRows[sourceRowKey] = []
      }
      dataSourcesByRows[sourceRowKey].push(value)
    })
  })

  return Object.assign(dataSources, dataSourcesByCols, dataSourcesByRows)
}

function customChartRenderer(data, options) {
  const propsRef = options.getCustomComponentsProps()
  propsRef.dataSources = _getDataSources(data)
  return null
}

$.extend(
  $.pivotUtilities.renderers,
  $.pivotUtilities.export_renderers,
  $.pivotUtilities.plotly_renderers,
  { 'Custom chart': customChartRenderer }
)

// 渲染器名称映射
const rendererNameMap = {
  'Table': '表格',
  'Table With Subtotal': '带小计的表格',
  'Heatmap': '热力图',
  'Row Heatmap': '行热力图',
  'Col Heatmap': '列热力图',
  'Treemap': '树状图',
  'TSV Export': 'TSV导出',
  'Plotly Scatter': 'Plotly散点图',
  'Plotly Line': 'Plotly折线图',
  'Plotly Bar': 'Plotly柱状图',
  'Plotly Area': 'Plotly面积图',
  'Plotly Pie': 'Plotly饼图',
  'Plotly Multiple Pie': 'Plotly多饼图',
  'Plotly Heatmap': 'Plotly热力图',
  'Plotly Contour': 'Plotly等高线图',
  'Plotly 3D Scatter': 'Plotly 3D散点图',
  'Plotly 3D Surface': 'Plotly 3D曲面图',
  'Plotly Parallel Categories': 'Plotly平行类别图',
  'Custom chart': '自定义图表'
};

export const renderers = Object.keys($.pivotUtilities.renderers).map(key => {
  return {
    name: rendererNameMap[key] || key,
    fun: $.pivotUtilities.renderers[key]
  }
})

// 聚合函数名称映射
const aggregatorNameMap = {
  'Count': '计数',
  'Count as Fraction of Total': '计数占总计的比例',
  'Count as Fraction of Rows': '计数占行的比例',
  'Count as Fraction of Columns': '计数占列的比例',
  'Sum': '求和',
  'Sum as Fraction of Total': '求和占总计的比例',
  'Sum as Fraction of Rows': '求和占行的比例',
  'Sum as Fraction of Columns': '求和占列的比例',
  'Average': '平均值',
  'Average as Fraction of Total': '平均值占总计的比例',
  'Average as Fraction of Rows': '平均值占行的比例',
  'Average as Fraction of Columns': '平均值占列的比例',
  'Minimum': '最小值',
  'Minimum as Fraction of Total': '最小值占总计的比例',
  'Minimum as Fraction of Rows': '最小值占行的比例',
  'Minimum as Fraction of Columns': '最小值占列的比例',
  'Maximum': '最大值',
  'Maximum as Fraction of Total': '最大值占总计的比例',
  'Maximum as Fraction of Rows': '最大值占行的比例',
  'Maximum as Fraction of Columns': '最大值占列的比例',
  'First': '第一个',
  'First as Fraction of Total': '第一个占总计的比例',
  'First as Fraction of Rows': '第一个占行的比例',
  'First as Fraction of Columns': '第一个占列的比例',
  'Last': '最后一个',
  'Last as Fraction of Total': '最后一个占总计的比例',
  'Last as Fraction of Rows': '最后一个占行的比例',
  'Last as Fraction of Columns': '最后一个占列的比例',
  'Median': '中位数',
  'Median as Fraction of Total': '中位数占总计的比例',
  'Median as Fraction of Rows': '中位数占行的比例',
  'Median as Fraction of Columns': '中位数占列的比例',
  'Distinct Count': '不同计数',
  'Distinct Count as Fraction of Total': '不同计数占总计的比例',
  'Distinct Count as Fraction of Rows': '不同计数占行的比例',
  'Distinct Count as Fraction of Columns': '不同计数占列的比例',
  'Sum over Sum': '总和之上的总和',
  'Sum over Sum as Fraction of Total': '总和之上的总和占总计的比例',
  'Sum over Sum as Fraction of Rows': '总和之上的总和占行的比例',
  'Sum over Sum as Fraction of Columns': '总和之上的总和占列的比例',
  '80% Upper Bound': '80%上限',
  '80% Upper Bound as Fraction of Total': '80%上限占总计的比例',
  '80% Upper Bound as Fraction of Rows': '80%上限占行的比例',
  '80% Upper Bound as Fraction of Columns': '80%上限占列的比例',
  '80% Lower Bound': '80%下限',
  '80% Lower Bound as Fraction of Total': '80%下限占总计的比例',
  '80% Lower Bound as Fraction of Rows': '80%下限占行的比例',
  '80% Lower Bound as Fraction of Columns': '80%下限占列的比例'
};

export const aggregators = Object.keys($.pivotUtilities.aggregators).map(
  key => {
    return {
      name: aggregatorNameMap[key] || key,
      fun: $.pivotUtilities.aggregators[key]
    }
  }
)

export async function getPivotCanvas(pivotOutput) {
  const tableElement = pivotOutput.querySelector('.pvtTable')
  return await html2canvas(tableElement, { logging: false })
}

export function getPivotHtml(pivotOutput) {
  return `
      <style>
        table.pvtTable {
          font-family: Arial, sans-serif;
          font-size: 12px;
          text-align: left;
          border-collapse: collapse;
          min-width: 100%;
        }
        table.pvtTable .pvtColLabel {
          text-align: center;
        }
        table.pvtTable .pvtTotalLabel {
          text-align: right;
        }
        table.pvtTable tbody tr td {
          color: #506784;
          border: 1px solid #DFE8F3;
          text-align: right;
        }
        table.pvtTable thead tr th,
        table.pvtTable tbody tr th {
          background-color: #506784;
          color: #fff;
          border: 1px solid #DFE8F3;
        }
      </style>
      ${pivotOutput.outerHTML}
  `
}

export default {
  getPivotCanvas,
  getPivotHtml
}
