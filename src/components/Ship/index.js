import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { getColor } from '../../utils/game'

import styles from './index.styl'


export default class Ship extends PureComponent {
  static propTypes = {
    size: PropTypes.number,
    length: PropTypes.number.isRequired,
    isVertical: PropTypes.bool,
    onPress: PropTypes.func,
    style: PropTypes.object
  }

  static defaultProps = {
    size: 0.5
  }

  render () {
    const { length, isVertical, style } = this.props

    return (
      <div
        className={styles.ship}
        style={{
          backgroundColor: getColor(length),
          width: isVertical ? this._size(1) : this._size(length),
          height: isVertical ? this._size(length) : this._size(1),
          ...style
        }}
        onClick={this._onPress}
      />
    )
  }

  _onPress = () => {
    const { isVertical, onPress } = this.props

    if (onPress) {
      onPress(isVertical)
    }
  }

  _size = n => {
    const { size } = this.props

    return `${size * n}rem`
  }
}
