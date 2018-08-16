const db = window.firebase.firestore()

db.settings({ timestampsInSnapshots: true })

module.exports = {
  addGame: async (id, doc) => db.collection('games').doc(id).set(doc)
}
