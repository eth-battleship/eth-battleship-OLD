import React, { PureComponent } from 'react'

import { GAME_STATUS } from '../../utils/constants'
import { connectStore } from '../../redux'

import styles from './index.styl'

@connectStore('game')
export default class GameTable extends PureComponent {
  render () {
    const { games } = this.props

    const rows = Object.keys(games).map(id => {
      const game = games[id]

      return (
        <tr key={id} onClick={() => this._onPress(id)}>
          <td className={styles.id}>
            {id}
          </td>
          <td className={styles.created}>
            {new Date(game.created).toString()}
          </td>
          <td className={styles.status}>
            {this._renderGameStatus(game.status)}
          </td>
        </tr>
      )
    })

    return (
      <table style={styles.table}>
        <tbody>
          {rows}
        </tbody>
      </table>
    )
  }

  _renderGameStatus = status => {
    switch (status) {
      case GAME_STATUS.NEED_OPPONENT:
        return 'Awaiting opponent'
      case GAME_STATUS.OVER:
        return 'Over'
      case GAME_STATUS.PLAYING:
        return 'Playing'
      default:
        return 'Unknown'
    }
  }

  _onPress = id => {
    const { navGame } = this.props.actions

    navGame(id)
  }
}
