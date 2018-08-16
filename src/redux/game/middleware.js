import { CREATE_GAME, WATCH_GAME } from './actions'
import { getStore } from '../'
import { getGameContract, isSameAddress } from '../../utils/contract'
import { shipPositionsToSolidityBytesHex, shipLengthsToSolidityBytesHex } from '../../utils/ships'
import { encrypt, decrypt } from '../../utils/crypto'
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
    case WATCH_GAME: {
      const { id, callback } = action.payload

      return cloudDb.watchGame(id, async snapshot => {
        const doc = snapshot.data()

        try {
          if (authKey) {
            if (doc.player1 && isSameAddress(doc.player1.address, accounts[0])) {
              doc.player1.board.plaintext = await decrypt(authKey, doc.player1.board)
            } else if (doc.player2 && isSameAddress(doc.player2.address, accounts[0])) {
              doc.player2.board.plaintext = await decrypt(authKey, doc.player2.board)
            }
          }
        } catch (err) {
          console.error('Error sanitizing game info', err)
        } finally {
          callback(doc)
        }
      })
    }
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
