import cloudDb from '../../cloudDb'
import { getGameContract, isSameAddress } from '../../utils/contract'
import {
  solidityBytesHexToShipLengths,
  solidityBytesHexToShipPositions,
  calculateMovesAndHitsFromFinalContractValue,
  updateMoveHits,
  deriveGameStatusFromContractValue,
  deriveIntFromContractValue,
  derivePlayerStatusFromContractValue,
  mergePrivateMovesWithPublicMoves
} from '../../utils/game'
import { GAME_STATUS } from '../../utils/constants'


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
  game.maxRounds = deriveIntFromContractValue(maxRounds)
  game.boardLength = deriveIntFromContractValue(boardLength)
  game.shipLengths = solidityBytesHexToShipLengths(ships)
  game.status = deriveGameStatusFromContractValue(state)

  // all rounds played then game is ready to be revealed
  if (game.status === GAME_STATUS.PLAYING && game.round > game.maxRounds) {
    game.status = GAME_STATUS.REVEAL_MOVES
  }

  if (fetchAllDataFromContract) {
    const isPlayer1 = isSameAddress(game.player1, account)
    const isPlayer2 = isSameAddress(game.player2, account)

    // if game over then contract contains moves and board
    if (game.status === GAME_STATUS.OVER) {
      const [ p1Board, /* boardHash */, p1Moves, p1Hits ] =
        await contract.players.call(game.player1)
      const [ p2Board, /* boardHash */, p2Moves, p2Hits ] =
        await contract.players.call(game.player2)

      game.player1Hits = deriveIntFromContractValue(p1Hits)
      game.player2Hits = deriveIntFromContractValue(p2Hits)

      game.player1Board = solidityBytesHexToShipPositions(p1Board)
      game.player2Board = solidityBytesHexToShipPositions(p2Board)

      game.player1Moves = calculateMovesAndHitsFromFinalContractValue(
        game.boardLength, game.shipLengths, game.player2Board, p1Moves
      )
      game.player2Moves = calculateMovesAndHitsFromFinalContractValue(
        game.boardLength, game.shipLengths, game.player1Board, p2Moves
      )
    }
    // game not yet over
    else {
      // if current player is participating in this game then we can decode board and moves
      // eslint-disable-next-line no-lonely-if
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
