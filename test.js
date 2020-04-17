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
      .parse('::: my-div\nThis is a paragraph.\\$\n:::'),
    u('root', [
      u(
        'fencedDiv',
        {
          data: {
            hName: 'div',
            hProperties: {className: 'my-div'},
            hChildren: [u('text', 'This is a paragraph.\\$')]
          }
        },
        'This is a paragraph.\\$'
      )
    ]),
    'should support a super factorial in fencedDiv block'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(fencedDiv)
      .parse('tango\n::: my-div\nThis is a paragraph.\n:::'),
    u('root', [
      u('paragraph', [u('text', 'tango')]),
      u(
        'fencedDiv',
        {
          data: {
            hName: 'div',
            hProperties: {className: 'my-div'},
            hChildren: [u('text', 'This is a paragraph.')]
          }
        },
        'This is a paragraph.'
      )
    ]),
    'should support a fencedDiv block right after a paragraph'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(fencedDiv)
      .parse('::: my-div\nThis is a paragraph.\n:::'),
    u('root', [
      u(
        'fencedDiv',
        {
          data: {
            hName: 'div',
            hProperties: {className: 'my-div'},
            hChildren: [u('text', 'This is a paragraph.')]
          }
        },
        'This is a paragraph.'
      )
    ]),
    'should support fencedDiv block with triple colons'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(fencedDiv)
      .parse('  :::\n    This is a paragraph.\n  :::'),
    u('root', [
      u('paragraph', {
        children: [u('text', '  :::\n    This is a paragraph.\n  :::')]
      })
    ]),
    'should not support indented fencedDiv block'
  )
  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(fencedDiv)
      .parse('  :::\n    This is a paragraph.\n:::'),
    u('root', [
      u('paragraph', {
        children: [u('text', '  :::\n    This is a paragraph.\n:::')]
      })
    ]),
    'should not support indented opening fencedDiv block'
  )
  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(fencedDiv)
      .parse(':::\n    This is a paragraph.\n   :::'),
    u('root', [
      u('paragraph', {
        children: [u('text', ':::\n    This is a paragraph.\n   :::')]
      })
    ]),
    'should not support indented closing fencedDiv block'
  )
  t.deepEqual(
    String(toHtml.processSync(':::just three colons')),
    '<p>:::just three colons</p>',
    'should not support an opening fence without newline'
  )
  t.deepEqual(
    String(toHtml.processSync(':::  must\nThis is a paragraph.\n:::')),
    '<div class="must">This is a paragraph.</div>',
    'should allow extra spaces before class names'
  )
  t.deepEqual(
    String(toHtml.processSync(':::  my-div\nThis is a paragraph.\n:::')),
    '<div class="my-div">This is a paragraph.</div>',
    'should include values after the opening fence (except for spacing #2)'
  )
  t.deepEqual(
    String(
      toHtml.processSync(':::::::::::::::::: my-div\nThis is a paragraph.\n:::')
    ),
    '<div class="my-div">This is a paragraph.</div>',
    'should include values after the opening fence except for fence delimiter'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        ':::::::::::::::::: my-div::::\nThis is a paragraph.\n:::'
      )
    ),
    '<div class="my-div">This is a paragraph.</div>',
    'should allow fence delimiter at the end of the opening fence without space'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        ':::::::::::::::::: my-div  ::::\nThis is a paragraph.\n:::'
      )
    ),
    '<div class="my-div">This is a paragraph.</div>',
    'should allow fence delimiter at the end of the opening fence with spaces'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        ':::::::::::::::::: my-div    \nThis is a paragraph.\n:::'
      )
    ),
    '<div class="my-div">This is a paragraph.</div>',
    'should allow fence delimiter or space at the end of the opening fence'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        ':::::::::::::::::: my-div    :::::   \nThis is a paragraph.\n:::'
      )
    ),
    '<div class="my-div">This is a paragraph.</div>',
    'should allow fence delimiter or space at the end of the opening fence'
  )
  t.deepEqual(
    String(toHtml.processSync(':::     :::\nThis is a paragraph.\n:::')),
    '<p>:::     :::\nThis is a paragraph.\n:::</p>',
    'should not allow empty attribute in the opening fence'
  )
  t.deepEqual(
    String(toHtml.processSync('::: my-div\nThis is a paragraph.\nmust  :::')),
    '<div class="my-div">This is a paragraph.\nmust</div>',
    'should include values before the closing fence (except for spacing #1)'
  )
  t.deepEqual(
    String(toHtml.processSync('::: my-div\nThis is a paragraph.:::  ')),
    '<div class="my-div">This is a paragraph.</div>',
    'should exclude spacing after the closing fence'
  )
  t.deepEqual(
    String(toHtml.processSync('::: my-div\nThis is a paragraph.:::::::')),
    '<div class="my-div">This is a paragraph.</div>',
    'should allow more than three delimiters for closing fence'
  )
  t.deepEqual(
    String(toHtml.processSync('::: my-div\nThis is a paragraph.:::::::      ')),
    '<div class="my-div">This is a paragraph.</div>',
    'should allow more than three delimiters and spaces for closing fence'
  )
  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(fencedDiv)
      .parse('::: my-div\nThis is a paragraph.\n:::\n```\nbravo\n```\n'),
    u('root', [
      u(
        'fencedDiv',
        {
          data: {
            hName: 'div',
            hProperties: {className: 'my-div'},
            hChildren: [u('text', 'This is a paragraph.')]
          }
        },
        'This is a paragraph.'
      ),
      u('code', {lang: null, meta: null}, 'bravo')
    ]),
    'should not affect the next block'
  )
  t.deepEqual(
    String(toHtml.processSync('   :::\n   1+1 = 2\n   :::')),
    '<p>   :::\n1+1 = 2\n:::</p>',
    'Should not allow initial spacing'
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
    String(toHtml.processSync('    :::\n    1+1 = 2\n    :::')),
    '<pre><code>:::\n1+1 = 2\n:::\n</code></pre>',
    'markdown-it-katex#10: …but 4 means a code block'
  )
  t.deepEqual(
    String(toHtml.processSync('::: my-div\n1+1 = 2')),
    '<div class="my-div">1+1 = 2</div>',
    'fencedDiv block self-closes at the end of document'
  )
  t.end()
})
