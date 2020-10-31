'use strict'

var fs = require('fs')
var path = require('path')
var test = require('tape')
var vfile = require('to-vfile')
var unified = require('unified')
var remark = require('remark')
var not = require('not')
var hidden = require('is-hidden')
var directive = require('..')

test('directive()', function (t) {
  t.doesNotThrow(function () {
    remark().use(directive).freeze()
  }, 'should not throw if not passed options')

  t.doesNotThrow(function () {
    unified().use(directive).freeze()
  }, 'should not throw if without parser or compiler')

  t.end()
})

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
      var proc
      var actual
      var output

      proc = remark().use(directive).freeze()
      actual = proc.parse(file)

      try {
        output = fs.readFileSync(outputPath, 'utf8')
      } catch (_) {
        // New fixture.
        output = input
      }

      st.equal(String(proc.processSync(file)), output, 'process')

      st.end()
    })
  }
})
