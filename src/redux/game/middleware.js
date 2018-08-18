import { CREATE_GAME, PLAY_MOVE, JOIN_GAME, WATCH_GAME, LOAD_GAMES, LOAD_MY_GAMES } from './actions'
import { getStore } from '../'
import { getGameContract } from '../../utils/contract'
import { shipPositionsToSolidityBytesHex, shipLengthsToSolidityBytesHex } from '../../utils/game'
import cloudDb from '../../cloudDb'
import { processGames } from './utils'


// eslint-disable-next-line consistent-return
export default () => () => next => async action => {
  const store = getStore()

  const { selectors: {
    getWeb3,
    getDefaultAccount,
    getAuthKey,
    getNetwork,
    waitUntilWeb3Connected,
    waitUntilKeysObtained,
  } } = store

  switch (action.type) {
    case LOAD_MY_GAMES: {
      await waitUntilKeysObtained()

      const account = getDefaultAccount()

      const games = await cloudDb.loadMyGames(getNetwork(), account)

      await processGames(getWeb3(), games, getAuthKey(), account)

      return games
    }
    case LOAD_GAMES: {
      await waitUntilWeb3Connected()

      return cloudDb.loadGames(getNetwork())
    }
    case WATCH_GAME: {
      await waitUntilKeysObtained()

      const authKey = await getAuthKey()

      const { id, callback } = action.payload

      const account = getDefaultAccount()

      return cloudDb.watchGame(id, game => {
        if (!game) {
          callback(new Error('Game not found'))
        } else {
          processGames(getWeb3(), { [id]: game }, authKey, account, true)
            .catch(err => {
              console.error('Error sanitizing game info', err)

              callback(err)
            })
            .then(() => {
              callback(null, game)
            })
        }
      })
    }
    case PLAY_MOVE: {
      await waitUntilKeysObtained()

      const { id, game, x, y } = action.payload

      const account = getDefaultAccount()

      // always update moves arrays
      const newGameData = {
        player1Moves: game.player1Moves,
        player2Moves: game.player2Moves
      }
      const newPlayerData = {}

      if (account === game.player1) {
        newGameData.player1Moves = game.player1Moves.concat([ { x, y } ])
        newPlayerData.moves = newGameData.player1Moves
      } else {
        newGameData.player2Moves = game.player2Moves.concat([ { x, y } ])
        newPlayerData.moves = newGameData.player2Moves
        newGameData.round = game.round + 1
      }

      await cloudDb.updateGame(id, newGameData, getAuthKey(), newPlayerData)

      break
    }
    case JOIN_GAME: {
      await waitUntilKeysObtained()

      const { id, shipPositions } = action.payload

      const authKey = await getAuthKey()
      const account = getDefaultAccount()
      const web3 = getWeb3()

      const Game = await getGameContract(web3, account)
      const contract = await Game.at(id)

      const board = shipPositionsToSolidityBytesHex(shipPositions)

      console.log('Calculating board hash...')

      const boardHash = await contract.calculateBoardHash.call(
        await contract.ships.call(),
        await contract.boardSize.call(),
        board
      )

      console.log(`...${boardHash}`)

      console.log('Calling contract join()...')

      await contract.join(boardHash)

      console.log(`...done`)

      console.log(`Updating game data in cloud...`)

      await cloudDb.updateGame(id, {
        player2: account,
        round: 1
      }, authKey, {
        shipPositions,
        moves: []
      })

      console.log(`...done`)

      return Promise.resolve()
    }
    case CREATE_GAME: {
      await waitUntilKeysObtained()

      const authKey = await getAuthKey()
      const network = await getNetwork()
      const account = getDefaultAccount()
      const web3 = getWeb3()

      const Game = await getGameContract(web3, account)

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
        network,
        player1: await contract.player1.call(),
        player1Moves: [],
        player2: null,
        player2Moves: [],
        /*
        We include the following props for convenience sake, so that we can quickly
        render the list of games in table without having to fetch these props
        from each individual contract. However, note that when viewing an
        individual game we will override these values with what's in the
        contract.
        */
        boardLength,
        maxRounds,
        shipLengths
      }, authKey, /* player1's private data */ {
        shipPositions,
        moves: []
      })

      console.log(`...done`)

      return store.actions.navGame(contract.address)
    }
    default: {
      return next(action)
    }
  }
}
