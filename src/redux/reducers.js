import game from './game/reducer'
import config from './config/reducer'

const reducers = { game, config }

export const createReducers = app =>
  Object.keys(reducers).reduce(
    (m, key) => ({
      ...m,
      [key]: reducers[key](app)
    }),
    {}
  )
