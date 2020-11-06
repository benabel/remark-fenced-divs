var decode = require('parse-entities/decode-entity')

exports.enter = {
  directiveContainer: enterContainer,
  directiveContainerAttributes: enterAttributes
}
exports.exit = {
  directiveContainer: exit,
  directiveContainerAttributeClassValue: exitAttributeClassValue,
  directiveContainerAttributeIdValue: exitAttributeIdValue,
  directiveContainerAttributeName: exitAttributeName,
  directiveContainerAttributeValue: exitAttributeValue,
  directiveContainerAttributes: exitAttributes,
  directiveContainerName: exitName
}

function enterContainer(token) {
  enter.call(this, 'containerDirective', token)
}

function enter(type, token) {
  this.enter(
    {
      type: type,
      attributes: {},
      data: {hName: 'div', hProperties: {}},
      children: []
    },
    token
  )
  this.setData('directiveAttributes', [])
}

function exitName(token) {
  var name = this.sliceSerialize(token)
  this.setData('directiveAttributes', [['class', decodeLight(name)]])
  this.stack[this.stack.length - 1].data.hProperties.className = [
    decodeLight(name)
  ]
}

function enterAttributes() {
  this.buffer() // Capture EOLs
}

function exitAttributeIdValue(token) {
  this.getData('directiveAttributes').push([
    'id',
    decodeLight(this.sliceSerialize(token))
  ])
}

function exitAttributeClassValue(token) {
  this.getData('directiveAttributes').push([
    'class',
    decodeLight(this.sliceSerialize(token))
  ])
}

function exitAttributeValue(token) {
  var attributes = this.getData('directiveAttributes')
  attributes[attributes.length - 1][1] = decodeLight(this.sliceSerialize(token))
}

function exitAttributeName(token) {
  // Attribute names in CommonMark are significantly limited, so character
  // references can’t exist.
  this.getData('directiveAttributes').push([this.sliceSerialize(token), ''])
}

function exitAttributes() {
  var attributes = this.getData('directiveAttributes')
  var cleaned = {}
  var index = -1
  var attribute

  while (++index < attributes.length) {
    attribute = attributes[index]

    if (attribute[0] === 'class' && cleaned.class) {
      cleaned.class += ' ' + attribute[1]
    } else {
      cleaned[attribute[0]] = attribute[1]
    }
  }

  this.setData('directiveAttributes')
  this.resume() // Drop EOLs
  this.stack[this.stack.length - 1].attributes = cleaned

  // set hProperties
  this.stack[
    this.stack.length - 1
  ].data.hProperties.className = cleaned.class.split(' ')
  this.stack[this.stack.length - 1].data.hProperties.id = cleaned.id
}

function exit(token) {
  this.exit(token)
}

function decodeLight(value) {
  return value.replace(
    /&(#(\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi,
    decodeIfPossible
  )
}

function decodeIfPossible($0, $1) {
  return decode($1) || $0
}
