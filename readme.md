# remark-fenced-divs

Fenced divs are some kind of generic syntax for block contents with a syntax
similar to fenced code blocks but using a 3 colons `:::` as delimiter instead of
\`\`\`.

From `pandoc` reference: <https://pandoc.org/MANUAL.html#extension-fenced_divs>

*   [x] A Div must start at the beginning of a line: it mustn't be indented.
*   [x] A Div starts with a fence containing at least three consecutive colons
    plus some attributes.
*   [x] The attributes may optionally be followed by another string of
    consecutive colons.
*   [ ] The attribute syntax is exactly as in fenced code blocks (see Extension:
        fenced_code_attributes). As with fenced code blocks, one can use either
        attributes in curly braces or
*   [x] a single unbraced word, which will be treated as a class name.
*   [x] The Div must ends with another line containing a string of at least
    three consecutive colons at the beginning of the line.
*   The fenced Div should be separated by blank lines:
*   [x] from preceding 
*   [ ] and following blocks.
*   [x] The fenced Div can be nested.

## Acknowledgments

Code adapted from:

*   [`remark-math`](https://github.com/Rokt33r/remark-math) and
    [`remark-containers`](https://github.com/Nevenall/remark-containers) for the
    parser.
*   and [`remark-react`](https://github.com/remarkjs/remark-react) for the
    structure.
