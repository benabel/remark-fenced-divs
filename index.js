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
const minFenceCount = 3

const quoteRegex = /('|")/g

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

/**
 * Catch if string starts with a valid opening fence
 *
 * if it is return the attribute(s) trimmed
 *
 * TODO what happens if attribute is '0' or 'false'
 *
 * if not return empty string
 *
 * @param {String} value
 * @returns String
 */
function getOpeningFenceAttribute(value) {
  let index = 0
  let length = value.length
  let openingFenceSize
  let attributeBegin
  let attributeEnd

  // Don't allow initial spacing.
  if (value.charAt(index) === space) {
    return false
  }

  // Skip the fence.
  while (index < length && value.charAt(index) === delimiterSign) {
    index++
  }

  openingFenceSize = index

  // Exit if there is not enough of a fence.
  if (openingFenceSize < minFenceCount) {
    return false
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
    return false
  }
  attributeBegin = index
  // Capture attributes
  attributeEnd = value.indexOf(lineFeed, attributeBegin)
  attributeEnd =
    value.indexOf(lineFeed) === -1 ? length : attributeEnd + attributeBegin
  while (
    attributeEnd > attributeBegin &&
    value.charAt(attributeEnd - 1) === space
  ) {
    attributeEnd--
  }
  while (
    attributeEnd > attributeBegin &&
    value.charAt(attributeEnd - 1) === delimiterSign
  ) {
    attributeEnd--
  }
  while (
    attributeEnd > attributeBegin &&
    value.charAt(attributeEnd - 1) === space
  ) {
    attributeEnd--
  }
  if (attributeEnd > attributeBegin) {
    return value.slice(attributeBegin, attributeEnd)
  }
  return false
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
    let attributes
    let node
    let classList = []
    let blocks = []
    let id
    let meta
    let dataset = {}
    // to get indexes to eat TODO is this necessary?
    let index = 0

    // keep track of lines passed
    lineNb++
    // Pass if this is not an opening fence
    // or if this as already been parsed
    if (!getOpeningFenceAttribute(value) && lineNb > lastParsed) {
      return
    }
    // Will be incremented in the for of loop
    lineNb--

    // Now we parse the content until we close this root div
    // TODO don't need to parse first line
    for (let line of splitLines(value)) {
      index += line.length + 1
      lineNb++
      attributes = getOpeningFenceAttribute(line)

      if (Boolean(attributes)) {
        depth++
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

        // Process attributes
        // Get classes, ids and data-attributes
        if (attributes.startsWith('{')) {
          meta = attributes.slice(1, attributes.length - 1)
          // helper to treat key-vals at the end as others
          meta = meta + space

          let i = 0
          let iEnd = meta.length
          dataset = {}

          while (i < meta.length - 1) {
            const char = meta.charAt(i)
            switch (char) {
              // skip space
              case space:
                i++
                continue
              // eat classes
              case '.':
                i++
                iEnd = meta.indexOf(space, i)
                classList.push(meta.slice(i, iEnd))
                i = iEnd + 1
                continue
              // eat id(just take last as pandoc)
              case '#':
                i++
                iEnd = meta.indexOf(space, i)
                id = meta.slice(i, iEnd)
                i = iEnd + 1
                continue
              // This should be a key-val pair
              default:
                let keyVal = []
                iEnd = meta.indexOf('=', i)
                keyVal.push(meta.slice(i, iEnd))
                i = iEnd + 1
                const quote = meta.charAt(i)
                if (quote === "'" || quote === '"') {
                  i++
                  iEnd = meta.indexOf(quote, i)
                  keyVal[1] = meta.slice(i, iEnd)
                } else {
                  iEnd = meta.indexOf(space, i)
                  keyVal.push(meta.slice(i, iEnd))
                }
                dataset[keyVal[0]] = keyVal[1]
                i = iEnd + 1
                continue
            }
            i++
          }
        } else {
          classList = [attributes]
          meta = attributes
        }

        node = {
          type: 'fencedDiv',
          meta: meta.trim(),
          value: '',
          data: {
            hName: 'div',
            hProperties: {}
          },
          children: []
        }
        if (id) {
          node.data.hProperties.id = id
          id = null
        }

        if (classList.length > 0) {
          node.data.hProperties.className = classList
          classList = null
        }
        if (Object.keys(dataset).length > 0) {
          for (let [key, value] of Object.entries(dataset)) {
            // unquote string
            // in fact data attributes should follow the production rule of XML names
            // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*
            value = value.replace(quoteRegex, '')
            node.data.hProperties[`data-${key}`] = value
          }
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
