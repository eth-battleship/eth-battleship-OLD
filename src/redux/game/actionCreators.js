import { createAction } from 'redux-actions'

import { CREATE_GAME, WATCH_GAME } from './actions'

export const createNewGame = createAction(CREATE_GAME)

export const watchGame = createAction(WATCH_GAME, (id, callback) => ({
  id, callback
}))
