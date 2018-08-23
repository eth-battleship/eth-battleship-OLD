import { sha3 } from 'web3-utils'

const db = window.firebase.firestore()

db.settings({ timestampsInSnapshots: true })

const _buildGamesQuery = network => (
  db.collection('games')
    .where('network', '==', network)
    .orderBy('created', 'desc')
    .limit(10)
)

const _buildPlayerDataId = (gameId, playerAuthKey) => sha3(`${gameId}${playerAuthKey}`)

module.exports = {
  addGame: async (id, gameData, playerAuthKey, playerData) => (
    Promise.all([
      db.collection('games').doc(id).set({
        ...gameData,
        created: Date.now(),
        updated: []
      }),
      db.collection('playerData').doc(_buildPlayerDataId(id, playerAuthKey)).set(playerData)
    ])
  ),
  updateGame: async (id, gameData, playerAuthKey, playerData) => {
    const { updated } = (await db.collection('games').doc(id).get()).data()

    return Promise.all([
      db.collection('games').doc(id).set({
        ...gameData,
        // updating an array seems to trigger the firestore real time updates better
        updated: updated.concat(Date.now())
      }, { merge: true }),
      (playerAuthKey && playerData)
        ? db.collection('playerData').doc(_buildPlayerDataId(id, playerAuthKey)).set(playerData, { merge: true })
        : Promise.resolve()
    ])
  },
  getPlayerData: async (gameId, playerAuthKey) => (
    (await db.collection('playerData').doc(_buildPlayerDataId(gameId, playerAuthKey)).get()).data()
  ),
  watchGame: async (id, cb) => db.collection('games').doc(id).onSnapshot(snapshot => {
    cb(snapshot.data())
  }),
  loadGames: async network => {
    try {
      const snapshots = await _buildGamesQuery(network).get()

      const ret = {}

      snapshots.forEach(doc => {
        ret[doc.id] = doc.data()
      })

      return ret
    } catch (err) {
      console.error('Error loading active games', err)

      return {}
    }
  },
  loadMyGames: async (network, address) => {
    try {
      let snapshots = []

      Promise.all([
        _buildGamesQuery(network)
          .where('player1', '==', address)
          .get(),
        _buildGamesQuery(network)
          .where('player2', '==', address)
          .get(),
      ])
        .then(([ p1, p2 ]) => {
          snapshots = snapshots.concat(p1, p2)
        })

      const ret = {}

      snapshots.forEach(doc => {
        ret[doc.id] = doc.data()
      })

      return ret
    } catch (err) {
      console.error('Error loading my active games', err)

      return {}
    }
  }
}
