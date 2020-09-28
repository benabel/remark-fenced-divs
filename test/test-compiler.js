const test = require('tape')
const unified = require('unified')
const parse = require('remark-parse')
const stringify = require('remark-stringify')
const u = require('unist-builder')
const fencedDiv = require('..')

function toMd(string) {
  return unified()
    .use(parse)
    .use(stringify)
    .use(fencedDiv)
    .processSync(string)
    .toString()
}

test('remark-fenced-divs compiler', function (t) {
  t.deepEqual(
    toMd('::: my-div\nThis is a paragraph.\n:::::::      '),
    '\n\n::: my-div\nThis is a paragraph.\n:::\n\n',
    'should support markdown block inside the div'
  )
  t.end()
})
