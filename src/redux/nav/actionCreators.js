import { push } from 'connected-react-router'

export const navHome = () => push('/')
export const navNewGame = () => push('/new')
export const navGame = address => push(`/${address}`)
