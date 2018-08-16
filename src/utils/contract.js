import Contract from 'truffle-contract'

import GameContract from '../../build/contracts/Game.json'
import { promisify } from './promise'

export const getGameContract = async web3 => {
  const accounts = await promisify(web3.eth.getAccounts)()

  const c = Contract(GameContract)
  c.setProvider(web3.currentProvider)
  c.defaults({
    from: accounts[0]
  })

  return c
}
