# 图表组件使用指南

## 1. 项目概述

Sqliteviz 是一个基于 Vue.js 的单页离线优先 PWA，用于 SQLite 数据库、CSV、JSON 或 NDJSON 文件的客户端可视化。项目使用 Plotly.js 作为图表库，通过 react-chart-editor 提供交互式图表编辑功能。

## 2. 图表组件概述

### 2.1 核心组件

- **Chart.vue**：主要图表组件，集成了 Plotly.js 图表库
- **ReactPlotlyEditorWithPlotRef.jsx**：扩展的 React Plotly 编辑器组件，用于提供交互式编辑功能
- **chartHelper.js**：图表辅助函数，用于处理数据格式转换、导出等功能

### 2.2 集成方式

项目通过 `veaury` 库将 React 组件 `ReactPlotlyEditorWithPlotRef` 集成到 Vue 中，实现了在 Vue 项目中使用 React 图表编辑器的功能。

## 3. 支持的图表类型

项目支持丰富的图表类型，包括：

### 3.1 基础图表

- 柱状图 (Bar)
- 折线图 (Line)
- 散点图 (Scatter)
- 面积图 (Area)
- 饼图 (Pie)
- 环形图 (Donut)

### 3.2 统计图表

- 直方图 (Histogram)
- 箱线图 (Box)
- 小提琴图 (Violin)

### 3.3 高级图表

- 等高线图 (Contour)
- 热力图 (Heatmap)
- 曲面图 (Surface)
- 3D 图表（散点图、折线图、曲面图）

### 3.4 地图

- Choropleth 地图
- 瓦片地图

### 3.5 金融图表

- 蜡烛图 (Candlestick)
- K线图 (OHLC)

### 3.6 专业图表

- 瀑布图 (Waterfall)
- 漏斗图 (Funnel)
- 漏斗面积图 (Funnel Area)
- 指标图 (Indicator)
- 极坐标图 (Polar)
- 雷达图 (Radar)

### 3.7 关系图表

- 桑基图 (Sankey)
- 旭日图 (Sunburst)
- 树状图 (Treemap)
- 平行坐标图 (Parallel Coordinates)
- 散点矩阵图 (Scatter Matrix)

## 4. 图表组件的使用方式

### 4.1 组件引入

```vue
<template>
  <Chart
    :dataSources="dataSources"
    :initOptions="initOptions"
    :showViewSettings="showViewSettings"
    @update="onUpdate"
  />
</template>

<script>
import Chart from '@/components/Chart.vue'

export default {
  components: {
    Chart
  },
  data() {
    return {
      dataSources: {},
      initOptions: {},
      showViewSettings: true
    }
  },
  methods: {
    onUpdate() {
      // 处理图表更新事件
    }
  }
}
</script>
```

### 4.2 组件属性

| 属性名             | 类型    | 描述                                      |
| ------------------ | ------- | ----------------------------------------- |
| dataSources        | Object  | 数据源，包含数据和字段配置                |
| initOptions        | Object  | 初始图表配置，包含 data、layout 和 frames |
| exportToPngEnabled | Boolean | 是否启用 PNG 导出功能                     |
| exportToSvgEnabled | Boolean | 是否启用 SVG 导出功能                     |
| forPivot           | Boolean | 是否用于透视表                            |
| showViewSettings   | Boolean | 是否显示视图设置                          |

### 4.3 组件事件

| 事件名                | 描述               |
| --------------------- | ------------------ |
| update                | 图表配置更新时触发 |
| loadingImageCompleted | 图片加载完成时触发 |

## 5. 数据格式

### 5.1 数据源格式

数据源是一个对象，包含多个数据源，每个数据源是一个数组，包含字段名和对应的数据数组。

```javascript
const dataSources = {
  数据源1: {
    字段1: [1, 2, 3, 4, 5],
    字段2: ['A', 'B', 'C', 'D', 'E'],
    字段3: [10, 20, 30, 40, 50]
  },
  数据源2: {
    // 其他数据源
  }
}
```

### 5.2 初始配置格式

初始配置包含 `data`（轨迹配置）、`layout`（布局配置）和 `frames`（动画帧配置）。

```javascript
const initOptions = {
  data: [
    {
      type: 'bar',
      x: '数据源1.字段2',
      y: '数据源1.字段3',
      name: '柱状图'
    }
  ],
  layout: {
    title: '图表标题',
    xaxis: {
      title: 'X轴标题'
    },
    yaxis: {
      title: 'Y轴标题'
    }
  },
  frames: []
}
```

## 6. 配置选项

### 6.1 轨迹配置 (data)

轨迹配置定义了图表的类型、数据来源、样式等。

| 属性名  | 类型   | 描述                                                |
| ------- | ------ | --------------------------------------------------- |
| type    | String | 图表类型，如 "bar"、"line"、"scatter" 等            |
| x       | String | X轴数据来源，格式为 "数据源.字段名"                 |
| y       | String | Y轴数据来源，格式为 "数据源.字段名"                 |
| z       | String | Z轴数据来源（用于3D图表），格式为 "数据源.字段名"   |
| name    | String | 轨迹名称                                            |
| mode    | String | 绘制模式，如 "lines"、"markers"、"lines+markers" 等 |
| color   | String | 颜色配置                                            |
| opacity | Number | 透明度，0-1之间                                     |
| marker  | Object | 标记配置，包括大小、形状、颜色等                    |
| line    | Object | 线条配置，包括宽度、颜色、样式等                    |
| fill    | String | 填充类型，如 "none"、"tozeroy"、"tonexty" 等        |

### 6.2 布局配置 (layout)

布局配置定义了图表的整体布局，包括标题、坐标轴、图例、网格等。

| 属性名        | 类型          | 描述                                                |
| ------------- | ------------- | --------------------------------------------------- |
| title         | String/Object | 图表标题                                            |
| xaxis         | Object        | X轴配置，包括标题、类型、范围、刻度等               |
| yaxis         | Object        | Y轴配置，包括标题、类型、范围、刻度等               |
| zaxis         | Object        | Z轴配置（用于3D图表），包括标题、类型、范围、刻度等 |
| legend        | Object        | 图例配置，包括位置、方向、背景等                    |
| grid          | Object        | 网格配置，包括显示、颜色、宽度等                    |
| margin        | Object        | 边距配置，包括上下左右边距                          |
| width         | Number        | 图表宽度                                            |
| height        | Number        | 图表高度                                            |
| paper_bgcolor | String        | 画布背景颜色                                        |
| plot_bgcolor  | String        | 图表背景颜色                                        |

### 6.3 配置项 (config)

配置项定义了图表的交互行为、显示模式等。

| 属性名                 | 类型           | 描述                         |
| ---------------------- | -------------- | ---------------------------- |
| editable               | Boolean        | 是否可编辑                   |
| displaylogo            | Boolean        | 是否显示 Logo                |
| modeBarButtonsToRemove | Array          | 要移除的模式栏按钮           |
| locale                 | String         | 本地化语言，如 "zh-CN"       |
| scrollZoom             | Boolean        | 是否启用滚动缩放             |
| showTips               | Boolean        | 是否显示提示                 |
| showLink               | Boolean        | 是否显示链接                 |
| displayModeBar         | Boolean/String | 是否显示模式栏，或模式栏位置 |

## 7. 常用图表类型的配置示例

### 7.1 柱状图 (Bar)

```javascript
const initOptions = {
  data: [
    {
      type: 'bar',
      x: '数据源.类别',
      y: '数据源.数值',
      name: '柱状图',
      marker: {
        color: '#636efa'
      }
    }
  ],
  layout: {
    title: '柱状图示例',
    xaxis: {
      title: '类别'
    },
    yaxis: {
      title: '数值'
    }
  }
}
```

### 7.2 折线图 (Line)

```javascript
const initOptions = {
  data: [
    {
      type: 'line',
      x: '数据源.时间',
      y: '数据源.数值',
      name: '折线图',
      mode: 'lines+markers',
      line: {
        color: '#636efa',
        width: 2
      },
      marker: {
        size: 6
      }
    }
  ],
  layout: {
    title: '折线图示例',
    xaxis: {
      title: '时间'
    },
    yaxis: {
      title: '数值'
    }
  }
}
```

### 7.3 散点图 (Scatter)

```javascript
const initOptions = {
  data: [
    {
      type: 'scatter',
      x: '数据源.X',
      y: '数据源.Y',
      name: '散点图',
      mode: 'markers',
      marker: {
        size: 8,
        color: '#636efa',
        opacity: 0.7
      }
    }
  ],
  layout: {
    title: '散点图示例',
    xaxis: {
      title: 'X轴'
    },
    yaxis: {
      title: 'Y轴'
    }
  }
}
```

### 7.4 饼图 (Pie)

```javascript
const initOptions = {
  data: [
    {
      type: 'pie',
      labels: '数据源.类别',
      values: '数据源.数值',
      name: '饼图',
      hole: 0, // 0 为饼图，大于 0 为环形图
      marker: {
        colors: ['#636efa', '#ef553b', '#00cc96', '#ab63fa', '#ffa15a']
      }
    }
  ],
  layout: {
    title: '饼图示例'
  }
}
```

### 7.5 直方图 (Histogram)

```javascript
const initOptions = {
  data: [
    {
      type: 'histogram',
      x: '数据源.数值',
      name: '直方图',
      marker: {
        color: '#636efa'
      },
      opacity: 0.7
    }
  ],
  layout: {
    title: '直方图示例',
    xaxis: {
      title: '数值'
    },
    yaxis: {
      title: '频率'
    }
  }
}
```

### 7.6 热力图 (Heatmap)

```javascript
const initOptions = {
  data: [
    {
      type: 'heatmap',
      z: '数据源.数值矩阵',
      x: '数据源.X轴',
      y: '数据源.Y轴',
      name: '热力图',
      colorscale: 'Viridis'
    }
  ],
  layout: {
    title: '热力图示例',
    xaxis: {
      title: 'X轴'
    },
    yaxis: {
      title: 'Y轴'
    }
  }
}
```

### 7.7 面积图 (Area)

**使用场景**：展示数据随时间或类别变化的趋势，并强调总量变化。

**配置选项**：

- `type`: "scatter"
- `mode`: 通常为 "lines+markers" 或 "lines"
- `fill`: 填充类型，如 "tozeroy"（填充到Y轴零点）、"tonexty"（填充到下一条轨迹）
- `fillcolor`: 填充颜色

**数据格式**：需要X轴和Y轴数据，与折线图类似。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'scatter',
      x: '数据源.时间',
      y: '数据源.数值',
      name: '面积图',
      mode: 'lines+markers',
      fill: 'tozeroy',
      fillcolor: 'rgba(99, 110, 250, 0.3)',
      line: {
        color: '#636efa',
        width: 2
      },
      marker: {
        size: 6
      }
    }
  ],
  layout: {
    title: '面积图示例',
    xaxis: {
      title: '时间'
    },
    yaxis: {
      title: '数值'
    }
  }
}
```

### 7.8 箱线图 (Box)

**使用场景**：展示数据的分布情况，包括中位数、四分位数和异常值。

**配置选项**：

- `type`: "box"
- `x`: 可选，用于分组的X轴数据
- `y`: Y轴数据
- `boxpoints`: 异常值显示方式，如 "outliers"（仅显示异常值）、"all"（显示所有点）
- `jitter`: 点的抖动程度，避免重叠
- `pointpos`: 点的位置，相对于箱线图

**数据格式**：需要数值型Y轴数据，可选分类型X轴数据用于分组。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'box',
      x: '数据源.类别',
      y: '数据源.数值',
      name: '箱线图',
      marker: {
        color: '#636efa'
      },
      boxpoints: 'outliers',
      jitter: 0.3,
      pointpos: -1.8
    }
  ],
  layout: {
    title: '箱线图示例',
    xaxis: {
      title: '类别'
    },
    yaxis: {
      title: '数值'
    }
  }
}
```

### 7.9 小提琴图 (Violin)

**使用场景**：展示数据的分布密度，结合了箱线图和密度图的特点。

**配置选项**：

- `type`: "violin"
- `x`: 可选，用于分组的X轴数据
- `y`: Y轴数据
- `box`: 布尔值，是否显示内部箱线图
- `points`: 异常值显示方式，如 "outliers"、"all"、"suspectedoutliers"、"false"
- `meanline`: 布尔值，是否显示平均线

**数据格式**：需要数值型Y轴数据，可选分类型X轴数据用于分组。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'violin',
      x: '数据源.类别',
      y: '数据源.数值',
      name: '小提琴图',
      marker: {
        color: '#636efa'
      },
      box: {
        visible: true
      },
      meanline: {
        visible: true
      },
      points: 'outliers'
    }
  ],
  layout: {
    title: '小提琴图示例',
    xaxis: {
      title: '类别'
    },
    yaxis: {
      title: '数值'
    }
  }
}
```

### 7.10 等高线图 (Contour)

**使用场景**：展示三维数据的二维投影，通过等高线表示第三维数值。

**配置选项**：

- `type`: "contour"
- `z`: 二维数值矩阵
- `x`: X轴数据，长度应与z的列数匹配
- `y`: Y轴数据，长度应与z的行数匹配
- `colorscale`: 颜色刻度
- `contours`: 等高线配置，包括类型、数量、显示标签等

**数据格式**：需要二维数值矩阵z，以及对应的X轴和Y轴数据。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'contour',
      z: '数据源.数值矩阵',
      x: '数据源.X轴',
      y: '数据源.Y轴',
      name: '等高线图',
      colorscale: 'Viridis',
      contours: {
        type: 'levels',
        start: 0,
        end: 10,
        size: 1,
        showlabels: true,
        labelfont: {
          size: 12,
          color: 'white'
        }
      }
    }
  ],
  layout: {
    title: '等高线图示例',
    xaxis: {
      title: 'X轴'
    },
    yaxis: {
      title: 'Y轴'
    }
  }
}
```

### 7.11 3D 散点图 (3D Scatter)

**使用场景**：展示三维空间中的数据点分布和关系。

**配置选项**：

- `type`: "scatter3d"
- `x`: X轴数据
- `y`: Y轴数据
- `z`: Z轴数据
- `mode`: 绘制模式，如 "markers"、"lines"、"lines+markers"
- `marker`: 标记配置，包括大小、颜色、透明度等

**数据格式**：需要X轴、Y轴和Z轴的数值数据。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'scatter3d',
      x: '数据源.X',
      y: '数据源.Y',
      z: '数据源.Z',
      name: '3D散点图',
      mode: 'markers',
      marker: {
        size: 8,
        color: '#636efa',
        opacity: 0.7
      }
    }
  ],
  layout: {
    title: '3D散点图示例',
    scene: {
      xaxis: {
        title: 'X轴'
      },
      yaxis: {
        title: 'Y轴'
      },
      zaxis: {
        title: 'Z轴'
      }
    }
  }
}
```

### 7.12 3D 折线图 (3D Line)

**使用场景**：展示三维空间中的数据点连接趋势。

**配置选项**：

- `type`: "scatter3d"
- `x`: X轴数据
- `y`: Y轴数据
- `z`: Z轴数据
- `mode`: 通常为 "lines" 或 "lines+markers"
- `line`: 线条配置，包括宽度、颜色、样式等

**数据格式**：需要X轴、Y轴和Z轴的数值数据。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'scatter3d',
      x: '数据源.X',
      y: '数据源.Y',
      z: '数据源.Z',
      name: '3D折线图',
      mode: 'lines+markers',
      line: {
        color: '#636efa',
        width: 2
      },
      marker: {
        size: 6
      }
    }
  ],
  layout: {
    title: '3D折线图示例',
    scene: {
      xaxis: {
        title: 'X轴'
      },
      yaxis: {
        title: 'Y轴'
      },
      zaxis: {
        title: 'Z轴'
      }
    }
  }
}
```

### 7.13 3D 曲面图 (3D Surface)

**使用场景**：展示三维空间中的曲面形态，用于表示连续的三维数据。

**配置选项**：

- `type`: "surface"
- `z`: 二维数值矩阵
- `x`: 可选，X轴数据，长度应与z的列数匹配
- `y`: 可选，Y轴数据，长度应与z的行数匹配
- `colorscale`: 颜色刻度
- `opacity`: 透明度

**数据格式**：需要二维数值矩阵z，以及对应的X轴和Y轴数据（可选）。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'surface',
      z: '数据源.数值矩阵',
      x: '数据源.X轴',
      y: '数据源.Y轴',
      name: '3D曲面图',
      colorscale: 'Viridis',
      opacity: 0.8
    }
  ],
  layout: {
    title: '3D曲面图示例',
    scene: {
      xaxis: {
        title: 'X轴'
      },
      yaxis: {
        title: 'Y轴'
      },
      zaxis: {
        title: 'Z轴'
      }
    }
  }
}
```

### 7.14 蜡烛图 (Candlestick)

**使用场景**：展示金融资产的开盘价、收盘价、最高价和最低价。

**配置选项**：

- `type`: "candlestick"
- `x`: 时间轴数据
- `open`: 开盘价
- `high`: 最高价
- `low`: 最低价
- `close`: 收盘价
- `increasing`: 上涨时的样式配置
- `decreasing`: 下跌时的样式配置

**数据格式**：需要时间轴数据和对应的开盘价、收盘价、最高价、最低价。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'candlestick',
      x: '数据源.日期',
      open: '数据源.开盘价',
      high: '数据源.最高价',
      low: '数据源.最低价',
      close: '数据源.收盘价',
      name: '蜡烛图',
      increasing: {
        line: {
          color: '#26a69a'
        }
      },
      decreasing: {
        line: {
          color: '#ef5350'
        }
      }
    }
  ],
  layout: {
    title: '蜡烛图示例',
    xaxis: {
      title: '日期'
    },
    yaxis: {
      title: '价格'
    }
  }
}
```

### 7.15 K线图 (OHLC)

**使用场景**：与蜡烛图类似，展示金融资产的开盘价、收盘价、最高价和最低价，但使用线条表示。

**配置选项**：

- `type`: "ohlc"
- `x`: 时间轴数据
- `open`: 开盘价
- `high`: 最高价
- `low`: 最低价
- `close`: 收盘价
- `increasing`: 上涨时的样式配置
- `decreasing`: 下跌时的样式配置

**数据格式**：需要时间轴数据和对应的开盘价、收盘价、最高价、最低价。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'ohlc',
      x: '数据源.日期',
      open: '数据源.开盘价',
      high: '数据源.最高价',
      low: '数据源.最低价',
      close: '数据源.收盘价',
      name: 'K线图',
      increasing: {
        line: {
          color: '#26a69a'
        }
      },
      decreasing: {
        line: {
          color: '#ef5350'
        }
      }
    }
  ],
  layout: {
    title: 'K线图示例',
    xaxis: {
      title: '日期'
    },
    yaxis: {
      title: '价格'
    }
  }
}
```

### 7.16 瀑布图 (Waterfall)

**使用场景**：展示数据的累积变化过程，常用于财务报表中。

**配置选项**：

- `type`: "waterfall"
- `x`: 类别数据
- `y`: 数值数据
- `measure`: 每个数据点的类型，如 "relative"（相对值）、"total"（总计）
- `connector`: 连接线配置

**数据格式**：需要类别数据、数值数据和对应的度量类型。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'waterfall',
      x: '数据源.类别',
      y: '数据源.数值',
      measure: '数据源.度量类型',
      name: '瀑布图',
      connector: {
        line: {
          color: '#636efa'
        }
      }
    }
  ],
  layout: {
    title: '瀑布图示例',
    xaxis: {
      title: '类别'
    },
    yaxis: {
      title: '数值'
    }
  }
}
```

### 7.17 漏斗图 (Funnel)

**使用场景**：展示数据在不同阶段的转化情况，如销售漏斗、用户转化漏斗等。

**配置选项**：

- `type`: "funnel"
- `x`: 数值数据
- `y`: 阶段数据
- `orientation`: 方向，如 "v"（垂直）、"h"（水平）
- `textinfo`: 显示的文本信息，如 "value"、"percent"、"label+percent"

**数据格式**：需要阶段数据和对应的数值数据。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'funnel',
      y: '数据源.阶段',
      x: '数据源.数值',
      name: '漏斗图',
      orientation: 'v',
      textinfo: 'label+value+percent',
      textposition: 'inside'
    }
  ],
  layout: {
    title: '漏斗图示例',
    yaxis: {
      title: '阶段'
    },
    xaxis: {
      title: '数值'
    }
  }
}
```

### 7.18 雷达图 (Radar)

**使用场景**：展示多个维度的数据对比，如产品性能、用户评分等。

**配置选项**：

- `type`: "radar"
- `r`: 数值数据
- `theta`: 维度标签
- `fill`: 是否填充区域
- `line`: 线条配置

**数据格式**：需要维度标签和对应的数值数据。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'radar',
      r: '数据源.数值',
      theta: '数据源.维度',
      name: '雷达图',
      fill: true,
      fillcolor: 'rgba(99, 110, 250, 0.3)',
      line: {
        color: '#636efa'
      }
    }
  ],
  layout: {
    title: '雷达图示例',
    polar: {
      radialaxis: {
        visible: true,
        range: [0, 10]
      }
    }
  }
}
```

### 7.19 漏斗面积图 (Funnel Area)

**使用场景**：展示数据在不同阶段的转化情况，与漏斗图类似，但使用面积表示。

**配置选项**：

- `type`: "funnelarea"
- `values`: 数值数据
- `labels`: 阶段标签
- `textinfo`: 显示的文本信息
- `opacity`: 透明度

**数据格式**：需要阶段标签和对应的数值数据。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'funnelarea',
      values: '数据源.数值',
      labels: '数据源.阶段',
      name: '漏斗面积图',
      textinfo: 'label+value+percent',
      opacity: 0.8
    }
  ],
  layout: {
    title: '漏斗面积图示例'
  }
}
```

### 7.20 指标图 (Indicator)

**使用场景**：展示单个关键指标，如销售额、增长率、完成率等。

**配置选项**：

- `type`: "indicator"
- `mode`: 显示模式，如 "gauge+number"（仪表盘+数值）、"number+delta"（数值+变化量）
- `value`: 指标数值
- `delta`: 变化量配置
- `gauge`: 仪表盘配置
- `number`: 数值样式配置

**数据格式**：主要需要指标数值，可选变化量数据。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'indicator',
      mode: 'gauge+number+delta',
      value: '数据源.数值',
      delta: {
        reference: '数据源.参考值',
        increasing: { color: '#26a69a' },
        decreasing: { color: '#ef5350' }
      },
      gauge: {
        axis: { range: [0, 100] },
        bar: { color: '#636efa' },
        bgcolor: 'white',
        borderwidth: 2,
        bordercolor: 'gray',
        steps: [
          { range: [0, 50], color: 'rgba(99, 110, 250, 0.3)' },
          { range: [50, 80], color: 'rgba(99, 110, 250, 0.6)' },
          { range: [80, 100], color: 'rgba(99, 110, 250, 0.9)' }
        ]
      }
    }
  ],
  layout: {
    title: '指标图示例'
  }
}
```

### 7.21 极坐标图 (Polar)

**使用场景**：展示极坐标下的数据分布，如方向数据、周期性数据等。

**配置选项**：

- `type`: "scatterpolar"
- `r`: 径向距离
- `theta`: 角度
- `mode`: 绘制模式，如 "markers"、"lines"、"lines+markers"
- `marker`: 标记配置
- `line`: 线条配置

**数据格式**：需要角度数据和对应的径向距离数据。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'scatterpolar',
      r: '数据源.距离',
      theta: '数据源.角度',
      name: '极坐标图',
      mode: 'lines+markers',
      line: {
        color: '#636efa'
      },
      marker: {
        size: 6
      }
    }
  ],
  layout: {
    title: '极坐标图示例',
    polar: {
      radialaxis: {
        visible: true,
        range: [0, 10]
      }
    }
  }
}
```

### 7.22 桑基图 (Sankey)

**使用场景**：展示数据的流动关系，如能量流动、资金流动、用户行为路径等。

**配置选项**：

- `type`: "sankey"
- `node`: 节点配置，包括标签、颜色、位置等
- `link`: 链接配置，包括源节点、目标节点、数值、颜色等

**数据格式**：需要节点数据和链接数据，节点数据包含标签，链接数据包含源节点索引、目标节点索引和数值。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'sankey',
      node: {
        pad: 15,
        thickness: 20,
        line: {
          color: '#636efa',
          width: 0.5
        },
        label: '数据源.节点标签',
        color: '#636efa'
      },
      link: {
        source: '数据源.源节点',
        target: '数据源.目标节点',
        value: '数据源.数值'
      }
    }
  ],
  layout: {
    title: '桑基图示例',
    font: {
      size: 10
    }
  }
}
```

### 7.23 旭日图 (Sunburst)

**使用场景**：展示层级数据的占比关系，如文件系统、组织结构、产品分类等。

**配置选项**：

- `type`: "sunburst"
- `labels`: 节点标签
- `parents`: 父节点标签
- `values`: 节点数值
- `branchvalues`: 分支值计算方式，如 "total"（总和）、"remainder"（剩余）

**数据格式**：需要节点标签、父节点标签和对应的数值数据。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'sunburst',
      labels: '数据源.节点标签',
      parents: '数据源.父节点',
      values: '数据源.数值',
      branchvalues: 'total'
    }
  ],
  layout: {
    title: '旭日图示例'
  }
}
```

### 7.24 树状图 (Treemap)

**使用场景**：展示层级数据的占比关系，与旭日图类似，但使用矩形表示。

**配置选项**：

- `type`: "treemap"
- `labels`: 节点标签
- `parents`: 父节点标签
- `values`: 节点数值
- `branchvalues`: 分支值计算方式

**数据格式**：需要节点标签、父节点标签和对应的数值数据。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'treemap',
      labels: '数据源.节点标签',
      parents: '数据源.父节点',
      values: '数据源.数值',
      branchvalues: 'total'
    }
  ],
  layout: {
    title: '树状图示例'
  }
}
```

### 7.25 平行坐标图 (Parallel Coordinates)

**使用场景**：展示多个连续变量之间的关系，适合高维数据可视化。

**配置选项**：

- `type`: "parcoords"
- `dimensions`: 维度配置，包括标签、范围、值等
- `line`: 线条配置

**数据格式**：需要多个维度的数值数据。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'parcoords',
      line: {
        color: '#636efa'
      },
      dimensions: [
        {
          label: '维度1',
          values: '数据源.维度1'
        },
        {
          label: '维度2',
          values: '数据源.维度2'
        },
        {
          label: '维度3',
          values: '数据源.维度3'
        },
        {
          label: '维度4',
          values: '数据源.维度4'
        }
      ]
    }
  ],
  layout: {
    title: '平行坐标图示例'
  }
}
```

### 7.26 散点矩阵图 (Scatter Matrix)

**使用场景**：展示多个变量之间的两两关系，适合探索性数据分析。

**配置选项**：

- `type`: "splom"
- `dimensions`: 维度配置，包括标签、值等
- `marker`: 标记配置

**数据格式**：需要多个维度的数值数据。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'splom',
      dimensions: [
        {
          label: '维度1',
          values: '数据源.维度1'
        },
        {
          label: '维度2',
          values: '数据源.维度2'
        },
        {
          label: '维度3',
          values: '数据源.维度3'
        }
      ],
      marker: {
        color: '#636efa',
        size: 5,
        opacity: 0.7
      }
    }
  ],
  layout: {
    title: '散点矩阵图示例'
  }
}
```

### 7.27 Choropleth 地图

**使用场景**：展示地理区域的数据分布，如人口密度、GDP、选举结果等。

**配置选项**：

- `type`: "choropleth"
- `locations`: 地理区域编码
- `z`: 数值数据
- `locationmode`: 地理区域编码模式，如 "country names"、"USA-states"
- `colorscale`: 颜色刻度
- `colorbar`: 颜色条配置

**数据格式**：需要地理区域编码和对应的数值数据。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'choropleth',
      locations: '数据源.国家代码',
      z: '数据源.数值',
      locationmode: 'country names',
      colorscale: 'Viridis',
      colorbar: {
        title: '数值'
      }
    }
  ],
  layout: {
    title: 'Choropleth 地图示例',
    geo: {
      projection: {
        type: 'natural earth'
      }
    }
  }
}
```

### 7.28 瓦片地图 (Tile Map)

**使用场景**：展示基于瓦片的地理数据，如地图上的点标记、路径等。

**配置选项**：

- `type`: "scattermapbox"
- `lat`: 纬度数据
- `lon`: 经度数据
- `mode`: 绘制模式，如 "markers"、"lines"、"markers+lines"
- `marker`: 标记配置
- `line`: 线条配置
- `text`: 悬停文本

**数据格式**：需要纬度和经度数据。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'scattermapbox',
      lat: '数据源.纬度',
      lon: '数据源.经度',
      mode: 'markers',
      marker: {
        size: 10,
        color: '#636efa'
      },
      text: '数据源.地点名称'
    }
  ],
  layout: {
    title: '瓦片地图示例',
    mapbox: {
      style: 'open-street-map',
      center: {
        lat: 39.9042,
        lon: 116.4074
      },
      zoom: 10
    }
  },
  config: {
    mapboxAccessToken: 'your-mapbox-access-token'
  }
}
```

### 7.29 环形图 (Donut)

**使用场景**：展示数据的比例关系，与饼图类似，但中间有一个空洞，更适合展示多个数据系列或需要在中心添加文本。

**配置选项**：

- `type`: "pie"
- `labels`: 类别标签
- `values`: 数值数据
- `hole`: 空洞大小，0-1之间
- `textinfo`: 显示的文本信息
- `hoverinfo`: 悬停显示的信息

**数据格式**：需要类别标签和对应的数值数据。

**配置示例**：

```javascript
const initOptions = {
  data: [
    {
      type: 'pie',
      labels: '数据源.类别',
      values: '数据源.数值',
      name: '环形图',
      hole: 0.4, // 环形图的空洞大小
      textinfo: 'label+percent',
      hoverinfo: 'label+value+percent',
      marker: {
        colors: ['#636efa', '#ef553b', '#00cc96', '#ab63fa', '#ffa15a']
      }
    }
  ],
  layout: {
    title: '环形图示例'
  }
}
```

## 8. 数据示例

### 8.1 基础数据示例

```javascript
const dataSources = {
  销售数据: {
    月份: ['1月', '2月', '3月', '4月', '5月', '6月'],
    销售额: [12000, 19000, 15000, 25000, 18000, 22000],
    利润: [2400, 3800, 3000, 5000, 3600, 4400],
    订单数: [120, 190, 150, 250, 180, 220]
  }
}
```

### 8.2 散点图数据示例

```javascript
const dataSources = {
  身高体重数据: {
    '身高(cm)': [160, 165, 170, 175, 180, 185, 190, 155, 172, 168],
    '体重(kg)': [50, 55, 65, 70, 80, 85, 90, 45, 68, 60],
    年龄: [20, 25, 30, 35, 40, 45, 50, 18, 32, 28]
  }
}
```

### 8.3 饼图数据示例

```javascript
const dataSources = {
  产品销售数据: {
    产品类别: ['电子产品', '服装', '食品', '家居用品', '其他'],
    销售额: [45000, 30000, 25000, 20000, 10000]
  }
}
```

### 8.4 面积图数据示例

```javascript
const dataSources = {
  网站流量数据: {
    月份: ['1月', '2月', '3月', '4月', '5月', '6月'],
    访问量: [12000, 19000, 15000, 25000, 18000, 22000]
  }
}
```

### 8.5 箱线图数据示例

```javascript
const dataSources = {
  产品评分数据: {
    产品类别: ['电子产品', '服装', '食品', '家居用品'],
    评分: [
      4.2, 3.8, 4.5, 4.0, 4.1, 3.9, 4.3, 4.4, 3.7, 4.2, 4.0, 3.9, 4.1, 4.3, 4.2,
      4.0
    ]
  }
}
```

### 8.6 小提琴图数据示例

```javascript
const dataSources = {
  学生成绩数据: {
    科目: ['数学', '语文', '英语', '物理', '化学'],
    成绩: [
      85, 78, 92, 88, 90, 76, 89, 94, 82, 87, 91, 79, 86, 84, 93, 80, 88, 85,
      90, 83
    ]
  }
}
```

### 8.7 等高线图数据示例

```javascript
const dataSources = {
  地形数据: {
    X轴: [0, 1, 2, 3, 4, 5],
    Y轴: [0, 1, 2, 3, 4, 5],
    数值矩阵: [
      [10, 11, 12, 13, 14, 15],
      [11, 12, 13, 14, 15, 16],
      [12, 13, 14, 15, 16, 17],
      [13, 14, 15, 16, 17, 18],
      [14, 15, 16, 17, 18, 19],
      [15, 16, 17, 18, 19, 20]
    ]
  }
}
```

### 8.8 3D 图表数据示例

```javascript
const dataSources = {
  三维数据: {
    X: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    Y: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    Z: [5, 7, 3, 8, 4, 9, 2, 6, 1, 8]
  }
}
```

### 8.9 金融图表数据示例

```javascript
const dataSources = {
  股票数据: {
    日期: [
      '2023-01-01',
      '2023-01-02',
      '2023-01-03',
      '2023-01-04',
      '2023-01-05'
    ],
    开盘价: [100, 102, 101, 103, 105],
    最高价: [105, 104, 103, 106, 108],
    最低价: [98, 100, 99, 101, 103],
    收盘价: [102, 101, 102, 105, 106]
  }
}
```

### 8.10 瀑布图数据示例

```javascript
const dataSources = {
  财务数据: {
    类别: ['收入', '成本', '费用', '利润'],
    数值: [100000, -40000, -20000, 40000],
    度量类型: ['relative', 'relative', 'relative', 'total']
  }
}
```

### 8.11 漏斗图数据示例

```javascript
const dataSources = {
  销售漏斗数据: {
    阶段: ['访问网站', '注册账号', '添加购物车', '完成购买'],
    数值: [10000, 5000, 2000, 1000]
  }
}
```

### 8.12 雷达图数据示例

```javascript
const dataSources = {
  产品性能数据: {
    维度: ['性能', '易用性', '价格', '外观', '可靠性'],
    数值: [8, 7, 6, 9, 8]
  }
}
```

### 8.13 桑基图数据示例

```javascript
const dataSources = {
  能源流动数据: {
    节点标签: ['煤炭', '石油', '天然气', '电力', '工业', '居民', '交通'],
    源节点: [0, 1, 2, 3, 3, 3],
    目标节点: [3, 3, 3, 4, 5, 6],
    数值: [40, 30, 20, 35, 25, 30]
  }
}
```

### 8.14 地图数据示例

```javascript
const dataSources = {
  世界GDP数据: {
    国家代码: ['CN', 'US', 'JP', 'DE', 'GB', 'FR', 'IN', 'IT', 'CA', 'BR'],
    数值: [17.73, 25.46, 4.23, 4.07, 3.07, 2.78, 3.39, 2.08, 2.14, 1.92]
  }
}
```

## 9. 图表导出

项目支持多种图表导出方式：

### 9.1 导出为 PNG

```javascript
// 在 Chart 组件中调用
this.$refs.chart.saveAsPng()
```

### 9.2 导出为 SVG

```javascript
// 在 Chart 组件中调用
this.$refs.chart.saveAsSvg()
```

### 9.3 导出为 HTML

```javascript
// 在 Chart 组件中调用
this.$refs.chart.saveAsHtml()
```

## 10. 交互功能

图表组件提供了丰富的交互功能：

- **缩放**：支持鼠标滚轮缩放、双击缩放
- **平移**：支持拖动平移
- **选择**：支持框选、套索选择
- **悬停**：支持悬停显示详细信息
- **图例交互**：支持点击图例显示/隐藏轨迹
- **模式栏**：提供了丰富的交互工具，如缩放、平移、重置等

## 11. 响应式设计

图表组件支持响应式设计，会自动适应容器大小变化。可以通过 `useResizeHandler` 属性控制是否启用 resize 处理程序。

## 12. 本地化

图表组件支持中文本地化，通过 `locale` 属性设置为 `"zh"` 或 `"zh-CN"` 即可。

## 13. 最佳实践

### 13.1 数据准备

- 确保数据格式正确，数值字段应为数字类型
- 对于时间序列数据，确保时间格式一致
- 对于分类数据，确保类别名称清晰

### 13.2 图表选择

- 根据数据类型选择合适的图表类型
- 对于比较数据，使用柱状图或折线图
- 对于分布数据，使用直方图或箱线图
- 对于关系数据，使用散点图或热力图
- 对于比例数据，使用饼图或环形图

### 13.3 样式设计

- 保持图表简洁，避免过多装饰
- 使用一致的颜色方案
- 为图表添加清晰的标题和坐标轴标签
- 适当调整字体大小和样式，确保可读性
- 使用图例区分不同的数据系列

### 13.4 性能优化

- 对于大数据集，考虑使用采样或聚合
- 避免同时显示过多的数据系列
- 适当调整图表的分辨率和质量
- 考虑使用 WebGL 渲染（对于支持的图表类型）

## 14. 总结

Sqliteviz 项目提供了强大的图表组件，支持多种图表类型和丰富的配置选项。通过本文档的介绍，您应该能够了解如何使用这些图表组件创建各种类型的图表，并根据需要进行配置和定制。

如果您需要更详细的信息，可以参考 Plotly.js 官方文档或项目源代码。
