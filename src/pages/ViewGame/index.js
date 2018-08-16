import React, { PureComponent } from 'react'

import AuthenticatedView from '../../components/AuthenticatedView'
import { connectStore } from '../../redux'

@connectStore()
export default class ViewGame extends PureComponent {
  render () {
    // const { match: { address: id } } = this.props

    return (
      <AuthenticatedView>test</AuthenticatedView>
    )
  }
}
