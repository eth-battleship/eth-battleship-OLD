import React, { PureComponent } from 'react'

import LoadingIcon from '../LoadingIcon'

export default class Loading extends PureComponent {
  render () {
    return (
      <span><LoadingIcon /> Loading</span>
    )
  }
}
