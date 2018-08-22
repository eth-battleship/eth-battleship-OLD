const { toHex } = require('web3-utils')

const { _assertCall } = require('./includes/utils')
const {
  boardSize,
  shipSizes,
  player1Board,
  player2Board,
  player1BoardHash,
  player2BoardHash,
  invalidBoards,
} = require('./includes/fixtures')

const Game = artifacts.require("./Game.sol")


contract('setup contract', accounts => {
  it('fails if less than one ship specified', async () => {
    let e

    try {
      await Game.new("0x0",10,30,player1BoardHash)
    } catch (err) {
      e = err
    }

    assert.isDefined(e)
  })

  it('fails if board size is less than 2', async () => {
    let e

    try {
      await Game.new("0x0504030302",1,30,player1BoardHash)
    } catch (err) {
      e = err
    }

    assert.isDefined(e)
  })

  it('fails if board size is greater than 16', async () => {
    let e

    try {
      await Game.new("0x0504030302",17,30,player1BoardHash)
    } catch (err) {
      e = err
    }

    assert.isDefined(e)
  })

  it('fails if max rounds < 1', async () => {
    let e

    try {
      await Game.new("0x0504030302",4,0,player1BoardHash)
    } catch (err) {
      e = err
    }

    assert.isDefined(e)
  })

  it('fails if max rounds > board size squared', async () => {
    let e

    try {
      await Game.new("0x0504030302",4,17,player1BoardHash)
    } catch (err) {
      e = err
    }

    assert.isDefined(e)
  })

  it('sets up contract member variables', async () => {
    const game = await Game.new(shipSizes, 4, 10, player1BoardHash)

    await _assertCall(game.ships, shipSizes)
    await _assertCall(game.maxRounds, 10)
    await _assertCall(game.boardSize, 4)
    await _assertCall(game.state, 0)
    await _assertCall(game.player1, accounts[0])
    await _assertCall(game.players.call(accounts[0]), [
      '0x',
      player1BoardHash,
      0,
      0,
      1
    ])
  })
})

contract('helper functions', accounts => {
  describe('.getMetadata', () => {
    let game

    beforeEach(async () => {
      game = await Game.new(shipSizes, 2, 3, player1BoardHash)
      await game.join(player2BoardHash, { from: accounts[1] })
    })

    it('returns metdata', async () => {
      await _assertCall(game.getMetadata, [
        shipSizes,
        2,
        3,
        1,
        accounts[0],
        accounts[1]
      ])
    })
  })
})

contract('ready to join game', accounts => {
  let game

  beforeEach(async () => {
    game = await Game.new(shipSizes, boardSize, 1, player1BoardHash)
  })

  it('player 1 cannot join', async () => {
    let err

    try {
      await game.join(player1BoardHash)
    } catch (e) {
      err = e
    }

    assert.isDefined(err)
  })

  it('player 2 can join', async () => {
    await game.join(player2BoardHash, { from: accounts[1] })

    await _assertCall(game.state, 1)
    await _assertCall(game.player2, accounts[1])
    await _assertCall(game.players.call(accounts[1]), [
      '0x',
      player2BoardHash,
      0,
      0,
      1
    ])
  })

  it('player 3 cannot join after player 2', async () => {
    await game.join(player2BoardHash, { from: accounts[1] })

    let err

    try {
      await game.join(player2BoardHash, { from: accounts[2] })
    } catch (e) {
      err = e
    }

    assert.isDefined(err)
  })
})

contract('reveal moves', accounts => {
  let game

  beforeEach(async () => {
    game = await Game.new(shipSizes, 2, 2, player1BoardHash)
    await game.join(player2BoardHash, { from: accounts[1] })
  })

  it('cannot have more moves than max rounds', async () => {
    const err = []

    try {
      await game.revealMoves(toHex(7)) // 111
    } catch (e) {
      err.push(e)
    }

    try {
      await game.revealMoves(toHex(23)) // 10111
    } catch (e) {
      err.push(e)
    }

    assert.equal(err.length, 2)

    try {
      await game.revealMoves(toHex(6)) // 110
    } catch (e) {
      err.push(e)
    }

    assert.equal(err.length, 2)
  })

  it('cannot be called by non-player', async () => {
    let err

    try {
      await game.revealMoves(4, { from: accounts[2] })
    } catch (e) {
      err = e
    }

    assert.isDefined(err)
  })

  it('updates state', async () => {
    await game.revealMoves(toHex(4)) // 100

    await _assertCall(game.state, 2)
    await _assertCall(game.players.call(accounts[0]), [
      '0x',
      player1BoardHash,
      4,
      0,
      2
    ])
  })

  it('can only be called once by player', async () => {
    await game.revealMoves(4) // 100

    let err

    try {
      await game.revealMoves(1) // 1
    } catch (e) {
      err = e
    }

    assert.isDefined(err)
  })

  it('updates game state once both players have revealed', async () => {
    await game.revealMoves(4, { from: accounts[1] }) // 100
    await game.revealMoves(6) // 110

    await _assertCall(game.state, 3)
  })
})

contract('reveal board', accounts => {
  let game

  beforeEach(async () => {
    game = await Game.new(shipSizes, 2, 2, player1BoardHash)
    await game.join(player2BoardHash, { from: accounts[1] })
  })

  it('cannot reveal whilst play in progress', async () => {
    let err

    try {
      await game.revealBoard(player1Board)
    } catch (e) {
      err = e
    }

    assert.isDefined(err)
  })

  describe('once moves are revealed', () => {
    beforeEach(async () => {
      await game.revealMoves(3, { from: accounts[0] }) // 011
      await game.revealMoves(3, { from: accounts[1] }) // 011
    })

    it('cannot reveal an invalid board', async () => {
      const board = Object.values(invalidBoards)[0]

      game = await Game.new(shipSizes, 2, 2, board)
      await game.join(player2BoardHash, { from: accounts[1] })
      await game.revealMoves(3, { from: accounts[0] }) // 011
      await game.revealMoves(3, { from: accounts[1] }) // 011\

      let err

      try {
        await game.revealBoard(board)
      } catch (e) {
        err = e
      }

      assert.isDefined(err)
    })

    it('requires a matching board', async () => {
      let err

      try {
        await game.revealBoard(player2Board)
      } catch (e) {
        err = e
      }

      assert.isDefined(err)
    })

    it('updates state', async () => {
      await game.revealBoard(player1Board)

      await _assertCall(game.players.call(accounts[0]), [
        player1Board,
        player1BoardHash,
        3,
        0,
        3
      ])

      await _assertCall(game.state, 3)
    })

    it('calculates opponent hits', async () => {
      await game.revealBoard(player1Board)

      await _assertCall(game.players.call(accounts[1]), [
        '0x',
        player2BoardHash,
        3,
        0,
        2
      ])

      await game.revealBoard(player2Board, { from: accounts[1] })

      await _assertCall(game.players.call(accounts[0]), [
        player1Board,
        player1BoardHash,
        3,
        1,
        3
      ])
    })

    it('cannot reveal more than once', async () => {
      await game.revealBoard(player1Board)

      let err;

      try {
        await game.revealBoard(player1Board)
      } catch (e) {
        err = e;
      }

      assert.isDefined(err)
    })

    it('updates game state once both players have revealed', async () => {
      await game.revealBoard(player1Board)
      await game.revealBoard(player2Board, { from: accounts[1] })

      await _assertCall(game.state, 4);
    })
  })
})
