'use strict'

module.exports = fencedDivs

function fencedDivs(options) {
  var settings = options || {}
  fencedPlugin.call(this, settings)
}

// Utils

function isRemarkParser(parser) {
  return Boolean(parser && parser.prototype && parser.prototype.blockTokenizers)
}

function isRemarkCompiler(compiler) {
  return Boolean(compiler && compiler.prototype && compiler.prototype.visitors)
}

const space = ' '
const lineFeed = '\n'
const delimiterSign = ':'

const minFenceCount = 3

function fencedPlugin() {
  const parser = this.Parser
  const compiler = this.Compiler

  if (isRemarkParser(parser)) {
    attachParser(parser)
  }

  if (isRemarkCompiler(compiler)) {
    attachCompiler(compiler)
  }
}

function attachParser(parser) {
  const proto = parser.prototype
  const blockMethods = proto.blockMethods

  proto.blockTokenizers.fencedDiv = fencedDivTokenizer

  blockMethods.splice(blockMethods.indexOf('fencedCode') + 1, 0, 'fencedDiv')

  function fencedDivTokenizer(eat, value, silent) {
    const length = value.length
    let index = 0
    let content
    let lineEnd
    let lineIndex
    let openingFenceSize
    let openingFenceContentStart
    let isClosingFence
    let closingFenceSize
    let lineContentStart
    let lineContentEnd
    let attributes = ''
    // Don't allow initial spacing.
    if (value.charAt(index) === space) {
      return
    }

    // Skip the fence.
    while (index < length && value.charAt(index) === delimiterSign) {
      index++
    }

    openingFenceSize = index

    // Exit if there is not enough of a fence.
    if (openingFenceSize < minFenceCount) {
      return
    }
    // Skip spacing before the attributes.
    while (index < length && value.charAt(index) === space) {
      index++
    }
    // Don't allow empty attribute
    if (
      value.charAt(index) === lineFeed ||
      value.charAt(index) === delimiterSign
    ) {
      return
    }
    // Capture attributes
    while (
      index < length &&
      !(
        value.charAt(index) === space ||
        value.charAt(index) === delimiterSign ||
        value.charAt(index) === lineFeed
      )
    ) {
      attributes += value.charAt(index)
      index++
    }
    // Skip spacing and delimiters after the attributes.
    while (index < length && value.charAt(index) === space) {
      index++
    }
    while (index < length && value.charAt(index) === delimiterSign) {
      index++
    }
    while (index < length && value.charAt(index) === space) {
      index++
    }
    if (value.charAt(index) !== lineFeed) {
      return
    }

    openingFenceContentStart = index

    // Eat everything after the fence.
    while (index < length) {
      if (value.charAt(index) === lineFeed) {
        break
      }
      index++
    }

    if (silent) {
      return true
    }

    content = []

    if (openingFenceContentStart !== index) {
      content.push(value.slice(openingFenceContentStart, index))
    }

    index++
    lineEnd = value.indexOf(lineFeed, index + 1)
    lineEnd = lineEnd === -1 ? length : lineEnd

    while (index < length) {
      isClosingFence = false
      lineContentStart = index
      lineContentEnd = lineEnd
      lineIndex = lineEnd
      closingFenceSize = 0

      // First, let’s see if this is a valid closing fence.
      // Skip trailing white space
      while (
        lineIndex > lineContentStart &&
        value.charAt(lineIndex - 1) === space
      ) {
        lineIndex--
      }

      // Skip the fence.
      while (
        lineIndex > lineContentStart &&
        value.charAt(lineIndex - 1) === delimiterSign
      ) {
        closingFenceSize++
        lineIndex--
      }

      // Check if this is a valid closing fence line.
      if (
        closingFenceSize >= minFenceCount &&
        value.indexOf(delimiterSign, lineContentStart) === lineIndex &&
        value.charAt(lineIndex - 1) === lineFeed
      ) {
        isClosingFence = true
        lineContentEnd = lineIndex
      }

      // If this is a closing fence, skip final spacing.
      if (isClosingFence) {
        while (
          lineContentEnd > lineContentStart &&
          value.charAt(lineContentEnd - 1) === space
        ) {
          lineContentEnd--
        }
      }

      content.push(value.slice(lineContentStart, lineContentEnd))

      if (isClosingFence) {
        content = content.join('\n')

        // TODO Process attributes to get classes, ids and data-attributes

        let node = {
          type: 'fencedDiv',
          value: content,
          data: {
            hName: 'div',
            hProperties: {
              className: attributes
            }
          }
        }

        // Tokenize content of the div
        node.children = this.tokenizeBlock(content, eat.now())

        return eat(value.slice(0, lineEnd))(node)
      }

      index = lineEnd + 1
      lineEnd = value.indexOf(lineFeed, index + 1)
      lineEnd = lineEnd === -1 ? length : lineEnd
    }
  }
}

function attachCompiler(compiler) {
  const proto = compiler.prototype

  proto.visitors.fencedDiv = compileFencedDiv

  function compileFencedDiv(node) {
    return `${delimiterSign}${delimiterSign}\n${node.value}\n${delimiterSign}${delimiterSign}`
  }
}
