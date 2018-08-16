import ab2hex from 'array-buffer-to-hex'
import hex2ab from 'hex-to-array-buffer'

const CRYPTO_ALGORITHM = 'AES-GCM'

const _buf2str = buf => String.fromCharCode.apply(null, new Uint16Array(buf))

const _str2buf = str => {
  const bufView = new Uint16Array(new ArrayBuffer(str.length * 2))

  for (let i = 0; str.length > i; i += 1) {
    bufView[i] = str.charCodeAt(i)
  }

  return bufView
}

const _getCrypto = () => {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Browser does not have crypto API support')
  }

  return window.crypto
}

const _pw2hash = password => _getCrypto().subtle.digest('SHA-256', _str2buf(password))

export const encrypt = async (password, data) => {
  const crypto = _getCrypto()

  const inputBuf = _str2buf(JSON.stringify(data))
  const pwHash = await _pw2hash(password)

  const alg = {
    name: CRYPTO_ALGORITHM,
    iv: crypto.getRandomValues(new Uint8Array(12))
  }

  const key = await crypto.subtle.importKey(
    'raw',
    pwHash,
    alg,
    false,
    [ 'encrypt' ]
  )

  const cipherBuf = await crypto.subtle.encrypt(alg, key, inputBuf)

  return {
    iv: ab2hex(alg.iv),
    ciphertext: ab2hex(cipherBuf)
  }
}

export const decrypt = async (password, { iv, ciphertext }) => {
  const crypto = _getCrypto()

  const inputBuf = hex2ab(ciphertext)
  const pwHash = await _pw2hash(password)

  const alg = {
    name: CRYPTO_ALGORITHM,
    iv: hex2ab(iv)
  }

  const key = await crypto.subtle.importKey(
    'raw',
    pwHash,
    alg,
    false,
    [ 'decrypt' ]
  )

  return JSON.parse(_buf2str(await crypto.subtle.decrypt(alg, key, inputBuf)))
}
