import ReactPlotlyEditor from 'react-chart-editor'
import React, { createRef } from 'react'
import EditorControls from 'react-chart-editor/lib/EditorControls'

/**
 * This extended ReactPlotlyEditor has a reference to PlotComponent.
 * The reference makes it possible to call updatePlotly method of PlotComponent.
 * updatePlotly method allows smoothly resize the plot
 * when resize chart editor container.
 */
export default class ReactPlotlyEditorWithPlotRef extends ReactPlotlyEditor {
  constructor(props) {
    super(props)
    this.plotComponentRef = createRef()
  }
  componentWillUnmount() {
    // 清理引用
    if (this.plotComponentRef.current) {
      // 清理组件的props，避免内存泄漏
      if (this.plotComponentRef.current.props) {
        this.plotComponentRef.current.props = null
      }
      this.plotComponentRef.current = null
    }
    // 清理其他引用
    this.props = null
    this.state = null
    // 调用父类的componentWillUnmount方法
    if (super.componentWillUnmount) {
      super.componentWillUnmount()
    }
  }
  render() {
    return (
      <div className="plotly_editor">
        {!this.props.hideControls && (
          <EditorControls
            graphDiv={this.state.graphDiv}
            dataSources={this.props.dataSources}
            dataSourceOptions={this.props.dataSourceOptions}
            plotly={this.props.plotly}
            onUpdate={this.props.onUpdate}
            advancedTraceTypeSelector={this.props.advancedTraceTypeSelector}
            locale={this.props.locale}
            traceTypesConfig={this.props.traceTypesConfig}
            dictionaries={this.props.dictionaries}
            showFieldTooltips={this.props.showFieldTooltips}
            srcConverters={this.props.srcConverters}
            makeDefaultTrace={this.props.makeDefaultTrace}
            glByDefault={this.props.glByDefault}
            mapBoxAccess={Boolean(
              this.props.config && this.props.config.mapboxAccessToken
            )}
            fontOptions={this.props.fontOptions}
            chartHelp={this.props.chartHelp}
            customConfig={this.props.customConfig}
          >
            {this.props.children}
          </EditorControls>
        )}
        <div
          className="plotly_editor_plot"
          style={{ width: '100%', height: '100%' }}
        >
          <this.PlotComponent
            ref={this.plotComponentRef}
            data={this.props.data}
            layout={this.props.layout}
            frames={this.props.frames}
            config={this.props.config}
            useResizeHandler={this.props.useResizeHandler}
            debug={this.props.debug}
            onInitialized={this.handleRender}
            onUpdate={this.handleRender}
            style={{ width: '100%', height: '100%' }}
            divId={this.props.divId}
          />
        </div>
      </div>
    )
  }
}
