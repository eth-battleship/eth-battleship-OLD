import { createAction } from 'redux-actions'

import { SETUP_WEB3, AUTHENTICATE } from './actions'

export const setupWeb3 = createAction(SETUP_WEB3)

export const authenticate = createAction(AUTHENTICATE)
