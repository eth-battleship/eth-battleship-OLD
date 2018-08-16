import { CREATE_GAME } from './actions'
import { getStore } from '../'
import { getGameContract } from '../../utils/contract'

// eslint-disable-next-line consistent-return
export default () => () => next => async action => {
  const store = getStore()

  const { selectors: {
    getWeb3
  } } = store

  switch (action.type) {
    case CREATE_GAME: {
      const Game = await getGameContract(getWeb3())

      const contract = await Game.new('0x02', 2, 2, '0xec58f3d8eaf702e8aa85662b02bda7f3c8e5a845b4d68b8245529ad6396c2431')

      console.log(`Contract deployed at: ${contract.address}`)

      next({
        ...action,
        payload: {
          contract
        }
      })

      return store.actions.navGame(contract.address)
    }
    default: {
      return next(action)
    }
  }
}
