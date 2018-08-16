import { GAME_STATUS } from '../utils/constants'

const db = window.firebase.firestore()

db.settings({ timestampsInSnapshots: true })

module.exports = {
  addGame: async (id, doc) => db.collection('games').doc(id).set({
    ...doc,
    created: Date.now()
  }),
  watchGame: async (id, cb) => db.collection('games').doc(id).onSnapshot(snapshot => {
    cb(snapshot.data())
  }),
  loadActiveGames: async network => {
    try {
      const snapshots = await db.collection('games')
        .where('status', '<', GAME_STATUS.OVER)
        .where('network', '==', network.toLowerCase())
        .orderBy('status')
        .orderBy('created', 'desc')
        .limit(50)
        .get()

      const ret = {}

      snapshots.forEach(doc => {
        ret[doc.id] = doc.data()
      })

      return ret
    } catch (err) {
      console.error('Error loading active games', err)

      return {}
    }
  }
}
