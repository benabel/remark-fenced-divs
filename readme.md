# remark-fenced-divs

Fenced divs are some kind of generic syntax for block contents with a syntax similar to fenced code blocks but using : as delimiter instead of \`\`\`

From pandoc reference: <https://pandoc.org/MANUAL.html#extension-fenced_divs>

*   [x] A Div starts with a fence containing at least three consecutive colons
*   [x] A Div must start at the beginning of a line: it musn't be indented.
*   [ ] plus some attributes.
*   [ ] The attributes may optionally be followed by another string of consecutive colons.
*   [ ] The attribute syntax is exactly as in fenced code
        blocks (see Extension: fenced_code_attributes). As with fenced code blocks,
        one can use either attributes in curly braces or a single unbraced word, which
        will be treated as a class name.
*   [x] The Div ends with another line containing a string of at least three consecutive colons.
*   [ ] The fenced Div should be separated by blank lines from preceding and following blocks.

## Attributions

Code adapted from:

*   [`remark-math`](https://github.com/Rokt33r/remark-math) and [`remark` code-fenced](https://github.com/remarkjs/remark/blob/master/packages/remark-parse/lib/tokenize/code-fenced.js) for the parser.
*   and [`remark-react`](https://github.com/remarkjs/remark-react) for the
    structure
