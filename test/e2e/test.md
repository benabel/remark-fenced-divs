::: my-div
Don't need empty line if div at the beginning of the file.
:::

## id and class

::::: {#special .sidebar}

Here is a paragraph.



And another.

:::::

## keyword attributes

::::: {.class key="val"}

Here is a paragraph.



And another.

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


## should be surrounded with blank lines

Bonjour

::: Warning ::::::
This is a warning.
:::
Aurevoir

## Don't auto close at end of file

::: Warning ::::::
This is a warning.