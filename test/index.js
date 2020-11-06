'use strict'

var fs = require('fs')
var path = require('path')
var test = require('tape')
var vfile = require('to-vfile')
var unified = require('unified')
var remark = require('remark')
var parse = require('remark-parse')
var remark2rehype = require('remark-rehype')
var rehypeStringify = require('rehype-stringify')
var u = require('unist-builder')
var removePosition = require('unist-util-remove-position')
var not = require('not')
var hidden = require('is-hidden')
var fencedDiv = require('..')

test('directive()', function (t) {
  t.doesNotThrow(function () {
    remark().use(fencedDiv).freeze()
  }, 'should not throw if not passed options')

  t.doesNotThrow(function () {
    unified().use(fencedDiv).freeze()
  }, 'should not throw if without parser or compiler')

  t.end()
})
/*
test('fixtures', function (t) {
  var base = path.join(__dirname, 'fixtures')
  var entries = fs.readdirSync(base).filter(not(hidden))

  t.plan(entries.length)

  entries.forEach(each)

  function each(fixture) {
    t.test(fixture, function (st) {
      var file = vfile.readSync(path.join(base, fixture, 'input.md'))
      var input = String(file.contents)
      var outputPath = path.join(base, fixture, 'output.md')
      var treePath = path.join(base, fixture, 'tree.json')
      var proc
      var actual
      var output
      var expected

      // md -> mdast -> md
      proc = remark().use(fencedDiv).freeze()
      actual = proc.parse(file)

      try {
        expected = JSON.parse(fs.readFileSync(treePath))
      } catch (_) {
        // New fixture.
        fs.writeFileSync(treePath, JSON.stringify(actual, 0, 2) + '\n')
        expected = actual
      }

      try {
        output = fs.readFileSync(outputPath, 'utf8')
      } catch (_) {
        output = input
      }

      st.deepEqual(actual, expected, 'tree')
      st.equal(String(proc.processSync(file)), output, 'process')


      st.end()
    })
  }
})
*/
test('remark-fenced-divs', function (t) {
  const toHtml = unified()
    .use(parse)
    .use(fencedDiv)
    .use(remark2rehype)
    .use(rehypeStringify)

  const toTree = function (mdAst) {
    var tree = unified().use(parse).use(fencedDiv).parse(mdAst)
    tree = removePosition(tree, true)
    return tree
  }

  t.deepEqual(
    toTree('::: my-div\nThis is a paragraph.\n:::').children[0],
    {
      type: 'containerDirective',
      name: 'my-div',
      attributes: {},
      data: {hName: 'div', hProperties: {className: ['my-div']}},
      children: [
        {
          type: 'paragraph',
          children: [{type: 'text', value: 'This is a paragraph.'}]
        }
      ]
    },
    'should support named fencedDiv block'
  )

  t.deepEqual(
    toTree('::: {.my-class1 .my-class2 #my-id}\nThis is a paragraph.\n:::')
      .children[0],
    {
      type: 'containerDirective',
      name: '',
      attributes: {class: 'my-class1 my-class2', id: 'my-id'},
      data: {
        hName: 'div',
        hProperties: {className: ['my-class1', 'my-class2'], id: 'my-id'}
      },
      children: [
        {
          type: 'paragraph',
          children: [{type: 'text', value: 'This is a paragraph.'}]
        }
      ]
    },
    'should support attributes fencedDiv block'
  )

  t.deepEqual(
    toTree(':::\nThis is a paragraph.\n:::').children[0],
    {
      type: 'paragraph',
      children: [{type: 'text', value: ':::\nThis is a paragraph.\n:::'}]
    },
    'should not support unamed fencedDiv block'
  )

   t.deepEqual(
     toTree(':: my-div\nThis is a paragraph.\n:::').children[0],
     {
       type: 'paragraph',
       children: [{type: 'text', value: ':: my-div\nThis is a paragraph.\n:::'}]
     },
     'should not support an opening fence lesser than 3'
   )
  
  t.deepEqual(
    toTree('::: my-div\nThis is a paragraph.\n::').children[0],
    {
      type: 'containerDirective',
      name: 'my-div',
      attributes: {},
      data: {hName: 'div', hProperties: {className: ['my-div']}},
      children: [
        {
          type: 'paragraph',
          children: [{type: 'text', value: 'This is a paragraph.\n::'}]
        }
      ]
    },
    'should not support an closing fence lesser than 3'
  )

  t.deepEqual(
    toTree('::: my-div\nThis is a paragraph.\n:::    \n').children[0],
    {
      type: 'containerDirective',
      name: 'my-div',
      attributes: {},
      data: {hName: 'div', hProperties: {className: ['my-div']}},
      children: [
        {
          type: 'paragraph',
          children: [{type: 'text', value: 'This is a paragraph.'}]
        }
      ]
    },
    'should support spaces after closing fence'
  )

   t.deepEqual(
     toTree('  ::: my-div\n  This is a paragraph.\n  :::').children[0],
     {
       type: 'containerDirective',
       name: 'my-div',
       attributes: {},
       data: {hName: 'div', hProperties: {className: ['my-div']}},
       children: [
         {
           type: 'paragraph',
           children: [{type: 'text', value: 'This is a paragraph.'}]
         }
       ]
     },
     'should support indented fencedDiv block'
   )

   t.equal(
     String(
       toHtml.processSync(
         '::: my-div\nThis is a paragraph.\n\n> block quote\n:::'
       )
     ),
     '<div class="my-div"><p>This is a paragraph.</p><blockquote>\n<p>block quote</p>\n</blockquote></div>',
     'should support block quote inside fenced div'
   )
  
  t.equal(
    String(
      toHtml.processSync(
        '::: my-div\nThis is a paragraph.\n\n> block quote\n\nAnother paragraph'
      )
    ),
    '<div class="my-div"><p>This is a paragraph.</p><blockquote>\n<p>block quote</p>\n</blockquote><p>Another paragraph</p></div>',
    'should automatically close at the end of the parent if no closing fence is found'
  )
 
    /* 
  t.equal(
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
  t.equal(
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
  */

  t.equal(
    String(
      toHtml.processSync(
        '::: my-div\nThis is a paragraph.\n:::\n```\nbravo\n```\n'
      )
    ),
    '<div class="my-div"><p>This is a paragraph.</p></div>\n<pre><code>bravo\n</code></pre>',
    'should not affect the next block'
  )
  t.equal(
    String(toHtml.processSync('::: my-div my-div2\nThis is a paragraph.\n:::')),
    '<p>::: my-div my-div2\nThis is a paragraph.\n:::</p>',
    'should not support spaces in names'
  )
  t.equal(
    String(toHtml.processSync(':::my-div\nI am just `javascript`\n:::')),
    '<div class="my-div"><p>I am just <code>javascript</code></p></div>',
    'should support inline markdown inside the div'
  )

  t.equal(
    String(
      toHtml.processSync(':::my-div\n```javascript\nvar i = 0;\n```\n:::')
    ),
    '<div class="my-div"><pre><code class="language-javascript">var i = 0;\n</code></pre></div>',
    'should support markdown block inside the div'
  )

  t.equal(
    String(
      toHtml.processSync(
        ':::my-div\nI am just **javascript**\n```javascript\nvar i = 0;\n```\n:::'
      )
    ),
    '<div class="my-div"><p>I am just <strong>javascript</strong></p><pre><code class="language-javascript">var i = 0;\n</code></pre></div>',
    'should support inline and block markdown inside the div'
  )

  t.equal(
    String(toHtml.processSync(':::just three colons')),
    '<p>:::just three colons</p>',
    'should not support an opening fence without newline'
  )

  t.equal(
    String(toHtml.processSync(':::      must\nThis is a paragraph.\n:::')),
    '<div class="must"><p>This is a paragraph.</p></div>',
    'should allow extra spaces before named attribute'
  )

  t.equal(
    String(toHtml.processSync(':::must         \nThis is a paragraph.\n:::')),
    '<div class="must"><p>This is a paragraph.</p></div>',
    'should allow extra spaces after named attribute'
  )
  t.equal(
    String(toHtml.processSync(':::  my-div\nThis is a paragraph.\n:::')),
    '<div class="my-div"><p>This is a paragraph.</p></div>',
    'should include values after the opening fence (except for spacing #2)'
  )
  /*
  t.equal(
    String(
      toHtml.processSync(
        ':::::::::::::::::: my-div::::\nThis is a paragraph.\n:::'
      )
    ),
    '<div class="my-div"><p>This is a paragraph.</p></div>',
    'should allow fence delimiter at the end of the opening fence without space'
  )
  t.equal(
    String(
      toHtml.processSync(
        ':::::::::::::::::: my-div  ::::\nThis is a paragraph.\n:::'
      )
    ),
    '<div class="my-div"><p>This is a paragraph.</p></div>',
    'should allow fence delimiter at the end of the opening fence with spaces'
  )
  t.equal(
    String(
      toHtml.processSync(
        ':::::::::::::::::: my-div    \nThis is a paragraph.\n:::'
      )
    ),
    '<div class="my-div"><p>This is a paragraph.</p></div>',
    'should allow fence delimiter or space at the end of the opening fence'
  )
  t.equal(
    String(
      toHtml.processSync(
        ':::::::::::::::::: my-div    :::::   \nThis is a paragraph.\n:::'
      )
    ),
    '<div class="my-div"><p>This is a paragraph.</p></div>',
    'should allow fence delimiter or space at the end of the opening fence'
  )
  t.equal(
    String(toHtml.processSync(':::     :::\nThis is a paragraph.\n:::')),
    '<p>:::     :::\nThis is a paragraph.\n:::</p>',
    'should not allow empty attribute in the opening fence'
  )
  t.equal(
    String(toHtml.processSync('   :::\n   1+1 = 2\n   :::')),
    '<p>   :::\n1+1 = 2\n:::</p>',
    'Should not allow initial spacing'
  )
  t.equal(
    String(toHtml.processSync('    :::\n    1+1 = 2\n    :::')),
    '<pre><code>:::\n1+1 = 2\n:::\n</code></pre>',
    'Should not allow initial spacing: 4 means a code block'
  )
  t.equal(
    String(toHtml.processSync('tango\n::: my-div\nThis is a paragraph.\n:::')),
    '<p>tango\n::: my-div\nThis is a paragraph.\n:::</p>',
    'should not support a fencedDiv block right after a paragraph'
  )
  t.equal(
    String(
      toHtml.processSync('tango\n\n::: my-div\nThis is a paragraph.\n:::')
    ),
    '<p>tango</p>\n<div class="my-div"><p>This is a paragraph.</p></div>',
    'the opening fence should be preceeded by an empty line'
  )
  t.equal(
    String(
      toHtml.processSync(
        'tango\n        \n::: my-div\nThis is a paragraph.\n:::'
      )
    ),
    '<p>tango</p>\n<div class="my-div"><p>This is a paragraph.</p></div>',
    'the opening fence should be preceeded by a line containing only spaces'
  )
  t.equal(
    String(
      toHtml.processSync(
        'tango\n \t  \t         \n::: my-div\nThis is a paragraph.\n:::'
      )
    ),
    '<p>tango</p>\n<div class="my-div"><p>This is a paragraph.</p></div>',
    'the opening fence should be preceeded by a line containing only spaces and tabs'
  )
  t.equal(
    String(toHtml.processSync('::: my-div\nThis is a paragraph.\n\nmust  :::')),
    '<p>::: my-div\nThis is a paragraph.</p>\n<p>must  :::</p>',
    'the closing fence should be at the beginning of the line.'
  )
  t.equal(
    String(toHtml.processSync('::: my-div\n1+1 = 2')),
    '<p>::: my-div\n1+1 = 2</p>',
    'fencedDiv block should be closed'
  )
  t.equal(
    String(toHtml.processSync('::: my-div\nThis is a paragraph.\n:::  ')),
    '<div class="my-div"><p>This is a paragraph.</p></div>',
    'should exclude spacing after the closing fence'
  )
  t.equal(
    String(toHtml.processSync('::: my-div\nThis is a paragraph.\n:::::::')),
    '<div class="my-div"><p>This is a paragraph.</p></div>',
    'should allow more than three delimiters for closing fence'
  )
  t.equal(
    String(
      toHtml.processSync('::: my-div\nThis is a paragraph.\n:::::::      ')
    ),
    '<div class="my-div"><p>This is a paragraph.</p></div>',
    'should allow more than three delimiters and exclude spaces for closing fence'
  )
  t.equal(
    String(
      toHtml.processSync('::: my-div\nThis is a paragraph.\n:::::::    here')
    ),
    '<p>::: my-div\nThis is a paragraph.\n:::::::    here</p>',
    'should not allow anything except spaces and delimiters at the end of the closing fence'
  )
  t.equal(
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
  t.equal(
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
  t.equal(
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
  t.equal(
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
  t.equal(
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
  */
  t.end()
})
