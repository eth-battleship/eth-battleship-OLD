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

export const encrypt = async (password, data) => {
  const crypto = _getCrypto()

  const inputBuf = _str2buf(JSON.stringify(data))
  const pwBuf = _str2buf(password)
  const pwHash = await crypto.subtle.digest('SHA-256', pwBuf)

  const alg = {
    name: 'AES-GCM',
    iv: crypto.getRandomValues(new Uint8Array(12))
  }

  const key = await crypto.subtle.importKey(
    'raw',
    pwHash,
    alg,
    false,
    [ 'encrypt' ]
  )

  return _buf2str(await crypto.subtle.encrypt(alg, key, inputBuf))
}

export const decrypt = async (password, data) => {
  const crypto = _getCrypto()

  const inputBuf = _str2buf(data)
  const pwBuf = _str2buf(password)
  const pwHash = await crypto.subtle.digest('SHA-256', pwBuf)

  const alg = {
    name: 'AES-GCM',
    iv: crypto.getRandomValues(new Uint8Array(12))
  }

  const key = await crypto.subtle.importKey(
    'raw',
    pwHash,
    alg,
    false,
    [ 'encrypt' ]
  )

  return JSON.parse(_buf2str(await crypto.subtle.decrypt(alg, key, inputBuf)))
}
