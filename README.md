# Noddity Micromark Renderer

This is a re-work of Noddity that uses Micromark and mdast to render the Markdown content, and has *no opinion* about non-Markdown content.

## Install

The usual ways:

```bash
npm install noddity-micromark-renderer
```

## Using

You'll need to initialize the renderer with several options (all of these are *required*):

```js
import { noddityRenderer } from 'noddity-micromark-renderer'
const render = noddityRenderer({
	// Noddity-specific functions
	loadFile,
	metadataParser,
	nonMarkdownRenderer,
	urlRenderer,
	// Micromark-specific functions
	hastToHtml,
	markdownToMdast,
	mdastToHast,
})
// for later examples
const NODDITY_FOLDER = '/path/to/noddity/content'
const DOMAIN = 'my-site.com'
```

#### loadFile

Typed: `(filename: string) => Promise<string>`

Used by the renderer to lookup Noddity templates. If you're rendering from disk, you could do:

```js
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
const loadFile = async filename => readFile(join(NODDITY_FOLDER, filename), 'utf8')
```

#### metadataParser

Typed: `(frontmatter: string): Object<*>`

Used by the renderer to parse the frontmatter section of each file.

If you want to use [js-yaml](https://github.com/nodeca/js-yaml) that would be (defining the schema is not required by this renderer):

```js
import { load, JSON_SCHEMA } from 'js-yaml'
const metadataParser = frontmatter => load(frontmatter, { schema: JSON_SCHEMA })
```

#### nonMarkdownRenderer

Typed: `({ filename: string, template: string, string: string, metadata: Object, variables: Array<NoddityVariables> }) => Promise<string>`

Where `NoddityVariables: { name: string, positional: boolean, value: string }`

This is where you would render non-Markdown content. In classic Noddity this means [Ractive](https://ractive.js.org/) (at `v0.7`) styled templates, but for this renderer there are no opinions about what you should use.

The returned value is the fully rendered HTML.

Properties passed to the function:

* `filename: string` - The file doing the calling of this as a template, if applicable, e.g. `folder/my-file.md`.
* `template: string` - The template name, e.g. if the above file had `::img|face.jpg::` this would be `img`.
* `string: string` - The string extracted from the Noddity file, e.g. in classic Noddity this would be the Ractive component.
* `metadata: Object` - The parsed metadata from the files frontmatter section.
* `variables: Array<NoddityVariables>` - An optional ordered list of variables passed along when calling this template.

Properties on the `NoddityVariables` objects are:

* `name: string` - The name of the variable. For a reference like `::img|face.jpg|size=big::` the first variable's name would be `face.jpg` and the second would be `size`.
* `positional: boolean` - Set to true if it is not a key=value named variable.
* `value?: string` - The value, if it is a named variable.

#### urlRenderer

Typed: `urlRenderer: ({ filename: string, link: string }) => Promise<string>`

It's up to you to render the correct URL string, but it's probably something like this:

```js
const urlRenderer = ({ link }) => `https://${DOMAIN}/#!/post/${link}`
```

#### markdownToMdast

#### mdastToHast

#### hastToHtml

## License

Published and released under the [Very Open License](http://veryopenlicense.com).

If you need a commercial license, [contact me here](https://davistobias.com/license?software=noddity-micromark-renderer).
