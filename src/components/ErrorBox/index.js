import React, { PureComponent } from 'react'

export default class ErrorBox extends PureComponent {
  render () {
    return (
      <div>{`${this.props.error}`}</div>
    )
  }
}
