import React, { PureComponent } from 'react'
import cx from 'classnames'

import styles from './index.styl'

export default class ErrorBox extends PureComponent {
  render () {
    const { className } = this.props

    return (
      <div className={cx(styles.box, className)}>{`${this.props.children}`}</div>
    )
  }
}
