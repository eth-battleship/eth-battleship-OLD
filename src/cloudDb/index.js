const db = window.firebase.firestore()

db.settings({ timestampsInSnapshots: true })

const _buildGamesQuery = network => (
  db.collection('games')
    .where('network', '==', network)
    .orderBy('created', 'desc')
    .limit(100)
)

module.exports = {
  addGame: async (id, doc) => db.collection('games').doc(id).set({
    ...doc,
    created: Date.now()
  }),
  updateGame: async (id, props) => db.collection('games').doc(id).set(props, { merge: true }),
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
