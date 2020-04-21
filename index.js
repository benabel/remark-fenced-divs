'use strict'
/**
 * Fenced div parser
 * @module index.js
 *
 * Implement parsing strtegy proposed by commonmark spec
 * https://spec.commonmark.org/0.29/#appendix-a-parsing-strategy
 *
 * > Each line that is processed has an effect on this tree. The line is analyzed and, depending on its contents, the document may be altered in one or more of the following ways:
 * >
 * > 1. One or more open blocks may be closed.
 * > 2. One or more new blocks may be created as children of the last open block.
 * > 3. Text may be added to the last (deepest) open block remaining on the tree.
 * >
 * > Once a line has been incorporated into the tree in this way, it can be discarded, so input can be read in a stream.
 */

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

// https://regex101.com/r/eMLK3W/2
const openingFenceRegexp = /^:{3,}\s*([^\s:]+)\s*:*\s*(\n|$)/
// https://regex101.com/r/k4yhzU/1
const closingFenceRegexp = /^:{3,}\s*(\n|$)/

// TODO is this required when eat() is called?
let lineNb = 0 // Number of lines of the last open root div encountered to pass

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

/**
 * Returns an iterable over lines of string
 */
function* splitLines(str) {
  let currentLine = ''
  for (const char of str + lineFeed) {
    if (char !== lineFeed) {
      currentLine += char
    } else {
      yield currentLine
      currentLine = ''
    }
  }
}

function attachParser(parser) {
  const proto = parser.prototype
  const blockMethods = proto.blockMethods

  proto.blockTokenizers.fencedDiv = fencedDivTokenizer

  blockMethods.splice(blockMethods.indexOf('fencedCode') + 1, 0, 'fencedDiv')

  function fencedDivTokenizer(eat, value, silent) {
    const length = value.length
    let depth = 0
    let lastParsed = 0
    let content = []
    let attribute
    let node
    let blocks = []
    // to get indexes to eat TODO is this necessary?
    let index = 0

    // keep track of lines passed
    lineNb++
    // Pass if this is not an opening fence
    // or if this as already been parsed
    if (!value.match(openingFenceRegexp) && lineNb > lastParsed) {
      return
    }
    // Will be incremented in the for of loop
    lineNb--

    // Now we parse the content until we close this root div
    for (let line of splitLines(value)) {
      index += line.length + 1
      lineNb++
      if (line.match(openingFenceRegexp)) {
        depth++
        attribute = line.match(openingFenceRegexp)[1]
        // Add current content to parent
        if (content.length > 0) {
          content = content.join(lineFeed)
          blocks[blocks.length - 1].value += content
          // Tokenize content of the div
          blocks[blocks.length - 1].children = blocks[
            blocks.length - 1
          ].children.concat(this.tokenizeBlock(content, eat.now()))
          content = []
        }

        // TODO Process attributes to get classes, ids and data-attributes
        node = {
          type: 'fencedDiv',
          value: '',
          data: {
            hName: 'div',
            hProperties: {
              className: attribute
            }
          },
          children: []
        }

        blocks.push(node)

        continue
      }
      if (line.match(closingFenceRegexp)) {
        depth--
        node = blocks.pop()
        content = content.join(lineFeed)
        node.value += content
        // Tokenize content of the div
        node.children = node.children.concat(
          this.tokenizeBlock(content, eat.now())
        )

        if (depth === 0) {
          lastParsed = lineNb
          if (silent) return true

          return eat(value.slice(0, index))(node)
        }

        blocks[blocks.length - 1].children.push(node)

        content = []

        continue
      }
      content.push(line)
    }
  }
}

function attachCompiler(compiler) {
  const proto = compiler.prototype

  proto.visitors.fencedDiv = compileFencedDiv

  /**
   * Convert an mdast node to markdown
   *
   * @param {*} node
   * @returns String
   */
  function compileFencedDiv(node) {
    const className = node.data.hProperties.className
    return `\n\n${delimiterSign}${delimiterSign}${delimiterSign}${space}${className}\n${node.value}\n${delimiterSign}${delimiterSign}${delimiterSign}\n\n`
  }
}
