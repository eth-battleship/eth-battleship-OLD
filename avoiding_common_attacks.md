# Avoiding common attacks

## "Front-running"

It's important to prevent players from seeing each others' boards (ship
  positions) until the winner has already been calculated. This is
accomplished by using the commit-reveal technique.

When a game is started, both players send hashes of their boards to the contract.
In the final stage, both players first send their moves to the contract. Only
after this do they send their boards to the contract, by which point they can
no longer change the moves they played, thus meaning they can not cheat.

## Common security holes and bugs

The contract makes extensive use of modifiers and keeps track of current game
state (for both game and each player) to ensure that players are only able
to call the various contract functions when they ought to be able to, and not
otherwise.
