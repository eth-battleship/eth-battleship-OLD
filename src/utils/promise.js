export const promisify = fn => (...args) => new Promise((reject, resolve) => {
  fn(...args, (err, result) => {
    if (err) {
      reject(err)
    } else {
      resolve(result)
    }
  })
})
