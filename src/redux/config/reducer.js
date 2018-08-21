import Immutable from 'immutable'
import { handleActions } from 'redux-actions'

import { SETUP_WEB3, AUTHENTICATE } from './actions'

export default () => {
  const _keyPromise = {}
  _keyPromise.promise = new Promise(resolve => {
    _keyPromise.resolve = resolve
  })

  const _web3Promise = {}
  _web3Promise.promise = new Promise(resolve => {
    _web3Promise.resolve = resolve
  })

  return handleActions({
    [SETUP_WEB3]: (state, { payload: { web3, accounts, network, connectionError } }) => {
      _web3Promise.resolve()

      return state
        .set('web3', web3)
        .set('accounts', accounts)
        .set('network', network ? network.toLowerCase() : null)
        .set('connectionError', connectionError)
    },
    [AUTHENTICATE]: (state, { payload: { encryptionKey, authKey, signingAccount } }) => {
      _keyPromise.resolve()

      return state
        .set('defaultAccount', signingAccount)
        .set('encryptionKey', encryptionKey.toLowerCase())
        .set('authKey', authKey.toLowerCase())
    }
  }, Immutable.Map({
    accounts: null,
    defaultAccount: null,
    network: null,
    web3: null,
    _web3Promise,
    connectionError: null,
    encryptionKey: null,
    authKey: null,
    _keyPromise
  }))
}
