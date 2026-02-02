import { nanoid } from 'nanoid'
import plotly from 'plotly.js'
import * as dereference from 'react-chart-editor/lib/lib/dereference'

export function getOptionsFromDataSources(dataSources) {
  if (!dataSources) {
    return []
  }

  return Object.keys(dataSources).map(name => ({
    value: name,
    label: name
  }))
}

export function getOptionsForSave(state, dataSources) {
  // we don't need to save the data, only settings
  // so we modify state.data using dereference
  const stateCopy = JSON.parse(JSON.stringify(state))
  const emptySources = {}
  for (const key in dataSources) {
    emptySources[key] = []
  }
  dereference.default(stateCopy.data, emptySources)
  return stateCopy
}

export async function getImageDataUrl(element, type) {
  const chartElement = element.querySelector('.js-plotly-plot')
  return await plotly.toImage(chartElement, {
    format: type,
    width: null,
    height: null
  })
}

export function getChartData(element) {
  const chartElement = element.querySelector('.js-plotly-plot')
  return {
    data: chartElement.data,
    layout: chartElement.layout
  }
}

export function getHtml(options) {
  const chartId = nanoid()
  return `
      <div id="${chartId}"></div>
      <script src="plotly.js" charset="UTF-8"></script>
      <script>
        // 直接覆盖Plotly的本地化数据
        if (typeof Plotly !== 'undefined') {
          // 确保Plotly包含locales对象
          if (!Plotly.locales) {
            Plotly.locales = {};
          }
          
          // 直接设置中文本地化数据
          Plotly.locales['zh-CN'] = {
            name: 'zh-CN',
            dictionary: {
              'Autoscale': '自动缩放',
              'Box Select': '矩形框选',
              'Click to enter Colorscale title': '点击输入色阶的标题',
              'Click to enter Component A title': '点击输入组件A的标题',
              'Click to enter Component B title': '点击输入组件B的标题',
              'Click to enter Component C title': '点击输入组件C的标题',
              'Click to enter Plot title': '点击输入图表的标题',
              'Click to enter X axis title': '点击输入X轴的标题',
              'Click to enter Y axis title': '点击输入Y轴的标题',
              'Compare data on hover': '悬停时比较数据',
              'Double-click on legend to isolate one trace': '双击图例来突显对应轨迹',
              'Double-click to zoom back out': '双击返回缩小显示',
              'Download plot as a png': '下载图表为PNG格式',
              'Download plot': '下载图表',
              'Edit in Chart Studio': '在Chart Studio中编辑',
              'IE only supports svg.  Changing format to svg.': 'IE只支持SVG。转换格式为SVG。',
              'Lasso Select': '套索选择',
              'Orbital rotation': '轨道旋转',
              'Pan': '平移',
              'Produced with Plotly.js': '由Plotly.js生成',
              'Reset': '重置',
              'Reset axes': '重置轴',
              'Reset camera to default': '重置镜头视角为默认状态',
              'Reset camera to last save': '重置镜头视角为上次保存状态',
              'Reset view': '重置视图',
              'Reset views': '重置视图',
              'Show closest data on hover': '悬停时显示最近的数据',
              'Snapshot succeeded': '生成快照成功',
              'Sorry, there was a problem downloading your snapshot!': '抱歉，下载快照出现问题！',
              'Taking snapshot - this may take a few seconds': '正在生成快照 - 可能需要几秒钟',
              'Zoom': '缩放',
              'Zoom in': '放大',
              'Zoom out': '缩小',
              'zoom2d': '缩放',
              'pan2d': '平移',
              'select2d': '矩形框选',
              'lasso2d': '套索选择',
              'zoomIn2d': '放大',
              'zoomOut2d': '缩小',
              'autoScale2d': '自动缩放',
              'resetScale2d': '重置缩放',
              'toggleSpikelines': '切换峰值线',
              'hoverClosestCartesian': '显示最近数据',
              'hoverCompareCartesian': '比较数据'
            },
            format: {
              days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
              shortDays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
              months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
              shortMonths: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'],
              date: '%Y-%m-%d'
            }
          };
          
          // 设置默认locale
          if (Plotly.setPlotConfig) {
            Plotly.setPlotConfig({
              locale: 'zh-CN'
            });
          }
        }

        const el = document.getElementById("${chartId}")
        
        let timeout
        function debounceResize() {
          clearTimeout(timeout)
          timeout = setTimeout(() => {
            var r = el.getBoundingClientRect()
            Plotly.relayout(el, {width: r.width, height: r.height})
          }, 200)
        }
        
        const resizeObserver = new ResizeObserver(debounceResize)
        resizeObserver.observe(el)
      
        // 配置项
        const config = {
          // 去掉Plotly logo
          displaylogo: false,
          // 中文本地化
          locale: 'zh-CN',
          // 确保使用中文提示
          modeBarButtons: [
            ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
            ['hoverClosestCartesian', 'hoverCompareCartesian'],
            ['toggleSpikelines']
          ]
        }
        
        // 直接修改Plotly模式栏按钮的默认配置
        if (typeof Plotly !== 'undefined' && Plotly.d3) {
          // 覆盖模式栏按钮的默认提示文本
          const originalButtonDefaults = Plotly.d3.selectAll('.modebar-btn').property('title');
          console.log('原始按钮默认配置:', originalButtonDefaults);
        }
        
        Plotly.newPlot(el, ${JSON.stringify(options.data)}, ${JSON.stringify(options.layout)}, config).then(function() {
          // 等待图表渲染完成后，手动修改模式栏按钮的提示文本
          setTimeout(function() {
            // 获取所有按钮
            const allButtons = document.querySelectorAll('button');
            console.log('找到所有按钮数量:', allButtons.length);
            
            // 按钮文本映射
            const buttonMap = {
              'Zoom': '缩放',
              'Pan': '平移',
              'Box Select': '矩形框选',
              'Lasso Select': '套索选择',
              'Zoom in': '放大',
              'Zoom out': '缩小',
              'Autoscale': '自动缩放',
              'Reset axes': '重置缩放',
              'Toggle Spike Lines': '切换峰值线',
              'Show closest data on hover': '显示最近数据',
              'Compare data on hover': '比较数据'
            };
            
            // 遍历所有按钮，修改匹配的title
            allButtons.forEach(function(button) {
              const title = button.getAttribute('title');
              if (title && buttonMap[title]) {
                button.setAttribute('title', buttonMap[title]);
                console.log('已修改按钮提示:', title, '->', buttonMap[title]);
              }
            });
          }, 500); // 增加延迟时间，确保所有元素都已渲染完成
        });
      </script>
  `
}

export default {
  getOptionsFromDataSources,
  getOptionsForSave,
  getImageDataUrl,
  getHtml,
  getChartData
}
