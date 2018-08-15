import GameContract from '../../../build/contracts/Game.json'
import { CREATE_GAME } from './actions'
import { getStore } from '../'
import { getContract } from '../../utils/contract'

// eslint-disable-next-line consistent-return
export default () => () => next => async action => {
  const {
    selectors: {
      getWeb3
    }
  } = getStore()


  switch (action.type) {
    case CREATE_GAME: {
      const game = getContract(getWeb3(), GameContract)

      const contractInstance = await game.deployed()

      console.log(contractInstance.address)

      break
    }
    default: {
      return next(action)
    }
  }
}
