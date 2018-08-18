import React, { PureComponent } from 'react'

import styles from './index.styl'

export default class ErrorBox extends PureComponent {
  render () {
    return (
      <div className={styles.box}>{`${this.props.children}`}</div>
    )
  }
}
