import React, { PureComponent } from 'react'

import { connectStore } from '../../redux'

@connectStore()
export default class NewGame extends PureComponent {
  render () {
    return (
      <div>
        <button onClick={this._onStartGame}>Start game</button>
      </div>
    )
  }

  _onStartGame = () => {
    this.props.actions.createNewGame()
  }
}
