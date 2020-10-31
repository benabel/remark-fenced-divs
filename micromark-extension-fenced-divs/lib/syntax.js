'use strict'

module.exports = directive

var directiveContainer = require('./tokenize-directive-container')

function directive() {
  return {
    flow: {58: directiveContainer}
  }
}
