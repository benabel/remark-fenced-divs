'use strict'

module.exports = createName

// To do: use `dist/`
var asciiAlphanumeric = require('micromark/dist/character/ascii-alphanumeric')

function createName(effects, ok, nok, nameType) {
  return start

  function start(code) {
    effects.enter(nameType)
    effects.consume(code)
    return name
  }

  function name(code) {
    if (code === 45 /* `-` */ || asciiAlphanumeric(code)) {
      effects.consume(code)
      return name
    }

    effects.exit(nameType)
    return ok(code)
  }
}
