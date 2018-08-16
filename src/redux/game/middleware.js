import { CREATE_GAME } from './actions'
import { getStore } from '../'
import { getGameContract } from '../../utils/contract'
import { shipPositionsToSolidityBytesHex, shipLengthsToSolidityBytesHex } from '../../utils/ships'
import { encrypt } from '../../utils/crypto'
import cloudDb from '../../cloudDb'

// eslint-disable-next-line consistent-return
export default () => () => next => async action => {
  const store = getStore()

  const { selectors: {
    getWeb3,
    getAccounts,
    getAuthKey
  } } = store

  const authKey = getAuthKey()
  const accounts = getAccounts()
  const web3 = getWeb3()

  switch (action.type) {
    case CREATE_GAME: {
      const Game = await getGameContract(web3, accounts)

      let contract = await Game.deployed()

      const { maxRounds, boardLength, shipPositions, shipLengths } = action.payload

      const ships = shipLengthsToSolidityBytesHex(shipLengths)
      const board = shipPositionsToSolidityBytesHex(shipPositions)

      console.log('Calculating board hash...')

      const boardHash = await contract.calculateBoardHash.call(ships, boardLength, board)

      console.log(`...${boardHash}`)

      console.log('Deploying new contract...')

      contract = await Game.new(ships, boardLength, maxRounds, boardHash)

      console.log(`...deployed at: ${contract.address}`)

      console.log(`Setting up cloud data...`)

      await cloudDb.addGame(contract.address, {
        player1: {
          address: await contract.player1.call(),
          board: await encrypt(authKey, board)
        },
        ships,
        boardLength,
        maxRounds,
      })

      console.log(`...done`)

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
