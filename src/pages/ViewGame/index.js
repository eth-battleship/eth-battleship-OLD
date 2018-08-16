import React, { PureComponent } from 'react'

import { connectStore } from '../../redux'

@connectStore()
export default class ViewGame extends PureComponent {
  render () {
    return (
      <div>
        view  game
      </div>
    )
  }
}
