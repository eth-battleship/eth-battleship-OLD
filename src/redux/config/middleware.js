import { AUTH_SENTENCE } from '../../utils/constants'
import { SETUP_WEB3, AUTHENTICATE } from './actions'
import setupWeb3 from '../../web3'
import { getStore } from '../'

// eslint-disable-next-line consistent-return
export default () => () => next => async action => {
  switch (action.type) {
    case SETUP_WEB3: {
      try {
        const { web3, network, accounts } = await setupWeb3()

        return next({
          ...action,
          payload: { web3, network, accounts }
        })
      } catch (web3Error) {
        return next({
          ...action,
          payload: { web3Error }
        })
      }
    }
    case AUTHENTICATE: {
      const { selectors: { getWeb3, getAccounts } } = getStore()

      const web3 = getWeb3()
      const accounts = getAccounts()

      const authKey = await web3.eth.personal.sign(AUTH_SENTENCE, accounts[0])

      return next({
        ...action,
        payload: { authKey }
      })
    }
    default: {
      return next(action)
    }
  }
}
