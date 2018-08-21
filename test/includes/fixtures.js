exports.boardSize = 2
exports.shipSizes = '0x02'

/*
0 0
1 1
*/
exports.player1Board = '0x010000' // [1, 0, 0]
exports.player1BoardHash = '0xec58f3d8eaf702e8aa85662b02bda7f3c8e5a845b4d68b8245529ad6396c2431'

/*
0 1
0 1
*/
exports.player2Board = '0x000101' // [0, 1, 1]
exports.player2BoardHash = '0x7474de3473dbd611f09cfcd49dd8cfe9fae3a8d0cc2acf4bdf1e2f17d3a4484d'


exports.validBoards = {
  '0x000101': '0x7474de3473dbd611f09cfcd49dd8cfe9fae3a8d0cc2acf4bdf1e2f17d3a4484d',
  '0x000001': '0x95dbad4637b631c083a4bbeef4e3d609c32941d9997a3aec4a123aaa0671f41b',
  '0x000000': '0x99ff0d9125e1fc9531a11262e15aeb2c60509a078c4cc4c64cefdfb06ff68647',
  '0x010000': '0xec58f3d8eaf702e8aa85662b02bda7f3c8e5a845b4d68b8245529ad6396c2431',
}

exports.invalidBoards = {
  '0x000100': '0xe45e5a4917582ce5e520ebcff2b11411fbe99dadce43f67aae20fdd57e5675df',
  '0x010001': '0x197cd09c75fbb6e42d6d40c065815ca1790ef56af23f88e0689403ee1924961d',
  '0x010101': '0x197cd09c75fbb6e42d6d40c065815ca1790ef56af23f88e0689403ee1924961d',
  '0x010100': '0x197cd09c75fbb6e42d6d40c065815ca1790ef56af23f88e0689403ee1924961d',
}
