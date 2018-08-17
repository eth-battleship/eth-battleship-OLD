import React, { PureComponent } from 'react'

import { isSameAddress } from '../../utils/contract'
import { connectStore } from '../../redux'

import styles from './index.styl'

@connectStore('config')
export default class Address extends PureComponent {
  render () {
    const { getDefaultAccount } = this.props.selectors
    const { address } = this.props

    const isMe = isSameAddress(getDefaultAccount(), address)

    return (
      <span>
        {address}
        {isMe ? <span className={styles.you}>(You)</span> : null}
      </span>
    )
  }
}
