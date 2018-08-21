import Contract from 'truffle-contract'

import GameContract from '../../build/contracts/Game.json'
import GameLibraryContract from '../../build/contracts/GameLibrary.json'

const getContract = async (Klass, web3, account = undefined) => {
  const c = Contract(Klass)

  c.setProvider(web3.currentProvider)

  // this ensures contract can figure out library links, etc
  await c.detectNetwork()

  /* Fix for minor truffle-contract issue, this ensures I can deploy a new
  instance later on */
  c.unlinked_binary = c._json.bytecode

  if (account) {
    c.defaults({
      from: account
    })
  }

  return c
}


export const getGameContract = getContract.bind(null, GameContract)

export const getLibraryContract = getContract.bind(null, GameLibraryContract)

export const isSameAddress = (a1, a2) => a1 && a2 && a1.toLowerCase() === a2.toLowerCase()
