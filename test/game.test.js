const Game = artifacts.require("./Game.sol")

const _sanitizeBN = arg => (arg && arg.toNumber) ? arg.toNumber() : arg
const _sanitizeOutput = arg => Array.isArray(arg) ? arg.map(_sanitizeBN) : _sanitizeBN(arg)
const _assertCall = (fn, expected) => (typeof fn === 'function' ? fn.call() : fn).then(val => {
  assert.deepEqual(_sanitizeOutput(val), expected)
})

const boardSize = 2
const shipSizes = '0x02'

/*
0 0
1 1
*/
const player1Board = '0x010000' // [1, 0, 0]
const player1BoardHash = '0xec58f3d8eaf702e8aa85662b02bda7f3c8e5a845b4d68b8245529ad6396c2431'

/*
0 1
0 1
*/
const player2Board = '0x000101' // [0, 1, 1]
const player2BoardHash = '0x7474de3473dbd611f09cfcd49dd8cfe9fae3a8d0cc2acf4bdf1e2f17d3a4484d'


const validBoards = {
  '0x000101': '0x7474de3473dbd611f09cfcd49dd8cfe9fae3a8d0cc2acf4bdf1e2f17d3a4484d',
  '0x000001': '0x95dbad4637b631c083a4bbeef4e3d609c32941d9997a3aec4a123aaa0671f41b',
  '0x000000': '0x99ff0d9125e1fc9531a11262e15aeb2c60509a078c4cc4c64cefdfb06ff68647',
  '0x010000': '0xec58f3d8eaf702e8aa85662b02bda7f3c8e5a845b4d68b8245529ad6396c2431',
}

const invalidBoards = {
  '0x000100': '0xe45e5a4917582ce5e520ebcff2b11411fbe99dadce43f67aae20fdd57e5675df',
  '0x010001': '0x197cd09c75fbb6e42d6d40c065815ca1790ef56af23f88e0689403ee1924961d',
  '0x010101': '0x197cd09c75fbb6e42d6d40c065815ca1790ef56af23f88e0689403ee1924961d',
  '0x010100': '0x197cd09c75fbb6e42d6d40c065815ca1790ef56af23f88e0689403ee1924961d',
}

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
    await _assertCall(game.players.call(accounts[0]), [
      '0x',
      player1BoardHash,
      0,
      0,
      1
    ])
  })
})

contract('helper functions', () => {
  describe('.countBits()', () => {
    it('works as expected', async () => {
      const game = await Game.deployed()

      await _assertCall(game.countBits.call(0), 0)
      await _assertCall(game.countBits.call(1), 1)
      await _assertCall(game.countBits.call(2), 1)
      await _assertCall(game.countBits.call(3), 2)
      await _assertCall(game.countBits.call(1984798234), 17) // 1110110010011011001111000011010
    })
  })

  describe('.calculateMove', () => {
    it('works as expected', async () => {
      const game = await Game.deployed()

      await _assertCall(game.calculateMove.call(2, 0, 0), 1)
      await _assertCall(game.calculateMove.call(2, 1, 1), 8)
      await _assertCall(game.calculateMove.call(2, 0, 1), 2)
      await _assertCall(game.calculateMove.call(2, 1, 0), 4)
    })
  })

  describe('.calculateBoardHash()', () => {
    it('works for valid boards', async () => {
      const game = await Game.deployed()

      const err = []

      for (let board in validBoards) {
        try {
          await game.calculateBoardHash(shipSizes, boardSize, board)
        } catch (e) {
          err.push(e)
        }
      }

      assert.equal(err.length, 0)
    })

    it('fails for invalid boards', async () => {
      const game = await Game.deployed()

      const err = []

      for (let board in invalidBoards) {
        try {
          await game.calculateBoardHash(shipSizes, boardSize, board)
        } catch (e) {
          err.push(e)
        }
      }

      assert.equal(err.length, Object.keys(invalidBoards).length)
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
    await _assertCall(game.currentRound, 1)
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
      await game.revealMoves(7) // 111
    } catch (e) {
      err.push(e)
    }

    try {
      await game.revealMoves(23) // 10111
    } catch (e) {
      err.push(e)
    }

    assert.equal(err.length, 2)

    try {
      await game.revealMoves(6) // 110
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

  it('updates player state', async () => {
    await game.revealMoves(4) // 100

    await _assertCall(game.state, 1)
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

    await _assertCall(game.state, 2)
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

    it('still requires a valid board', async () => {
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

      await _assertCall(game.state, 2)
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

      await _assertCall(game.state, 3);
    })
  })
})
