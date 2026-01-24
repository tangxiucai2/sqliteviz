import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { localizeString } from 'react-chart-editor/lib'

class EditorControls extends Component {
  constructor(props, context) {
    super(props, context)

    this.localize = key =>
      localizeString(this.props.dictionaries || {}, this.props.locale || 'zh', key)
  }

  getChildContext() {
    return {
      dictionaries: this.props.dictionaries || {},
      localize: this.localize,
      locale: this.props.locale || 'zh'
    }
  }

  render() {
    return (
      <div
        className={
          'editor_controls plotly-editor--theme-provider' +
          `${this.props.className ? ` ${this.props.className}` : ''}`
        }
      >
        {this.props.children}
      </div>
    )
  }
}

EditorControls.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  dictionaries: PropTypes.object,
  locale: PropTypes.string
}

EditorControls.defaultProps = {
  locale: 'zh'
}

EditorControls.childContextTypes = {
  dictionaries: PropTypes.object,
  locale: PropTypes.string,
  localize: PropTypes.func
}

export default EditorControls
