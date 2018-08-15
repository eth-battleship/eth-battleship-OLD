import { SETUP_WEB3 } from './actions'
import setupWeb3 from '../../web3'

// eslint-disable-next-line consistent-return
export default () => () => next => async action => {
  switch (action.type) {
    case SETUP_WEB3: {
      try {
        const web3 = await setupWeb3()

        return next({
          ...action,
          payload: { web3 }
        })
      } catch (web3Error) {
        return next({
          ...action,
          payload: { web3Error }
        })
      }
    }
    default: {
      return next(action)
    }
  }
}
