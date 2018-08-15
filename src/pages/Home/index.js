import React, { PureComponent } from 'react'

import { connectStore } from '../../redux'

@connectStore()
export default class Home extends PureComponent {
  render () {
    return (
      <div>
        <button onClick={this._onStartGame}>Start new game</button>
      </div>
    )
  }

  _onStartGame = () => {
    this.props.actions.navNewGame()
  }
}
