import _ from 'lodash'
import React, { PureComponent } from 'react'
import cx from 'classnames'

import Address from '../../components/Address'
import GameBoard from '../../components/GameBoard'
import Button from '../../components/Button'
import ErrorBox from '../../components/ErrorBox'
import SetupGameBoard from '../../components/SetupGameBoard'
import AuthenticatedView from '../../components/AuthenticatedView'
import Ship from '../../components/Ship'
import Loading from '../../components/Loading'
import LoadingIcon from '../../components/LoadingIcon'
import { connectStore } from '../../redux'
import { GAME_STATUS, PLAYER_STATUS } from '../../utils/constants'
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
      error: null
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

    return (
      <div>
        <h2>Game: {id}</h2>
        {error ? <ErrorBox className={styles.error}>{`${error}`}</ErrorBox> : null}
        <AuthenticatedView text='Please sign in to view game'>
          {game ? this._renderGame(game) : <Loading />}
        </AuthenticatedView>
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
          <div className={styles.statusText}>
            Status: {moving ? <LoadingIcon /> : this._renderGameStatus(game)}
          </div>
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
    const { joining } = this.state
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
          buttonSubmitting={joining}
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

    const iAmPlayer = account === playerAddress
    const iAmOpponent = account === opponentAddress

    const props = {}
    // if i am the opponent and the opponent is to play next
    if (iAmOpponent && getNextPlayerToPlay(game) === opponent) {
      props.applyHoverStyleToEmptyCell = this._applyHoverStyleToEmptyCell
      props.onPress = this._buildCellSelector(game)
    }

    const board = _.get(game, `player${p}Board`, {})
    const opponentHits = _.get(game, `player${opponent}Hits`, undefined)
    const opponentMoves = _.get(game, `player${opponent}Moves`, [])

    const playerIcon = (game.status === GAME_STATUS.PLAYING && getNextPlayerToPlay(game) === p)
      ? <i className={cx('fa fa-caret-right', styles.activePlayerIcon)} />
      : null

    return (
      <div className={styles.playerBoard}>
        <p className={styles.playerId}>
          {playerIcon}
          {`Player${p}`}: <Address address={playerAddress} />
        </p>
        {undefined !== opponentHits ? (
          <p className={styles.playerHits}>{opponentHits} hits scored by opponent</p>
        ) : null}
        <GameBoard
          boardLength={game.boardLength}
          shipLengths={game.shipLengths}
          shipPositions={board}
          renderCellContent={this._buildCellContentRenderer(game, opponentMoves, iAmOpponent)}
          {...props}
        />
      {this._renderReveal(game, p, iAmPlayer)}
      </div>
    )
  }

  _renderReveal = (game, p, iAmPlayer) => {
    const { revealing } = this.state

    if (
      (game.status !== GAME_STATUS.REVEAL_MOVES &&
        game.status !== GAME_STATUS.REVEAL_BOARD)
      || !iAmPlayer
    ) {
      return null
    }

    let buttonText = false
    let revealMoves = false

    if (game.status === GAME_STATUS.REVEAL_MOVES) {
      if (game[`player${p}Status`] !== PLAYER_STATUS.REVEALED_MOVES) {
        buttonText = 'Reveal moves to contract'
        revealMoves = true
      }
    } else if (game.status === GAME_STATUS.REVEAL_BOARD) {
      if (game[`player${p}Status`] !== PLAYER_STATUS.REVEALED_BOARD) {
        buttonText = 'Reveal board to contract'
      }
    }

    return (
      <div className={styles.reveal}>
        {buttonText ? (
          <Button
            submitting={revealing}
            onClick={revealMoves
              ? () => this._onRevealMoves(p)
              : () => this._onRevealBoard(p)}
          >
            {buttonText}
          </Button>
        ) : (
          <p>{getFriendlyGameStatus(game.status, game)}</p>
        )}
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
      moving: { x, y }
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

  _buildCellContentRenderer = (game, opponentMoves, iAmOpponent) => (cellX, cellY) => {
    const { moving } = this.state
    let content = null

    if (iAmOpponent && moving && moving.x === cellX && moving.y === cellY) {
      content = (
        <span className={styles.missMarker}>
          <i className='fa fa-spin fa-spinner' />
        </span>
      )
    } else {
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
    }

    return content
  }

  _onRevealMoves = playerNum => {
    const id = this._getId(this.props)
    const { game } = this.state

    this.setState({
      revealing: true,
      error: null
    }, () => {
      this.props.actions.revealMoves(id, game, game[`player${playerNum}Moves`])
        .then(() => {
          this.setState({
            revealing: false
          })
        })
        .catch(error => {
          this.setState({
            revealing: false,
            error
          })
        })
    })
  }


  _onRevealBoard = playerNum => {
    const id = this._getId(this.props)
    const { game } = this.state

    this.setState({
      revealing: true,
      error: null
    }, () => {
      this.props.actions.revealBoard(id, game, game[`player${playerNum}Board`])
        .then(() => {
          this.setState({
            revealing: false
          })
        })
        .catch(error => {
          this.setState({
            revealing: false,
            error
          })
        })
    })
  }


  _onJoinGame = ({ shipPositions }) => {
    const id = this._getId(this.props)

    if (id) {
      const { joinGame } = this.props.actions

      this.setState({
        joining: true,
        error: null
      }, () => {
        joinGame(id, shipPositions)
          .then(() => {
            this.setState({
              joining: false
            })
          })
          .catch(error => {
            this.setState({
              joining: false,
              error
            })
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
