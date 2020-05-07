const test = require('tape')
const unified = require('unified')
const parse = require('remark-parse')
const remark2rehype = require('remark-rehype')
const rehypeStringify = require('rehype-stringify')
const stringify = require('remark-stringify')
const u = require('unist-builder')
const fencedDiv = require('..')

test('remark-fenced-divs', function (t) {
  const toHtml = unified()
    .use(parse)
    .use(fencedDiv)
    .use(remark2rehype)
    .use(rehypeStringify)

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
    String(
      toHtml.processSync(
        '::: my-div\nThis is a paragraph.\n:::\n```\nbravo\n```\n'
      )
    ),
    '<div class="my-div"><p>This is a paragraph.</p></div>\n<pre><code>bravo\n</code></pre>',
    'should not affect the next block'
  )

  t.deepEqual(
    String(toHtml.processSync(':::my-div\nI am just `javascript`\n:::')),
    '<div class="my-div"><p>I am just <code>javascript</code></p></div>',
    'should support inline markdown inside the div'
  )

  t.deepEqual(
    String(
      toHtml.processSync(':::my-div\n```javascript\nvar i = 0;\n```\n:::')
    ),
    '<div class="my-div"><pre><code class="language-javascript">var i = 0;\n</code></pre></div>',
    'should support markdown block inside the div'
  )

  t.deepEqual(
    String(
      toHtml.processSync(
        ':::my-div\nI am just **javascript**\n```javascript\nvar i = 0;\n```\n:::'
      )
    ),
    '<div class="my-div"><p>I am just <strong>javascript</strong></p><pre><code class="language-javascript">var i = 0;\n</code></pre></div>',
    'should support inline and block markdown inside the div'
  )

  t.deepEqual(
    String(toHtml.processSync(':::just three colons')),
    '<p>:::just three colons</p>',
    'should not support an opening fence without newline'
  )
  t.deepEqual(
    String(toHtml.processSync(':::      must\nThis is a paragraph.\n:::')),
    '<div class="must"><p>This is a paragraph.</p></div>',
    'should allow extra spaces before class names'
  )
  t.deepEqual(
    String(toHtml.processSync(':::must         \nThis is a paragraph.\n:::')),
    '<div class="must"><p>This is a paragraph.</p></div>',
    'should allow extra spaces after class names'
  )
  t.deepEqual(
    String(toHtml.processSync(':::  my-div\nThis is a paragraph.\n:::')),
    '<div class="my-div"><p>This is a paragraph.</p></div>',
    'should include values after the opening fence (except for spacing #2)'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        ':::::::::::::::::: my-class\nThis is a paragraph.\n:::'
      )
    ),
    '<div class="my-class"><p>This is a paragraph.</p></div>',
    'should include values after the opening fence except for fence delimiter'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        ':::::::::::::::::: my-div::::\nThis is a paragraph.\n:::'
      )
    ),
    '<div class="my-div"><p>This is a paragraph.</p></div>',
    'should allow fence delimiter at the end of the opening fence without space'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        ':::::::::::::::::: my-div  ::::\nThis is a paragraph.\n:::'
      )
    ),
    '<div class="my-div"><p>This is a paragraph.</p></div>',
    'should allow fence delimiter at the end of the opening fence with spaces'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        ':::::::::::::::::: my-div    \nThis is a paragraph.\n:::'
      )
    ),
    '<div class="my-div"><p>This is a paragraph.</p></div>',
    'should allow fence delimiter or space at the end of the opening fence'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        ':::::::::::::::::: my-div    :::::   \nThis is a paragraph.\n:::'
      )
    ),
    '<div class="my-div"><p>This is a paragraph.</p></div>',
    'should allow fence delimiter or space at the end of the opening fence'
  )
  t.deepEqual(
    String(toHtml.processSync(':::     :::\nThis is a paragraph.\n:::')),
    '<p>:::     :::\nThis is a paragraph.\n:::</p>',
    'should not allow empty attribute in the opening fence'
  )
  t.deepEqual(
    String(toHtml.processSync('   :::\n   1+1 = 2\n   :::')),
    '<p>   :::\n1+1 = 2\n:::</p>',
    'Should not allow initial spacing'
  )
  t.deepEqual(
    String(toHtml.processSync('    :::\n    1+1 = 2\n    :::')),
    '<pre><code>:::\n1+1 = 2\n:::\n</code></pre>',
    'Should not allow initial spacing: 4 means a code block'
  )
  t.deepEqual(
    String(toHtml.processSync('tango\n::: my-div\nThis is a paragraph.\n:::')),
    '<p>tango\n::: my-div\nThis is a paragraph.\n:::</p>',
    'should not support a fencedDiv block right after a paragraph'
  )
  t.deepEqual(
    String(
      toHtml.processSync('tango\n\n::: my-div\nThis is a paragraph.\n:::')
    ),
    '<p>tango</p>\n<div class="my-div"><p>This is a paragraph.</p></div>',
    'the opening fence should be preceeded by an empty line'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        'tango\n        \n::: my-div\nThis is a paragraph.\n:::'
      )
    ),
    '<p>tango</p>\n<div class="my-div"><p>This is a paragraph.</p></div>',
    'the opening fence should be preceeded by a line containing only spaces'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        'tango\n \t  \t         \n::: my-div\nThis is a paragraph.\n:::'
      )
    ),
    '<p>tango</p>\n<div class="my-div"><p>This is a paragraph.</p></div>',
    'the opening fence should be preceeded by a line containing only spaces and tabs'
  )
  t.deepEqual(
    String(toHtml.processSync('::: my-div\nThis is a paragraph.\n\nmust  :::')),
    '<p>::: my-div\nThis is a paragraph.</p>\n<p>must  :::</p>',
    'the closing fence should be at the beginning of the line.'
  )
  t.deepEqual(
    String(toHtml.processSync('::: my-div\n1+1 = 2')),
    '<p>::: my-div\n1+1 = 2</p>',
    'fencedDiv block should be closed'
  )
  t.deepEqual(
    String(toHtml.processSync('::: my-div\nThis is a paragraph.\n:::  ')),
    '<div class="my-div"><p>This is a paragraph.</p></div>',
    'should exclude spacing after the closing fence'
  )
  t.deepEqual(
    String(toHtml.processSync('::: my-div\nThis is a paragraph.\n:::::::')),
    '<div class="my-div"><p>This is a paragraph.</p></div>',
    'should allow more than three delimiters for closing fence'
  )
  t.deepEqual(
    String(
      toHtml.processSync('::: my-div\nThis is a paragraph.\n:::::::      ')
    ),
    '<div class="my-div"><p>This is a paragraph.</p></div>',
    'should allow more than three delimiters and exclude spaces for closing fence'
  )
  t.deepEqual(
    String(
      toHtml.processSync('::: my-div\nThis is a paragraph.\n:::::::    here')
    ),
    '<p>::: my-div\nThis is a paragraph.\n:::::::    here</p>',
    'should not allow anything except spaces and delimiters at the end of the closing fence'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        `::::: {.my-class-1 .my-class-2 #my-id key1=val1 key2=2}

Here is a paragraph.



And another.

:::::`
      )
    ),
    '<div id="my-id" class="my-class-1 my-class-2" data-key1="val1" data-key2="2"><p>Here is a paragraph.</p><p>And another.</p></div>',
    'should support extended attributes'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        `::::: {#my-id}

Here is a paragraph.



And another.

:::::`
      )
    ),
    '<div id="my-id"><p>Here is a paragraph.</p><p>And another.</p></div>',
    'should support extended attributes with only one id'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        `::::: {.my-class}

Here is a paragraph.



And another.

:::::`
      )
    ),
    '<div class="my-class"><p>Here is a paragraph.</p><p>And another.</p></div>',
    'should support extended attributes with only one class'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        `::::: {selected=selected percent=50}

Here is a paragraph.



And another.

:::::`
      )
    ),
    '<div data-selected="selected" data-percent="50"><p>Here is a paragraph.</p><p>And another.</p></div>',
    'should support extended attributes with only key vals data'
  )
  t.deepEqual(
    String(
      toHtml.processSync(
        `::::: {key1="val" key2='val2' key3=val3}
Here is a paragraph.
:::::`
      )
    ),
    '<div data-key1="val" data-key2="val2" data-key3="val3"><p>Here is a paragraph.</p></div>',
    'should support extended attributes with quoted strings as vals data'
  )
  t.equal(
    String(
      toHtml.processSync(
        `::::: {.plus titre="Comment appliquer des changements rapidement?"}
Here is a paragraph.
:::::`
      )
    ),
    '<div class="plus" data-titre="Comment appliquer des changements rapidement?"><p>Here is a paragraph.</p></div>',
    'should support extended attributes with double quoted strings including spaces as data'
  )
  t.equal(
    String(
      toHtml.processSync(
        `::::: {.plus titre='Comment appliquer des changements rapidement?'}
Here is a paragraph.
:::::`
      )
    ),
    '<div class="plus" data-titre="Comment appliquer des changements rapidement?"><p>Here is a paragraph.</p></div>',
    'should support extended attributes with single quoted strings including spaces as data'
  )
  t.equal(
    String(
      toHtml.processSync(
        `::::: {.plus titre="L'algorithme est-il efficace?"}
Here is a paragraph.
:::::`
      )
    ),
    '<div class="plus" data-titre="L&#x27;algorithme est-il efficace?"><p>Here is a paragraph.</p></div>',
    'should support extended attributes with single quoted strings including single quotes as data'
  )
  t.equal(
    String(
      toHtml.processSync(
        `::::: {.plus titre='"Bonjour"'}
Here is a paragraph.
:::::`
      )
    ),
    '<div class="plus" data-titre="&#x22;Bonjour&#x22;"><p>Here is a paragraph.</p></div>',
    'should support extended attributes with single quoted strings including single quotes as data'
  )
  t.end()
})
