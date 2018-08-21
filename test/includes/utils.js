const _sanitizeBN = arg => (arg && arg.toNumber) ? arg.toNumber() : arg

const _sanitizeOutput = arg => Array.isArray(arg) ? arg.map(_sanitizeBN) : _sanitizeBN(arg)

exports._assertCall = (fn, expected) => (typeof fn === 'function' ? fn.call() : fn).then(val => {
  assert.deepEqual(_sanitizeOutput(val), expected)
})
