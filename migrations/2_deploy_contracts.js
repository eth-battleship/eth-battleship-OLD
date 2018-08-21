const Game = artifacts.require("./Game.sol")
const GameLibrary = artifacts.require("./GameLibrary.sol")


module.exports = function(deployer) {
  /*
    - Ship sizes from: https://www.hasbro.com/common/instruct/Battleship.PDF
    - board size: 10x10
    - max rounds: 30
   */
  deployer.deploy(GameLibrary)
  deployer.link(GameLibrary, Game)
  deployer.deploy(Game, "0x0504030302",10,30,"0xec58f3d8eaf702e8aa85662b02bda7f3c8e5a845b4d68b8245529ad6396c2431")
}
