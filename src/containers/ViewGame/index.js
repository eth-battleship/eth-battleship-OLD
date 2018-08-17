import _ from 'lodash'
import React, { PureComponent } from 'react'

import Address from '../../components/Address'
import GameBoard from '../../components/GameBoard'
import ErrorBox from '../../components/ErrorBox'
import SetupGameBoard from '../../components/SetupGameBoard'
import AuthenticatedView from '../../components/AuthenticatedView'
import Ship from '../../components/Ship'
import Loading from '../../components/Loading'
import { connectStore } from '../../redux'
import { GAME_STATUS } from '../../utils/constants'
import { isSameAddress } from '../../utils/contract'
import {
  convertMovesHistoryToBitObject,
  doesMovesBitObjectContainPoint,
  getFriendlyGameStatus
} from '../../utils/game'

import styles from './index.styl'

@connectStore('config')
export default class ViewGame extends PureComponent {
  state = {
    loading: true
  }

  componentDidMount () {
    this._refetch()
  }

  _refetch () {
    const id = this._getId(this.props)

    if (this.unsubscribeFromUpdates) {
      this.unsubscribeFromUpdates()
    }

    this.setState({
      error: null,
      loading: true
    }, () => {
      this.props.actions.watchGame(id, this._onGameUpdate)
        .then(unsub => {
          this.unsubscribeFromUpdates = unsub
        })
        .catch(error => {
          this.setState({
            error
          })
        })
    })
  }

  componentWillUnmount () {
    if (this.unsubscribeFromUpdates) {
      this.unsubscribeFromUpdates()
    }
  }

  render () {
    const { loading, error, game } = this.state

    const id = this._getId(this.props)

    return (
      <div>
        <h2>Game: {id}</h2>
        {error ? <ErrorBox>{error}</ErrorBox> : null}
        <AuthenticatedView text='Please sign in to view game'>
          {loading ? <Loading /> : this._renderGame(game)}
        </AuthenticatedView>
      </div>
    )
  }

  _renderGame (game) {
    const { shipLengths } = game

    return (
      <div className={styles.game}>
        <div className={styles.meta}>
          <div>Board length: {game.boardLength}</div>
          <div>Max. rounds: {game.maxRounds}</div>
        </div>
        <div className={styles.meta}>
          <div>Ships:</div>
          <div className={styles.ships}>
            {shipLengths.map((length, i) => (
              <Ship key={i} size={1} length={length} isVertical={false} />
            ))}
          </div>
        </div>
        <div className={styles.meta}>
          <div>Status: {this._renderGameStatus(game)}</div>
        </div>
        <div className={styles.players}>
          <div className={styles.player}>
            {this._renderPlayer(game, 1)}
          </div>
          <div className={styles.player}>
            {(game.status === GAME_STATUS.NEED_OPPONENT) ? (
              this._renderNoOpponent(game, shipLengths)
            ) : (
              this._renderPlayer(game, 2)
            )}
          </div>
        </div>
      </div>
    )
  }

  _renderGameStatus = game => {
    const { status } = game

    return getFriendlyGameStatus(status, game)
  }

  _renderNoOpponent = (game, shipLengths) => {
    const { getDefaultAccount } = this.props.selectors

    if (isSameAddress(getDefaultAccount(), game.player1)) {
      return (
        <p className={styles.noOpponentYet}>
          Please wait for an opponent to join your game!
        </p>
      )
    }

    return (
      <AuthenticatedView text='Please sign in to join this game'>
        <SetupGameBoard
          className={styles.setupBoard}
          boardLength={game.boardLength}
          shipLengths={shipLengths}
          onPressButton={this._onJoinGame}
          buttonText='Join game'
        />
      </AuthenticatedView>
    )
  }

  _renderPlayer (game, p) {
    const playerAddress = game[`player${p}`]

    if (!playerAddress) {
      return null
    }

    const board = _.get(game, `player${p}Data.board.plaintext`)

    const opponentMoves = _.get(game, `players${p === 1 ? 2 : 1}Data.moves`)
    const opponentMovesBits = opponentMoves ? convertMovesHistoryToBitObject(opponentMoves) : {}

    return (
      <div className={styles.playerBoard}>
        <p className={styles.playerId}>
          {`Player${p}`}: <Address address={playerAddress} />
        </p>
        <GameBoard
          boardLength={game.boardLength}
          shipLengths={game.shipLengths}
          shipPositions={board || {}}
          renderCellContent={this._buildCellContentRenderer(game, opponentMovesBits)}
        />
      </div>
    )
  }

  _buildCellContentRenderer = (game, movesBitObj) => (x, y) => {
    if (doesMovesBitObjectContainPoint(game.boardLength, movesBitObj, x, y)) {
      return (
        <span className={styles.hitMarker}>
          <i className='fa fa-cross' />
        </span>
      )
    }

    return null
  }

  _onJoinGame = ({ shipPositions }) => {
    const id = this._getId(this.props)

    if (id) {
      const { joinGame } = this.props.actions

      joinGame(id, shipPositions)
        .catch(error => {
          this.setState({
            error
          })
        })
    }
  }

  _onGameUpdate = game => {
    this.setState({
      error: null,
      loading: false,
      game
    })
  }

  _getId = props => _.get(props, 'match.params.address')
}
