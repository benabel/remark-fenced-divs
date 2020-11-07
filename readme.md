# remark-fenced-divs

## Important!

This plugin is made for the new parser in remark
([`micromark`](https://github.com/micromark/micromark),
see [`remarkjs/remark#536`](https://github.com/remarkjs/remark/pull/536)).
Use this plugin for remark 13+.

If you don't need Pandoc compatibility you should consider using
[remark-directive](https://github.com/remarkjs/remark-directive).

## Getting started

Fenced divs are some kind of generic syntax for block contents with a syntax
similar to fenced code blocks but using a 3 colons `:::` as delimiter instead of
\`\`\`.

It allows a simple word used as a `class` in html:

```md
::: my-class
This is a paragraph.
:::
```

Will be rendered in `html` as:

```html
<div class="my-div">
  <p>This is a paragraph.</p>
</div>
```

Or extended attributes syntax in curly braces:

```md
::: {#navbar .container .right key=1 key2="value 2"}
This is a paragraph.
:::
```

Will be rendered in `html` as:

```html
<div id="navbar" class="container right" data-key1="1" data-key2="value 2">
  <p>This is a paragraph.</p>
</div>
```

## Syntax details

From `pandoc` reference: <https://pandoc.org/MANUAL.html#extension-fenced_divs>

- \[x] A Div must start at the beginning of a line: it mustn't be indented.
- \[x] A Div starts with a fence containing at least three consecutive colons
  plus some attributes.
- \[x] The attributes may optionally be followed by another string of
  consecutive colons.
- \[x] The attribute syntax is exactly as in fenced code blocks (see Extension:
  fenced_code_attributes). As with fenced code blocks, one can use either
  attributes in curly braces or
- \[x] a single unbraced word, which will be treated as a class name.
- \[x] The Div must ends with another line containing a string of at least
  three consecutive colons at the beginning of the line.
- \~~The fenced Div should be separated by blank lines:~~
  - \[ ] ~~from preceding~~
  - \[ ] ~~and following blocks.~~
- \[x] The fenced Div can be nested.

Other implementations details include:

- A Div ends with a fence containing at least three consecutive colons plus some spaces.
- If no closing fence is found, the container runs to the end of its parent
  container (block quote, list item, document, or other container).
- A fenced div can be indented with up to 3 spaces.
- It is not necessary to add a blank line before and after the fenced div.

## Acknowledgments

Code adapted from:

- [`remark-directive`](https://github.com/remarkjs/remark-directive) by Titus
  Wormer licensed under the MIT licence.
