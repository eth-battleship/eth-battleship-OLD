import Immutable from 'immutable'
import { handleActions } from 'redux-actions'

import { SETUP_WEB3, AUTHENTICATE } from './actions'

export default () => handleActions({
  [SETUP_WEB3]: (state, { payload: { web3, accounts, web3Error } }) => (
    state
      .set('web3', web3)
      .set('accounts', accounts)
      .set('web3Error', web3Error)
  ),
  [AUTHENTICATE]: (state, { payload: { authKey } }) => (
    state.set('authKey', authKey)
  )
}, Immutable.Map({
  accounts: null,
  web3: null,
  web3Error: null,
  authKey: null
}))
