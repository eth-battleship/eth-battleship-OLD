import * as game from './game/actionCreators'
import * as nav from './nav/actionCreators'
import * as config from './config/actionCreators'

export default {
  ...game,
  ...nav,
  ...config
}
