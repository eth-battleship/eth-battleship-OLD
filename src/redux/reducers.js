import game from './game/reducer'

const reducers = { game }

export const createReducers = app =>
  Object.keys(reducers).reduce(
    (m, key) => ({
      ...m,
      [key]: reducers[key](app)
    }),
    {}
  )
