import configMiddleware from './config/middleware'
import gameMiddleware from './game/middleware'

export const createMiddleware = app => [
  // first let's ensure the final `dispatch` function is async
  () => next => async action => {
    try {
      return await next(action)
    } catch (err) {
      console.warn(action.type, err)

      throw err
    }
  },
  // now we can add our actual middlware
  configMiddleware(app),
  gameMiddleware(app),
]
