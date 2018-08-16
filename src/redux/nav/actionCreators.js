import { push } from 'connected-react-router'

export const navNewGame = () => push('/new')
export const navGame = address => push(`/${address}`)
