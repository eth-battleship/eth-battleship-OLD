import Immutable from 'immutable'
import { handleActions } from 'redux-actions'

import { CREATE_GAME } from './actions'


export default () => handleActions({
  [CREATE_GAME]: (state, { payload: { contract } }) => (
    state.set('game', contract)
  )
}, Immutable.Map({
  game: null
}))
