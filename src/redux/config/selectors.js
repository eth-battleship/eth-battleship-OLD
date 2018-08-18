export const getWeb3 = state => state.config.get('web3')
export const getWeb3Promise = state => state.config.get('web3Promise')
export const getWeb3Error = state => state.config.get('web3Error')

export const getAccounts = state => state.config.get('accounts')
export const getDefaultAccount = state => state.config.get('defaultAccount')

export const getNetwork = state => state.config.get('network')
export const getAuthKey = state => state.config.get('authKey')
export const getEncryptionKey = state => state.config.get('encryptionKey')

export const waitUntilKeysObtained = state => state.config.get('_keyPromise').promise
export const waitUntilWeb3Connected = state => state.config.get('_web3Promise').promise
