import Web3 from 'web3'

const web3Result = new Promise(resolve => {
  // Wait for loading completion to avoid race conditions with web3 injection timing.
  window.addEventListener('load', () => {
    const { web3 } = window

    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (web3 && web3.currentProvider) {
      console.log('Injected web3 detected.')

      // Use Mist/MetaMask's provider.
      resolve(new Web3(web3.currentProvider))
    } else {
      console.log('No web3 instance injected, using Local web3.')

      // Fallback to localhost if no web3 injection. We've configured this to
      // use the development console's port by default.
      const provider = new Web3.providers.HttpProvider('http://127.0.0.1:9545')

      resolve(new Web3(provider))
    }
  })
})

export default async () => {
  const web3 = await web3Result

  // check that can get accounts
  await new Promise((resolve, reject) => {
    web3.eth.getAccounts((err, acc) => {
      if (err) {
        reject(err)
      } else {
        resolve(acc)
      }
    })
  })

  return web3
}
