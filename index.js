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

const space = 32 // ' '
const lineFeedChar = '\n'
const lineFeed = lineFeedChar.charCodeAt() // 10  '\n'
const delimiterSignChar = ':'
const delimiterSign = delimiterSignChar.charCodeAt() // 58  ':'

const minFenceCount = 3

const classList = ['math', 'math-display']

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
  const interruptParagraph = proto.interruptParagraph
  const interruptList = proto.interruptList
  const interruptBlockquote = proto.interruptBlockquote

  proto.blockTokenizers.fencedDiv = fencedDivTokenizer

  blockMethods.splice(blockMethods.indexOf('fencedCode') + 1, 0, 'fencedDiv')

  // Inject fencedDiv to interrupt rules
  interruptParagraph.splice(interruptParagraph.indexOf('fencedCode') + 1, 0, [
    'fencedDiv'
  ])
  interruptList.splice(interruptList.indexOf('fencedCode') + 1, 0, [
    'fencedDiv'
  ])
  interruptBlockquote.splice(interruptBlockquote.indexOf('fencedCode') + 1, 0, [
    'fencedDiv'
  ])

  function fencedDivTokenizer(eat, value, silent) {
    const length = value.length
    let index = 0
    let code
    let content
    let lineEnd
    let lineIndex
    let openingFenceIndentSize
    let openingFenceSize
    let openingFenceContentStart
    let isClosingFence
    let closingFenceSize
    let lineContentStart
    let lineContentEnd

    // Skip initial spacing.
    while (index < length && value.charCodeAt(index) === space) {
      index++
    }

    openingFenceIndentSize = index

    // Skip the fence.
    while (index < length && value.charCodeAt(index) === delimiterSign) {
      index++
    }

    openingFenceSize = index - openingFenceIndentSize

    // Exit if there is not enough of a fence.
    if (openingFenceSize < minFenceCount) {
      return
    }
    // Skip extra delimiters after the fence.
    while (index < length && value.charCodeAt(index) === delimiterSign) {
      index++
    }
    // Skip spacing after the fence.
    while (index < length && value.charCodeAt(index) === space) {
      index++
    }

    openingFenceContentStart = index

    // Eat everything after the fence.
    while (index < length) {
      code = value.charCodeAt(index)

      // We don’t allow colon signs here after the fence
      // TODO in fact it is allowed in pandoc spec
      if (code === delimiterSign) {
        return
      }

      if (code === lineFeed) {
        break
      }

      index++
    }

    if (value.charCodeAt(index) !== lineFeed) {
      return
    }

    if (silent) {
      return true
    }

    content = []

    if (openingFenceContentStart !== index) {
      content.push(value.slice(openingFenceContentStart, index))
    }

    index++
    lineEnd = value.indexOf(lineFeedChar, index + 1)
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
        value.charCodeAt(lineIndex - 1) === space
      ) {
        lineIndex--
      }

      // Skip the fence.
      while (
        lineIndex > lineContentStart &&
        value.charCodeAt(lineIndex - 1) === delimiterSign
      ) {
        closingFenceSize++
        lineIndex--
      }

      // Check if this is a valid closing fence line.
      if (
        closingFenceSize >= minFenceCount &&
        value.indexOf(delimiterSignChar, lineContentStart) === lineIndex
      ) {
        isClosingFence = true
        lineContentEnd = lineIndex
      }

      // Sweet, next, we need to trim the line.
      // Skip initial spacing.
      while (
        lineContentStart <= lineContentEnd &&
        lineContentStart - index < openingFenceIndentSize &&
        value.charCodeAt(lineContentStart) === space
      ) {
        lineContentStart++
      }

      // If this is a closing fence, skip final spacing.
      if (isClosingFence) {
        while (
          lineContentEnd > lineContentStart &&
          value.charCodeAt(lineContentEnd - 1) === space
        ) {
          lineContentEnd--
        }
      }

      // If this is a content line, or if there is content before the fence:
      if (!isClosingFence || lineContentStart !== lineContentEnd) {
        content.push(value.slice(lineContentStart, lineContentEnd))
      }

      if (isClosingFence) {
        break
      }

      index = lineEnd + 1
      lineEnd = value.indexOf(lineFeedChar, index + 1)
      lineEnd = lineEnd === -1 ? length : lineEnd
    }

    content = content.join('\n')

    return eat(value.slice(0, lineEnd))({
      type: 'fencedDiv',
      value: content,
      data: {
        hName: 'div',
        hProperties: {
          className: classList.concat()
        },
        hChildren: [
          {
            type: 'text',
            value: content
          }
        ]
      }
    })
  }
}

function attachCompiler(compiler) {
  const proto = compiler.prototype

  proto.visitors.fencedDiv = compileFencedDiv

  function compileFencedDiv(node) {
    return `${delimiterSignChar}${delimiterSignChar}\n${node.value}\n${delimiterSignChar}${delimiterSignChar}`
  }
}
