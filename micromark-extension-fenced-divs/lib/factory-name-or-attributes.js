'use strict'

module.exports = isNameOrAttribute

var createName = require('./factory-name')
var createAttributes = require('./factory-attributes')
var attributes = {tokenize: tokenizeAttributes}

// To do: use `dist/`
var asciiAlpha = require('micromark/dist/character/ascii-alpha')
var asciiAlphanumeric = require('micromark/dist/character/ascii-alphanumeric')

function isNameOrAttribute(effects, ok, nok, nameType) {
  return start

  function start(code) {
    // switch
    if (asciiAlpha(code)) {
      return createName(
        effects,
        ok,
        nok,
        'directiveContainerName'
      )(code)
    } else if (code === 123 /* `{` */) {
      return effects.attempt(attributes, ok, nok)(code)
    }
    return nok(code)
  }
}

function tokenizeAttributes(effects, ok, nok) {
  // Always a `{`
  return createAttributes(
    effects,
    ok,
    nok,
    'directiveContainerAttributes',
    'directiveContainerAttributesMarker',
    'directiveContainerAttribute',
    'directiveContainerAttributeId',
    'directiveContainerAttributeClass',
    'directiveContainerAttributeName',
    'directiveContainerAttributeInitializerMarker',
    'directiveContainerAttributeValueLiteral',
    'directiveContainerAttributeValue',
    'directiveContainerAttributeValueMarker',
    'directiveContainerAttributeValueData',
    true
  )
}
