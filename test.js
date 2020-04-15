const test = require('tape')
const unified = require('unified')
const parse = require('remark-parse')
const remark2rehype = require('remark-rehype')
const rehypeStringify = require('rehype-stringify')
const stringify = require('remark-stringify')
const u = require('unist-builder')
const fencedDiv = require('.')

test('remark-math', function (t) {
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
    'should support a super factorial in block math'
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
    'should support a math block right after a paragraph'
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
    'should support block math with triple dollars'
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
    'should support indented block math'
  )

  t.deepEqual(
    unified()
      .use(parse, {position: false})
      .use(stringify)
      .use(fencedDiv)
      .processSync('> :::\n> \\alpha\\beta\n> :::\n')
      .toString(),
    '> ::\n> \\alpha\\beta\n> ::\n',
    'should stringify math in a blockquote'
  )

  t.deepEqual(
    String(toHtml.processSync(':::just two dollars')),
    '<p>:::just two dollars</p>',
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
    String(toHtml.processSync('foo $1+1\n\n= 2$ bar')),
    '<p>foo $1+1</p>\n<p>= 2$ bar</p>',
    'markdown-it-katex#07: paragraph break in inline math is not allowed'
  )

  t.deepEqual(
    String(toHtml.processSync('   :::\n   1+1 = 2\n   :::')),
    '<div class="math math-display">1+1 = 2</div>',
    'markdown-it-katex#09: block math can be indented up to 3 spaces'
  )
  t.deepEqual(
    String(toHtml.processSync('    :::\n    1+1 = 2\n    :::')),
    '<pre><code>:::\n1+1 = 2\n:::\n</code></pre>',
    'markdown-it-katex#10: …but 4 means a code block'
  )
  t.deepEqual(
    String(toHtml.processSync(':::\n\n  1\n+ 1\n\n= 2\n\n:::')),
    '<div class="math math-display">\n  1\n+ 1\n\n= 2\n\n</div>',
    'markdown-it-katex#12: multiline display math'
  )

  t.deepEqual(
    String(toHtml.processSync(':::\n1+1 = 2')),
    '<div class="math math-display">1+1 = 2</div>',
    'markdown-it-katex#14: display math self-closes at the end of document'
  )

  // To do: this is broken.
  t.deepEqual(
    String(toHtml.processSync(':::[\n[1, 2]\n[3, 4]\n]:::')),
    '<div class="math math-display">[\n[1, 2]\n[3, 4]\n]</div>',
    'markdown-it-katex#17: …or on multiple lines with expression starting and ending on delimited lines'
  )
  t.deepEqual(
    String(
      toHtml.processSync('Thus, $20,000 and USD$30,000 won’t parse as math.')
    ),
    '<p>Thus, $20,000 and USD$30,000 won’t parse as math.</p>',
    'markdown-it-katex#19: numbers can not follow closing inline math'
  )
  t.deepEqual(
    String(toHtml.processSync('It is 2$ for a can of soda, not 1$.')),
    '<p>It is 2$ for a can of soda, not 1$.</p>',
    'markdown-it-katex#20: require non whitespace to right of opening inline math'
  )

  t.end()
})
