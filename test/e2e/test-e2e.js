const unified = require('unified')
const parse = require('remark-parse')
const remark2rehype = require('remark-rehype')
const stringify = require('rehype-stringify')
const fencedDiv = require('../..')
const fs = require('fs')

unified()
  .use(parse, {commonmark: true})
  .use(fencedDiv)
  .use(remark2rehype)
  .use(stringify, {
    quoteSmart: false
  })
  .process(fs.readFileSync('test.md'), function (err, file) {
    if (err) throw err
    fs.writeFileSync('test-remark.html', String(file))
  })
