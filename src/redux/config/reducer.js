import Immutable from 'immutable'
import { handleActions } from 'redux-actions'

import { SETUP_WEB3, AUTHENTICATE } from './actions'

export default () => {
  const authKeyPromise = {}

  authKeyPromise.promise = new Promise(resolve => {
    authKeyPromise.resolve = resolve
  })

  return handleActions({
    [SETUP_WEB3]: (state, { payload: { web3, accounts, network, web3Error } }) => (
      state
        .set('web3', web3)
        .set('accounts', accounts)
        .set('network', network.toLowerCase())
        .set('web3Error', web3Error)
    ),
    [AUTHENTICATE]: (state, { payload: { authKey } }) => {
      authKey = authKey.toLowerCase()

      authKeyPromise.resolve(authKey)

      return state
        .set('authKey', authKey)
    }
  }, Immutable.Map({
    accounts: null,
    network: null,
    web3: null,
    web3Error: null,
    authKey: null,
    _authKeyPromise: authKeyPromise
  }))
}
