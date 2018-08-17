import Immutable from 'immutable'
import { handleActions } from 'redux-actions'

import { SETUP_WEB3, AUTHENTICATE } from './actions'

export default () => {
  const _authKeyPromise = {}
  _authKeyPromise.promise = new Promise(resolve => {
    _authKeyPromise.resolve = resolve
  })

  const _web3Promise = {}
  _web3Promise.promise = new Promise(resolve => {
    _web3Promise.resolve = resolve
  })

  return handleActions({
    [SETUP_WEB3]: (state, { payload: { web3, accounts, network, web3Error } }) => {
      _web3Promise.resolve()

      return state
        .set('web3', web3)
        .set('accounts', accounts)
        .set('network', network.toLowerCase())
        .set('web3Error', web3Error)
    },
    [AUTHENTICATE]: (state, { payload: { authKey } }) => {
      _authKeyPromise.resolve()

      return state
        .set('authKey', authKey.toLowerCase())
    }
  }, Immutable.Map({
    accounts: null,
    network: null,
    web3: null,
    _web3Promise,
    web3Error: null,
    authKey: null,
    _authKeyPromise
  }))
}
