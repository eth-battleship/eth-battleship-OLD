import Contract from 'truffle-contract'

export const getContract = (web3, contractJson) => {
  const c = Contract(contractJson)

  c.setProvider(web3.currentProvider)

  return c
}
