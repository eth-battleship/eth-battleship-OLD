import { toBN } from 'web3-utils'

import cloudDb from '../../cloudDb'
import { getGameContract, isSameAddress } from '../../utils/contract'
import {
  solidityBytesHexToShipLengths,
  updateMoveHits,
  deriveGameStatusFromContractValue,
  derivePlayerStatusFromContractValue,
  mergePrivateMovesWithPublicMoves
} from '../../utils/game'
import { GAME_STATUS } from '../../utils/constants'


const sanitizeNumber = n => toBN(n).toNumber()



const processGame = async (Game, id, game, authKey, account, fetchAllDataFromContract = false) => {
  const contract = await Game.at(id)

  const [
    ships,
    boardLength,
    maxRounds,
    state,
    player1,
    player2
  ] = await contract.getMetadata.call()

  game.player1 = player1
  game.player2 = player2
  game.maxRounds = sanitizeNumber(maxRounds)
  game.boardLength = sanitizeNumber(boardLength)
  game.shipLengths = solidityBytesHexToShipLengths(ships)
  game.status = deriveGameStatusFromContractValue(sanitizeNumber(state))

  // all rounds played then game is ready to be revealed
  if (game.status === GAME_STATUS.PLAYING && game.round > game.maxRounds) {
    game.status = GAME_STATUS.REVEAL_MOVES
  }

  if (fetchAllDataFromContract) {
    const isPlayer1 = isSameAddress(game.player1, account)
    const isPlayer2 = isSameAddress(game.player2, account)

    if (isPlayer1 || isPlayer2) {
      const { shipPositions, moves } = await cloudDb.getPlayerData(id, authKey)

      if (isPlayer1) {
        game.player1Board = shipPositions
        game.player1Moves = mergePrivateMovesWithPublicMoves(moves, game.player1Moves)
      } else {
        game.player2Board = shipPositions
        game.player2Moves = mergePrivateMovesWithPublicMoves(moves, game.player2Moves)
      }
    }

    game.player1Status = derivePlayerStatusFromContractValue(
      (await contract.players.call(game.player1))[4]
    )

    if (game.player2) {
      game.player2Status = derivePlayerStatusFromContractValue(
        (await contract.players.call(game.player2))[4]
      )
    }

    // calculate player hits
    if (game.player2Board) {
      updateMoveHits(game.player2Board, game.shipLengths, game.player1Moves)
    }

    if (game.player1Board) {
      updateMoveHits(game.player1Board, game.shipLengths, game.player2Moves)
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
