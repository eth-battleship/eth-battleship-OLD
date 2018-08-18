import _ from 'lodash'
import React, { PureComponent } from 'react'

import Address from '../../components/Address'
import GameBoard from '../../components/GameBoard'
import ErrorBox from '../../components/ErrorBox'
import SetupGameBoard from '../../components/SetupGameBoard'
import AuthenticatedView from '../../components/AuthenticatedView'
import Ship from '../../components/Ship'
import Loading from '../../components/Loading'
import LoadingIcon from '../../components/LoadingIcon'
import { connectStore } from '../../redux'
import { GAME_STATUS } from '../../utils/constants'
import { isSameAddress } from '../../utils/contract'
import {
  getFriendlyGameStatus,
  getNextPlayerToPlay
} from '../../utils/game'

import styles from './index.styl'

@connectStore('config')
export default class ViewGame extends PureComponent {
  state = {
    error: null,
    game: null
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
      game: null
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
    const { error, game } = this.state

    const id = this._getId(this.props)

    let content = null

    if (!error) {
      content = (
        <AuthenticatedView text='Please sign in to view game'>
          {game ? this._renderGame(game) : <Loading />}
        </AuthenticatedView>
      )
    }

    return (
      <div>
        <h2>Game: {id}</h2>
        {error ? <ErrorBox>{error}</ErrorBox> : null}
        {content}
      </div>
    )
  }

  _renderGame (game) {
    const { moving } = this.state
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
          <div>Status: {moving ? <LoadingIcon /> : this._renderGameStatus(game)}</div>
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

    const opponent = (1 === p ? 2 : 1)
    const opponentAddress = game[`player${opponent}`]

    const { getDefaultAccount } = this.props.selectors
    const account = getDefaultAccount()

    const props = {}
    // if i am the opponent and the opponent is to play next
    if (account === opponentAddress && getNextPlayerToPlay(game) === opponent) {
      props.applyHoverStyleToEmptyCell = this._applyHoverStyleToEmptyCell
      props.onPress = this._buildCellSelector(game)
    }

    const board = _.get(game, `player${p}Board.plaintext`)
    const opponentMoves = _.get(game, `player${opponent}Moves`, [])

    return (
      <div className={styles.playerBoard}>
        <p className={styles.playerId}>
          {`Player${p}`}: <Address address={playerAddress} />
        </p>
        <GameBoard
          boardLength={game.boardLength}
          shipLengths={game.shipLengths}
          shipPositions={board || {}}
          renderCellContent={this._buildCellContentRenderer(game, opponentMoves)}
          {...props}
        />
      </div>
    )
  }

  _applyHoverStyleToEmptyCell = (style, x, y, hoverX, hoverY) => {
    if (hoverX === x && hoverY === y) {
      style.cursor = 'pointer'
      style.outline = '1px solid #f00'
    }
  }

  _buildCellSelector = game => (x, y) => {
    const id = this._getId(this.props)

    this.setState({
      error: null,
      moving: true
    }, () => {
      this.props.actions.playMove(id, game, x, y)
        .then(() => {
          this.setState({
            moving: false
          })
        })
        .then(error => {
          this.setState({
            moving: false,
            error
          })
        })
    })
  }

  _buildCellContentRenderer = (game, opponentMoves) => (cellX, cellY) => {
    let content = null

    opponentMoves.forEach(({ x, y, hit }) => {
      if (x === cellX && y === cellY) {
        if (hit) {
          content = (
            <span className={styles.hitMarker} title='Hit!'>
              <i className='fa fa-times-circle' />
            </span>
          )
        } else {
          content = (
            <span className={styles.missMarker} title='Miss'>
              <i className='fa fa-times-circle' />
            </span>
          )
        }
      }
    })

    return content
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

  _onGameUpdate = (error, game) => {
    if (error) {
      this.setState({
        error,
        game: null
      })
    } else {
      this.setState({
        error,
        game
      })
    }
  }

  _getId = props => _.get(props, 'match.params.address')
}
