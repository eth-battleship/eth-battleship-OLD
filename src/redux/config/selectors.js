export const getWeb3 = state => state.config.get('web3')
export const getWeb3Promise = state => state.config.get('web3Promise')
export const getWeb3Error = state => state.config.get('web3Error')

export const getAccounts = state => state.config.get('accounts')
export const getNetwork = state => state.config.get('network')

export const getAuthKeyPromise = state => state.config.get('_authKeyPromise').promise
export const getAuthKey = state => state.config.get('authKey')
