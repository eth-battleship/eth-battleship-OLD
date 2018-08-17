import Contract from 'truffle-contract'

import GameContract from '../../build/contracts/Game.json'

export const getGameContract = async (web3, account) => {
  const c = Contract(GameContract)
  c.setProvider(web3.currentProvider)
  c.defaults({
    from: account
  })

  return c
}

export const isSameAddress = (a1, a2) => a1 && a2 && a1.toLowerCase() === a2.toLowerCase()
