import Immutable from 'immutable'
import { handleActions } from 'redux-actions'

import { SETUP_WEB3 } from './actions'

export default () => handleActions({
  [SETUP_WEB3]: (state, { payload: { web3, web3Error } }) => (
    state.set('web3', web3).set('web3Error', web3Error)
  )
}, Immutable.Map({
  web3: null,
  web3Error: null
}))
