::: my-div
Don't need empty line if div at the beginning of the file.
:::

## id and class

::::: {#special .sidebar}

Here is a paragraph.

And another.

:::::

## keyword attributes

::::: {.class-1 .class-2 #id1 #id2 key1="val" key-2=2 KEY3=true}

Here is a paragraph.

And another.

:::::

## keyword attributes with quoted string values

::::: {key1="val" key2='val2' key3=val3}
Here is a paragraph.
:::::

## keyword attributes with quoted string values including spaces

::: {.plus titre="Comment appliquer des changements rapidement?"}
Here is a paragraph.
:::

## keyword attributes with quoted string values including quotes

::::: {.plus titre="L'algorithme est-il efficace?"}
Here is a paragraph.
:::::

::::: {.plus titre='"Bonjour"'}
Here is a paragraph.
:::::

## nested

::: Warning ::::::
This is a warning.

::: Danger
This is a warning within a warning.
:::

::::::::::::::::::

## divs shouldn't be indented

::::: {#special .sidebar}

Here is a paragraph.

And another.

:::::

## Differences

### Pandoc should be surrounded with blank lines

Bonjour

::: Warning ::::::
This is a warning.
:::
Aurevoir

## Pandoc don't auto close at end of file

::: Warning ::::::
This is a warning.
