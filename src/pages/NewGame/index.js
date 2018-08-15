import React, { PureComponent } from 'react'

import { connectStore } from '../../redux'

@connectStore()
export default class NewGame extends PureComponent {
  render () {
    return (
      <div>
        New game
      </div>
    )
  }
}
