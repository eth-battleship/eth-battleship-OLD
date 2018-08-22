const { _assertCall } = require('./includes/utils')
const {
  boardSize,
  shipSizes,
  validBoards,
  invalidBoards
} = require('./includes/fixtures')

const GameLibrary = artifacts.require("./GameLibrary.sol")

contract('lib library', () => {
  describe('.countBits()', () => {
    it('works as expected', async () => {
      const lib = await GameLibrary.deployed()

      await _assertCall(lib.countBits.call(0), 0)
      await _assertCall(lib.countBits.call(1), 1)
      await _assertCall(lib.countBits.call(2), 1)
      await _assertCall(lib.countBits.call(3), 2)
      await _assertCall(lib.countBits.call(1984798234), 17) // 1110110010011011001111000011010
    })
  })

  describe('.calculateMove', () => {
    it('works as expected', async () => {
      const lib = await GameLibrary.deployed()

      await _assertCall(lib.calculateMove.call(2, 0, 0), 1)
      await _assertCall(lib.calculateMove.call(2, 1, 1), 8)
      await _assertCall(lib.calculateMove.call(2, 0, 1), 2)
      await _assertCall(lib.calculateMove.call(2, 1, 0), 4)
    })
  })

  describe('.calculateBoardHash()', () => {
    it('works when ships are within boundaries', async () => {
      const lib = await GameLibrary.deployed()

      const err = []

      for (let board in validBoards) {
        try {
          await lib.calculateBoardHash(shipSizes, boardSize, board)
        } catch (e) {
          err.push(e)
        }
      }

      assert.equal(err.length, 0)
    })

    it('works when ships are at edges', async () => {
      const lib = await GameLibrary.deployed()

      const err = []

      try {
        await lib.calculateBoardHash('0x0504030302', 10, '0x000000060001000901070901090700')
      } catch (e) {
        err.push(e)
      }

      assert.equal(err.length, 0)
    })

    it('fails when ships exceed boundaries', async () => {
      const lib = await GameLibrary.deployed()

      for (let board in invalidBoards) {
        assert.equal(await lib.calculateBoardHash(shipSizes, boardSize, board), '0x0')
      }
    })

    it('fails when ships overlap', async () => {
      const lib = await GameLibrary.deployed()

      assert.equal(await lib.calculateBoardHash('0x0504030303', 10, '0x000000060001000901070901090700'), '0x0')
    })
  })
})
