import { createAction } from 'redux-actions'

import { CREATE_GAME, WATCH_GAME, JOIN_GAME, LOAD_GAMES, LOAD_MY_GAMES } from './actions'

export const createNewGame = createAction(CREATE_GAME)

export const watchGame = createAction(WATCH_GAME, (id, callback) => ({
  id, callback
}))

export const joinGame = createAction(JOIN_GAME, (id, shipPositions) => ({ id, shipPositions }))

export const loadGames = createAction(LOAD_GAMES)

export const loadMyGames = createAction(LOAD_MY_GAMES)
