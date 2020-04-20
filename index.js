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
    let content
    let attribute
    let node
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
      console.log(line)
      if (line.match(openingFenceRegexp)) {
        depth++
        attribute = value.match(openingFenceRegexp)[1]
        console.log('Found opening fence: ' + attribute)
        content = []

        continue
      }
      if (line.match(closingFenceRegexp)) {
        depth--
        console.log('Found closing fence: ' + line)

        if (depth === 0) {
          lastParsed = lineNb
          if (silent) return true

          content = content.join('\n')

          // TODO Process attributes to get classes, ids and data-attributes

          node = {
            type: 'fencedDiv',
            value: content,
            data: {
              hName: 'div',
              hProperties: {
                className: attribute
              }
            }
          }

          // Tokenize content of the div
          node.children = this.tokenizeBlock(content, eat.now())

          return eat(value.slice(0, index))(node)
        }
      }
      content.push(line)
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
