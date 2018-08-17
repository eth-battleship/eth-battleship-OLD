import React, { PureComponent } from 'react'

import LoadingIcon from '../LoadingIcon'

export default class Button extends PureComponent {
  render () {
    const { submitting, children, ...props } = this.props

    return submitting ? <LoadingIcon /> : (
      <button {...props}>{children}</button>
    )
  }
}
