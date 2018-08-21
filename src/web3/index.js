import Web3 from 'web3'

import { promisify } from '../utils/promise'

const web3Result = new Promise((resolve, reject) => {
  // Wait for loading completion to avoid race conditions with web3 injection timing.
  window.addEventListener('load', () => {
    const { web3 } = window

    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (web3 && web3.currentProvider) {
      console.log('Injected web3 detected.')

      // Use Mist/MetaMask's provider.
      resolve(new Web3(web3.currentProvider))
    } else {
      console.log('No web3 instance injected.')

      reject(new Error('web3 not detected!'))
    }
  })
})

export default async () => {
  const web3 = await web3Result

  const [ accounts, block ] = await Promise.all([
    promisify(web3.eth.getAccounts)(),
    promisify(web3.eth.getBlock)(0)
  ])

  return { accounts, network: block.hash, web3 }
}
