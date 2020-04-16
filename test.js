const test = require('tape')
const unified = require('unified')
const parse = require('remark-parse')
const remark2rehype = require('remark-rehype')
const rehypeStringify = require('rehype-stringify')
const stringify = require('remark-stringify')
const u = require('unist-builder')
const fencedDiv = require('.')

test('remark-fenced-divs', function (t) {
  const toHtml = unified()
    .use(parse)
    .use(fencedDiv, {inlineMathDouble: true})
    .use(remark2rehype)
    .use(rehypeStringify)

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(fencedDiv)
      .parse(':::\n\\alpha\\$\n:::'),
    u('root', [
      u(
        'fencedDiv',
        {
          data: {
            hName: 'div',
            hProperties: {className: ['math', 'math-display']},
            hChildren: [u('text', '\\alpha\\$')]
          }
        },
        '\\alpha\\$'
      )
    ]),
    'should support a super factorial in fencedDiv block'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(fencedDiv)
      .parse('tango\n:::\n\\alpha\n:::'),
    u('root', [
      u('paragraph', [u('text', 'tango')]),
      u(
        'fencedDiv',
        {
          data: {
            hName: 'div',
            hProperties: {className: ['math', 'math-display']},
            hChildren: [u('text', '\\alpha')]
          }
        },
        '\\alpha'
      )
    ]),
    'should support a fencedDiv block right after a paragraph'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(fencedDiv)
      .parse(':::\n\\alpha\n:::'),
    u('root', [
      u(
        'fencedDiv',
        {
          data: {
            hName: 'div',
            hProperties: {className: ['math', 'math-display']},
            hChildren: [u('text', '\\alpha')]
          }
        },
        '\\alpha'
      )
    ]),
    'should support fencedDiv block with triple colons'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(fencedDiv)
      .parse('  :::\n    \\alpha\n  :::'),
    u('root', [
      u(
        'fencedDiv',
        {
          data: {
            hName: 'div',
            hProperties: {className: ['math', 'math-display']},
            hChildren: [u('text', '  \\alpha')]
          }
        },
        '  \\alpha'
      )
    ]),
    'should support indented fencedDiv block'
  )
  t.deepEqual(
    String(toHtml.processSync(':::just three colons')),
    '<p>:::just three colons</p>',
    'should not support an opening fence without newline'
  )
  t.deepEqual(
    String(toHtml.processSync(':::  must\n\\alpha\n:::')),
    '<div class="math math-display">must\n\\alpha</div>',
    'should include values after the opening fence (except for spacing #1)'
  )
  t.deepEqual(
    String(toHtml.processSync(':::  \n\\alpha\n:::')),
    '<div class="math math-display">\\alpha</div>',
    'should include values after the opening fence (except for spacing #2)'
  )
  t.deepEqual(
    String(toHtml.processSync('::::::::::::::::::\n\\alpha\n:::')),
    '<div class="math math-display">\\alpha</div>',
    'should include values after the opening fence except for fence delimiter'
  )
  t.deepEqual(
    String(toHtml.processSync('::::::::::::::::::     \n\\alpha\n:::')),
    '<div class="math math-display">\\alpha</div>',
    'should include values after the opening fence except for fence delimiter or space'
  )
  t.deepEqual(
    String(toHtml.processSync(':::     :::\n\\alpha\n:::')),
    '<p>:::     :::\n\\alpha\n:::</p>',
    'should not allow delimiters after spaces on the opening fence'
  )
  t.deepEqual(
    String(toHtml.processSync(':::\n\\alpha\nmust  :::')),
    '<div class="math math-display">\\alpha\nmust</div>',
    'should include values before the closing fence (except for spacing #1)'
  )
  t.deepEqual(
    String(toHtml.processSync(':::\n\\alpha\n  :::')),
    '<div class="math math-display">\\alpha</div>',
    'should include values before the closing fence (except for spacing #2)'
  )
  t.deepEqual(
    String(toHtml.processSync(':::\n\\alpha:::  ')),
    '<div class="math math-display">\\alpha</div>',
    'should exclude spacing after the closing fence'
  )
  t.deepEqual(
    String(toHtml.processSync(':::\n\\alpha:::::::')),
    '<div class="math math-display">\\alpha</div>',
    'should allow more than three delimiters for closing fence'
  )
  t.deepEqual(
    String(toHtml.processSync(':::\n\\alpha:::::::      ')),
    '<div class="math math-display">\\alpha</div>',
    'should allow more than three delimiters and spaces for closing fence'
  )
  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(fencedDiv)
      .parse(':::\n\\alpha\n:::\n```\nbravo\n```\n'),
    u('root', [
      u(
        'fencedDiv',
        {
          data: {
            hName: 'div',
            hProperties: {className: ['math', 'math-display']},
            hChildren: [u('text', '\\alpha')]
          }
        },
        '\\alpha'
      ),
      u('code', {lang: null, meta: null}, 'bravo')
    ]),
    'should not affect the next block'
  )

  t.deepEqual(
    String(toHtml.processSync('aaa :: bbb')),
    '<p>aaa :: bbb</p>',
    'markdown-it-katex#05: shouldn’t render empty content'
  )
  t.deepEqual(
    String(toHtml.processSync('aaa $5.99 bbb')),
    '<p>aaa $5.99 bbb</p>',
    'markdown-it-katex#06: should require a closing delimiter'
  )
  t.deepEqual(
    String(toHtml.processSync('   :::\n   1+1 = 2\n   :::')),
    '<div class="math math-display">1+1 = 2</div>',
    'markdown-it-katex#09: fencedDiv block can be indented up to 3 spaces'
  )
  t.deepEqual(
    String(toHtml.processSync('    :::\n    1+1 = 2\n    :::')),
    '<pre><code>:::\n1+1 = 2\n:::\n</code></pre>',
    'markdown-it-katex#10: …but 4 means a code block'
  )
  t.deepEqual(
    String(toHtml.processSync(':::\n1+1 = 2')),
    '<div class="math math-display">1+1 = 2</div>',
    'fencedDiv block self-closes at the end of document'
  )
  t.end()
})
