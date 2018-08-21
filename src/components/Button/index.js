import React, { PureComponent } from 'react'
import cx from 'classnames'

import LoadingIcon from '../LoadingIcon'

import styles from './index.styl'

export default class Button extends PureComponent {
  render () {
    const { onClick, submitting, className, children, ...props } = this.props

    return (
      <button
        className={cx(styles.button, className)}
        onClick={submitting ? null : onClick}
        {...props}
      >
        {submitting ? <LoadingIcon /> : children}
      </button>
    )
  }
}
