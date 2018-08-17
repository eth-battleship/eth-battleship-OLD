import { toBN } from 'web3-utils'

import { getGameContract, isSameAddress } from '../../utils/contract'
import {
  solidityBytesHexToShipLengths,
  solidityBytesHexToShipPositions
} from '../../utils/game'
import { GAME_STATUS, PLAYER_STATUS } from '../../utils/constants'
import { decrypt } from '../../utils/crypto'

const sanitizeNumber = n => toBN(n).toNumber()

const deriveGameStatus = statusValue => {
  switch (statusValue) {
    case 0:
      return GAME_STATUS.NEED_OPPONENT
    case 1:
      return GAME_STATUS.PLAYING
    case 2:
      return GAME_STATUS.REVEAL_MOVES
    case 3:
      return GAME_STATUS.REVEAL_BOARD
    default:
      return GAME_STATUS.OVER
  }
}

const derivePlayerStatus = statusValue => {
  switch (statusValue) {
    case 0:
      return PLAYER_STATUS.READY
    case 1:
      return PLAYER_STATUS.PLAYING
    case 2:
      return PLAYER_STATUS.REVEALED_MOVES
    default:
      return PLAYER_STATUS.REVEAL_BOARD
  }
}

const processGame = async (Game, id, game, authKey, account, fetchAllDataFromContract = false) => {
  const contract = await Game.at(id)

  game.status = deriveGameStatus(sanitizeNumber(await contract.state.call()))

  if (fetchAllDataFromContract) {
    game.player1 = await contract.player1.call()
    game.player2 = await contract.player2.call()
    game.boardLength = sanitizeNumber(await contract.boardSize.call())
    game.maxRounds = sanitizeNumber(await contract.maxRounds.call())
    game.shipLengths = solidityBytesHexToShipLengths(await contract.ships.call())

    game.player1Data.status = derivePlayerStatus((await contract.players.call(game.player1))[4])
    if (game.player2Data) {
      game.player2Data.status = derivePlayerStatus((await contract.players.call(game.player2))[4])
    }

    if (isSameAddress(game.player1, account)) {
      game.player1Data.board.plaintext = solidityBytesHexToShipPositions(
        await decrypt(authKey, game.player1Data.board)
      )
    }

    if (isSameAddress(game.player2, account)) {
      game.player2Data.board.plaintext = solidityBytesHexToShipPositions(
        await decrypt(authKey, game.player2Data.board)
      )
    }
  }
}

export const processGames = async (
  web3, games, authKey, account, fetchAllDataFromContract = false
) => {
  const Game = await getGameContract(web3, account)

  await Promise.all(Object.keys(games).map(id => (
    processGame(Game, id, games[id], authKey, account, fetchAllDataFromContract)
  )))

  return games
}
