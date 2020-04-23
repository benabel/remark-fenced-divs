/**
 * test-e2e module.
 *
 * Compare output of pandoc and remark for the extension fenced_fivs
 *
 * TODO: compare trees
 *
 * @module test-e2e
 */

const {spawn} = require('child_process')
process.chdir(__dirname)

const fs = require('fs')
const unified = require('unified')
const parse = require('remark-parse')
const remark2rehype = require('remark-rehype')
const stringify = require('rehype-stringify')
const fencedDiv = require('../..')
var vfile = require('to-vfile')
var report = require('vfile-reporter')
var rehype = require('rehype')
var format = require('rehype-format')

//
// convert md to html
// with pandoc

const arguments =
  '-f markdown-auto_identifiers-smart test.md -o test-pandoc.html'
const childPandoc = spawn('pandoc', arguments.split(' '))

childPandoc.on('exit', function (code, signal) {
  console.log('pandoc exited with ' + `code ${code} and signal ${signal}`)
})

childPandoc.stdout.on('data', (data) => {
  console.log(`pandoc stdout:\n${data}`)
})

childPandoc.stderr.on('data', (data) => {
  console.error(`pandoc stderr:\n${data}`)
})

// With remark using fenced_divs
unified()
  .use(parse, {commonmark: true})
  .use(fencedDiv)
  .use(remark2rehype)
  .use(stringify, {
    quoteSmart: false
  })
  .process(vfile.readSync('test.md'), function (err, file) {
    console.error(report(err || file))
    fs.writeFileSync('test-remark.html', String(file))
  })

// Format files for visual comparison
function format(htmlFile) {
  rehype()
    .use(format)
    .process(vfile.readSync(htmlFile), function (err, file) {
      console.error(report(err || file))
      fs.writeFileSync(htmlFile, String(file))
    })
}
;['test-pandoc.html', 'test-remark.html'].forEach((file) => {
  console.log('Formatting ' + file)
  format(file)
})
