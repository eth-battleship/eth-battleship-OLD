pragma solidity ^0.4.23;

contract Game {

    /** Ship sizes, see https://www.hasbro.com/common/instruct/Battleship.PDF */
    uint[1] public ships = [1];//[5,4,3,3,2];

    /**
     * Max. no of moves each player gets
     */
  uint public constant maxRounds = 1;//30;
  /**
   * Board is a square, each side of this size.
   *
   * Note: Due to how we record player moves (by marking bits of a uint) the max board size is 16 (= sqrt(256)).
   */
  uint public constant boardSize = 2;//10;

  enum GameState {
      NeedOpponent,
      WaitingForPlayer1,
      WaitingForPlayer2,
      RevealWinner,
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

  Player player1;
  Player player2;

  uint currentRound;

  GameState private state;

  /**
   * Check that the game is still in play and that the
   * current sender is the next person to play in the game
   */
  modifier isNextToPlay () {
      require(
          (msg.sender == player1.id && state == GameState.WaitingForPlayer1) ||
          (msg.sender == player2.id && state == GameState.WaitingForPlayer2));
      _;
  }

  /**
   * Check that the game can be revealed and that the
   * current sender is a player who is yet to call reveal()
   */
  modifier canReveal () {
      require(
          state == GameState.RevealWinner && (
            (msg.sender == player1.id && !player1.revealed) ||
            (msg.sender == player2.id && !player2.revealed)
            )
        );
      _;
  }

  /**
   * Initialize the game.
   * @param boardHash_ Hash of player 1's board
   */
  constructor (bytes32 boardHash_) public {
      // setup player1
      player1.id = msg.sender;
      player1.boardHash = boardHash_;
      // we're awaiting confirmation of player2
      state = GameState.NeedOpponent;
  }



  /**
   * Join the game (as player 2)
   * @param boardHash_ Hash of player 2's board
   */
  function join(bytes32 boardHash_) public {
      // ensure game can be joined
      require(state == GameState.NeedOpponent);
      // ensure either anyone can join or this specific player can join
      require(player2.id == address(0) || player2.id == msg.sender);
      // update player2 details
      player2.id = msg.sender;
      player2.boardHash = boardHash_;
      // ready for player1 to make their first move
      currentRound = 1;
      state = GameState.WaitingForPlayer1;
  }


  /**
   * Play a move
   */
  function playMove(uint x, uint y)
    public
    isNextToPlay()
  {
     // check that co-ordinates are valid
     require(boardSize > x && boardSize > y);

    // player 1 is moving!
    if (state == GameState.WaitingForPlayer1) {
        player1.moves |= calculateMove(x, y);
        state = GameState.WaitingForPlayer2;
    }
    // player 2 is moving!
    else {
        player2.moves |= calculateMove(x, y);

        // got more rounds left?
        if (maxRounds > currentRound) {
            state = GameState.WaitingForPlayer1;
            currentRound += 1;
        }
        // else it's time to see who has won
        else {
            state = GameState.RevealWinner;
        }
    }
  }

  /**
   * Reveal the winner
   *
   * The `board` array is an array of triplets, whereby each triplet represents
   * a ship, specifying (x,y,isVertical).
   *
   * @param board This player's board
   */
  function reveal(bytes board)
    public
    canReveal()
    {
        // check that board length is valid
        require(board.length == ships.length * 3);

        // work out which player we're dealing with
        Player memory revealer;
        Player memory mover;

        if (player1.id == msg.sender) {
            revealer = player1;
            mover = player2;
        }
        else {
            revealer = player2;
            mover = player1;
        }

        // board hash must match
        require(revealer.boardHash == calculateBoardHash(board));

        // now let's count the hits for the mover and check board validity in one go
        mover.hits = 0;

        for (uint ship = 0; ships.length > ship; ship += 1) {
            // extract ship info
            uint index = 3 * ship;
            uint x = uint(board[index]);
            uint y = uint(board[index + 1]);
            bool isVertical = (0 < uint(board[index + 2]));
            uint shipSize = ships[ship];

            // check validity of ship position
            require(0 <= x && boardSize > x);
            require(0 <= y && boardSize > y);
            require(boardSize >= ((isVertical ? x : y) + shipSize));

            // now let's see if there are hits
            while (0 < shipSize) {
                // did mover hit this position?
                if (0 != (calculateMove(x, y) & mover.moves)) {
                    mover.hits += 1;
                }
                // move to next part of ship
                if (isVertical) {
                    x += 1;
                } else {
                    y += 1;
                }
                // decrement counter
                shipSize -= 1;
            }
        }

        // update revealer state
        revealer.revealed = true;

        // if both players have revealed then game is now over
        if (mover.revealed) {
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
  function calculateMove(uint x, uint y) internal pure returns (uint) {
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
