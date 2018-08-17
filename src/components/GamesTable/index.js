import React, { PureComponent } from 'react'

import { connectStore } from '../../redux'
import { getFriendlyGameStatus } from '../../utils/game'

import styles from './index.styl'

@connectStore()
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
            {getFriendlyGameStatus(game.status)}
          </td>
        </tr>
      )
    })

    return (
      <table style={styles.table}>
        <tbody>{rows}</tbody>
      </table>
    )
  }

  _onPress = id => {
    const { navGame } = this.props.actions

    navGame(id)
  }
}
