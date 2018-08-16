import { createAction } from 'redux-actions'

import { CREATE_GAME, WATCH_GAME, LOAD_ACTIVE_GAMES } from './actions'

export const createNewGame = createAction(CREATE_GAME)

export const watchGame = createAction(WATCH_GAME, (id, callback) => ({
  id, callback
}))

export const loadActiveGames = createAction(LOAD_ACTIVE_GAMES)
