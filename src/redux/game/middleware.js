import { CREATE_GAME, WATCH_GAME, LOAD_ACTIVE_GAMES } from './actions'
import { GAME_STATUS } from '../../utils/constants'
import { getStore } from '../'
import { getGameContract, isSameAddress } from '../../utils/contract'
import { shipPositionsToSolidityBytesHex, shipLengthsToSolidityBytesHex } from '../../utils/ships'
import { encrypt, decrypt } from '../../utils/crypto'
import cloudDb from '../../cloudDb'

const _processGames = (games, authKey, address) => {
  let promise = Promise.resolve()

  if (authKey) {
    promise = Promise.all(Object.keys(games).map(gameId => {
      const game = games[gameId]

      if (GAME_STATUS.OVER !== game.status) {
        if (isSameAddress(game.player1, address)) {
          return decrypt(authKey, game.player1Data.board)
            .then(plaintext => { game.player1Data.board.plaintext = plaintext })
        } else if (isSameAddress(game.player2, address)) {
          return decrypt(authKey, game.player2Data.board)
            .then(plaintext => { game.player2Data.board.plaintext = plaintext })
        }
      }

      return Promise.resolve()
    }))
  }

  return promise.then(() => games)
}

// eslint-disable-next-line consistent-return
export default () => () => next => async action => {
  const store = getStore()

  const { selectors: {
    getWeb3,
    getAccounts,
    getAuthKey,
    getNetwork,
    waitUntilWeb3Connected,
    waitUntilAuthKeyObtained,
  } } = store

  switch (action.type) {
    case LOAD_ACTIVE_GAMES: {
      await waitUntilWeb3Connected()

      const games = await cloudDb.loadActiveGames(getNetwork())

      await _processGames(games, getAuthKey(), getAccounts()[0])

      return games
    }
    case WATCH_GAME: {
      await waitUntilAuthKeyObtained()

      const authKey = await getAuthKey()

      const { id, callback } = action.payload

      return cloudDb.watchGame(id, game => {
        _processGames([ game ], authKey, getAccounts()[0])
          .catch(err => {
            console.error('Error sanitizing game info', err)
          })
          .then(() => {
            callback(game)
          })
      })
    }
    case CREATE_GAME: {
      await waitUntilAuthKeyObtained()

      const authKey = await getAuthKey()
      const network = await getNetwork()
      const accounts = getAccounts()
      const web3 = getWeb3()

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
        status: GAME_STATUS.NEED_OPPONENT,
        network,
        ships,
        boardLength,
        maxRounds,
        player1: await contract.player1.call(),
        player1Data: {
          board: await encrypt(authKey, board)
        }
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
