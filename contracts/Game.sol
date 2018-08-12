pragma solidity ^0.4.23;

import "../installed_contracts/zeppelin/contracts/lifecycle/Destructible.sol";

contract Game is Destructible {

    /** Ship sizes */
    bytes public ships;

    /**
     * Max. no of moves each player gets
     */
  uint public maxRounds;
  /**
   * Board is a square, each side of this size.
   *
   * Note: Due to how we record player moves (by marking bits of a uint) the max board size is 16 (= sqrt(256)).
   */
  uint public boardSize;



  enum GameState {
      NeedOpponent,
      WaitingForPlayer,
      Reveal,
      Over
  }

  struct Player {
      address id;
      bytes32 boardHash;
      /*
       Since we're doing a 10x10 grid that's 100 spaces, so a 256-bit integer
       will more than suffice for storing all the moves made if we use each
       bit of the integer to represent a move on the grid.

       We do this instead of using an array as it results in less storage space
       used as well as for faster board comparision later on.
      */
      uint moves;
      bool revealed;
      uint hits;
  }

  Player public player1;
  Player public player2;

  uint public nextToPlay;

  uint public currentRound;

  GameState public state;

  /**
   * Check that the game is still in play and that the
   * current sender is the next person to play in the game
   */
  modifier isNextToPlay () {
    require(state == GameState.WaitingForPlayer);
    require(
      (msg.sender == player1.id && nextToPlay == 1) ||
      (msg.sender == player2.id && nextToPlay == 2)
    );
    _;
  }

  /**
   * Check that the game can be revealed and that the
   * current sender is a player who is yet to call reveal()
   */
  modifier canReveal () {
      require(state == GameState.Reveal);
      require(msg.sender == player1.id || msg.sender == player2.id);
      _;
  }


  /**
   * Check that game can be joined.
   */
  modifier canJoin () {
    require(state == GameState.NeedOpponent);
    _;
  }

  /**
   * Initialize the game.
   * @param ships_ the ship sizes
   * @param boardSize_ the width and height of the board square
   * @param maxRounds_ the number of goes each player gets in total
   * @param playerBoardHash_ Hash of player 1's board
   */
  constructor (bytes ships_, uint boardSize_, uint maxRounds_, bytes32 playerBoardHash_) public {
    require(1 <= ships_.length);
    require(2 <= boardSize_ && 16 >= boardSize_);
    require(1 <= maxRounds_ && (boardSize_ * boardSize_) >= maxRounds_);
    // setup game
    ships = ships_;
    maxRounds = maxRounds_;
    boardSize = boardSize_;
      // setup player1
      player1.id = msg.sender;
      player1.boardHash = playerBoardHash_;
      // we're awaiting confirmation of player2
      state = GameState.NeedOpponent;
  }


  /**
   * Join the game
   * @param boardHash_ Hash of player's board
   */
  function join(bytes32 boardHash_)
    public
    canJoin()
  {
      // allow player 1 to change their board whilst player 2 has not yet joined
      if (player1.id == msg.sender) {
        player1.boardHash = boardHash_;
      } else {
        // ensure this player is allowed to join
        require(player2.id == address(0) || player2.id == msg.sender);

        // update player2 details
        player2.id = msg.sender;
        player2.boardHash = boardHash_;

        // game is now ready to start!
        currentRound = 1;
        nextToPlay = 1;
        state = GameState.WaitingForPlayer;
      }
  }


  /**
   * Play a move
   */
  function play(uint x_, uint y_)
    public
    isNextToPlay()
  {
     // check that co-ordinates are valid
     require(boardSize > x_ && boardSize > y_);

     uint move = calculateMove(x_, y_);

    // player 1 is moving!
    if (nextToPlay == 1) {
        player1.moves |= move;
        nextToPlay = 2;
    }
    // player 2 is moving!
    else {
        player2.moves |= move;

        // got more rounds left?
        if (maxRounds > currentRound) {
            nextToPlay = 1;
            currentRound += 1;
        }
        // else it's time to see who has won
        else {
            state = GameState.Reveal;
        }
    }
  }

  /**
   * Check other player's hits.
   *
   * The `board` array is an array of triplets, whereby each triplet represents
   * a ship, specifying (x,y,isVertical).
   *
   * @param board_ This player's board
   */
  function check(bytes board_)
    public
    canReveal()
    {
        // work out which player we're dealing with
        if (player1.id == msg.sender) {
            calculateHits(board_, player1, player2);
        }
        else {
            calculateHits(board_, player2, player1);
        }
    }


  /**
   * Calculate no. of hits for a player.
   *
   * Helper function to `reveal()`.
   *
   * This can be called while there are still rounds left to play, if a player
   * thnks they've already sunk all the opponent's ships.
   *
   * @param  board_  The board to reveal
   * @param  revealer_ The player whose board it is
   * @param  mover_ The opponent player whose hits to calculate
   */
  function calculateHits(bytes board_, Player storage revealer_, Player storage mover_) internal {
        // board hash must match
        require(revealer_.boardHash == calculateBoardHash(board_));

        // now let's count the hits for the mover_ and check board validity in one go
        mover_.hits = 0;

        for (uint ship = 0; ships.length > ship; ship += 1) {
            // extract ship info
            uint index = 3 * ship;
            uint x = uint(board_[index]);
            uint y = uint(board_[index + 1]);
            bool isVertical = (0 < uint(board_[index + 2]));
            uint shipSize = uint(ships[ship]);

            // check validity of ship position
            require(0 <= x && boardSize > x);
            require(0 <= y && boardSize > y);
            require(boardSize >= ((isVertical ? x : y) + shipSize));

            uint hits = 0;
            uint steps = shipSize;

            // now let's see if there are hits
            while (0 < steps) {
                // did mover_ hit this position?
                if (0 != (calculateMove(x, y) & mover_.moves)) {
                    hits += 1;
                }
                // move to next part of ship
                if (isVertical) {
                    x += 1;
                } else {
                    y += 1;
                }
                // decrement counter
                steps -= 1;
            }

            // add to mover hits
            mover_.hits = hits;
        }

        // update state
        revealer_.revealed = true;

        // if both players have revealed then game is now over
        if (mover_.revealed) {
          state = GameState.Over;
        }
  }


   /**
    * Fallback should revert().
    */
    function() public {
        revert();
    }



  /*
  ------------------------------------------------------------
  Helper functions
  ------------------------------------------------------------
  */

  /**
   * Calculate the bitwise position of given XY coordinate.
   * @param x X coordinate
   * @param y Y coordinate
   * @return position in array
   */
  function calculateMove(uint x, uint y) internal view returns (uint) {
      return 2 ** (x * boardSize + y);
  }

  /**
   * Calculate board hash.
   *
   * @param board Array representing the board
   * @return the SHA3 hash
   */
  function calculateBoardHash(bytes board) public pure returns (bytes32) {
      return keccak256(board);
  }

}
