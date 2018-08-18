import React, { PureComponent } from 'react'

import LoadingIcon from '../LoadingIcon'

export default class Button extends PureComponent {
  render () {
    const { submitting, className, children, ...props } = this.props

    return submitting ? (
      <span className={className}>
        <LoadingIcon />
      </span>
    ) : (
      <button className={className} {...props}>{children}</button>
    )
  }
}
