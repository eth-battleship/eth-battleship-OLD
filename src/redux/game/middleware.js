import { CREATE_GAME, PLAY_MOVE, JOIN_GAME, WATCH_GAME, LOAD_GAMES, LOAD_MY_GAMES,
  REVEAL_BOARD, REVEAL_MOVES } from './actions'
import { getStore } from '../'
import { getGameContract, getLibraryContract } from '../../utils/contract'
import { GAME_STATUS } from '../../utils/constants'
import {
  shipPositionsToSolidityBytesHex,
  shipLengthsToSolidityBytesHex,
  moveArrayToHexString,
  deriveGameStatusFromContractValue
} from '../../utils/game'
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

      console.log('Load my games from cloud...')

      return cloudDb.loadMyGames(getNetwork(), account)
    }
    case LOAD_GAMES: {
      await waitUntilWeb3Connected()

      console.log('Load all games from cloud...')

      return cloudDb.loadGames(getNetwork())
    }
    case WATCH_GAME: {
      await waitUntilKeysObtained()

      const authKey = await getAuthKey()

      const { id, callback } = action.payload

      console.log(`Load and watch game ${id} from cloud...`)

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
    case REVEAL_MOVES: {
      await waitUntilKeysObtained()

      const { id, game, moves } = action.payload

      const account = getDefaultAccount()
      const web3 = getWeb3()

      const Game = await getGameContract(web3, account)
      const contract = await Game.at(id)

      console.log('Calling contract revealMoves()...')

      await contract.revealMoves(moveArrayToHexString(game.boardLength, moves))

      console.log(`...done`)

      console.log(`Updating game in cloud...`)

      await cloudDb.updateGame(id, {
        status: GAME_STATUS.REVEAL_MOVES
      })

      console.log(`...done`)

      break
    }
    case REVEAL_BOARD: {
      await waitUntilKeysObtained()

      const { id, shipPositions } = action.payload

      const account = getDefaultAccount()
      const web3 = getWeb3()

      const Game = await getGameContract(web3, account)
      const contract = await Game.at(id)

      console.log('Calling contract revealBoard()...')

      await contract.revealBoard(shipPositionsToSolidityBytesHex(shipPositions))

      const newStatus = deriveGameStatusFromContractValue(await contract.state.call())

      console.log(`...done`)

      console.log(`Updating game in cloud...`)

      await cloudDb.updateGame(id, {
        status: newStatus
      })

      console.log(`...done`)

      break
    }
    case PLAY_MOVE: {
      await waitUntilKeysObtained()

      const { id, game, x, y } = action.payload

      console.log(`Play move (${x}, ${y}) for game ${id}...`)

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

      console.log(`...done`)

      break
    }
    case JOIN_GAME: {
      await waitUntilKeysObtained()

      const { id, shipPositions } = action.payload

      console.log(`Join game ${id}...`)

      const authKey = await getAuthKey()
      const account = getDefaultAccount()
      const web3 = getWeb3()

      const Game = await getGameContract(web3, account)
      const contract = await Game.at(id)

      const Library = await getLibraryContract(web3)
      const libraryContract = await Library.deployed()

      const board = shipPositionsToSolidityBytesHex(shipPositions)

      console.log(`Calculating board hash for ${board}...`)

      const boardHash = await libraryContract.calculateBoardHash.call(
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
        round: 1,
        status: GAME_STATUS.PLAYING
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

      const Library = await getLibraryContract(web3)
      const libraryContract = await Library.deployed()

      console.log(`Create game...`)

      const { maxRounds, boardLength, shipPositions, shipLengths } = action.payload

      const ships = shipLengthsToSolidityBytesHex(shipLengths)
      const board = shipPositionsToSolidityBytesHex(shipPositions)

      console.log(`Calculating board hash for ${board}...`)

      const boardHash = await libraryContract.calculateBoardHash.call(ships, boardLength, board)

      console.log(`...${boardHash}`)

      console.log('Deploying new contract...')

      const Game = await getGameContract(web3, account)

      const newContract = await Game.new(ships, boardLength, maxRounds, boardHash)

      console.log(`...deployed at: ${newContract.address}`)

      console.log(`Setting up cloud data...`)

      await cloudDb.addGame(newContract.address, {
        network,
        player1: await newContract.player1.call(),
        player1Moves: [],
        player2: null,
        player2Moves: [],
        status: GAME_STATUS.NEED_OPPONENT
      }, authKey, /* player1's private data */ {
        shipPositions,
        moves: []
      })

      console.log(`...done`)

      return store.actions.navGame(newContract.address)
    }
    default: {
      return next(action)
    }
  }
}
