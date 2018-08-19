import { createAction } from 'redux-actions'

import { CREATE_GAME, PLAY_MOVE, WATCH_GAME, JOIN_GAME, LOAD_GAMES, LOAD_MY_GAMES,
  REVEAL_MOVES, REVEAL_BOARD } from './actions'

export const createNewGame = createAction(CREATE_GAME)

export const watchGame = createAction(WATCH_GAME, (id, callback) => ({
  id, callback
}))

export const joinGame = createAction(JOIN_GAME, (id, shipPositions) => ({ id, shipPositions }))

export const loadGames = createAction(LOAD_GAMES)

export const loadMyGames = createAction(LOAD_MY_GAMES)

export const playMove = createAction(PLAY_MOVE, (id, game, x, y) => ({ id, game, x, y }))

export const revealMoves = createAction(REVEAL_MOVES, (id, game, moves) => ({ id, game, moves }))

export const revealBoard = createAction(
  REVEAL_BOARD,
  (id, game, shipPositions) => ({ id, game, shipPositions })
)
