const Game = artifacts.require("./Game.sol");

contract('Game', function(accounts) {
  const owner = accounts[0];

  it("sets owner", async () => {
    const game = await Game.deployed();
    assert.equal(await game.owner(), owner);
  });
});
