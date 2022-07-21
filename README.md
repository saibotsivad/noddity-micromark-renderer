# Noddity Micromark Renderer

This is a re-work of Noddity that uses Micromark and mdast to render the Markdown content, and has *no opinion* about non-Markdown content.

(See the [demo](./example/demo-renderer.js) for an example of using Ractive, Nodditys built-in template renderer.)

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

Each input property is defined here:

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
* `innerHtml?: string` - If loading a post, this will be the fully rendered post content, while the `templateString` will be the surrounding post non-rendered string.
* `metadata?: Object` - The parsed metadata from the files frontmatter section.
* `templateName: string` - The name of the template, e.g. if the above file had `::img|face.jpg::` this would be `img`.
* `templateString: string` - The string extracted from the Noddity file, e.g. in classic Noddity this would be the Ractive component.
* `variables?: Array<NoddityVariables>` - An optional ordered list of variables passed along when calling this template.

Properties on the `NoddityVariables` objects are:

* `name: string` - The name of the variable. For a reference like `::img|face.jpg|size=big::` the first variable's name would be `face.jpg` and the second would be `size`.
* `positional: boolean` - Set to true if it is not a key=value named variable.
* `value?: string` - The value, if it is a named variable.

#### urlRenderer

Typed: `({ filename: string, link: string }) => Promise<string>`

It's up to you to render the correct URL string, but it's usually something like this:

```js
const urlRenderer = ({ link }) => `https://${DOMAIN}/#!/post/${link}`
```

#### markdownToMdast

Typed: `(markdown: string) => Promise<Mdast>`

Async function that resolves to an `mdast` (Markdown Abstract State Tree), for example [mdast-util-from-markdown](https://github.com/syntax-tree/mdast-util-from-markdown), and that needs to contain the Noddity-specific nodes defined in [mdast-util-noddity](https://github.com/saibotsivad/mdast-util-noddity/).

Here's how you might set this function up:

```js
import { fromMarkdown } from 'mdast-util-from-markdown'
import { frontmatter } from 'micromark-extension-frontmatter'
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import { gfm } from 'micromark-extension-gfm'
import { gfmFromMarkdown } from 'mdast-util-gfm'

const markdownToMdast = string => fromMarkdown(string, {
	extensions: [
		// if you need more extensions, e.g. for additional Markdown functionality, you'd configure it here
		frontmatter([ 'yaml' ]),
		gfm(),
		micromarkFromNoddity(),
	],
	mdastExtensions: [
		// (and here)
		frontmatterFromMarkdown([ 'yaml' ]),
		gfmFromMarkdown(),
		mdastFromNoddity(),
	],
})
```

The function must return a promise which resolves to an `mdast` with the Noddity-specific nodes.

#### mdastToHast

Typed: `(tree: MdastTree) => HastTree`

Given an `mdast` tree, return an `hast` (HTML Abstract State Tree).

Note that, if you use templates of any kind, you'll probably want to allow HTML. Here's one way to do this:

```js
import { toHast } from 'mdast-util-to-hast'
const mdastToHast = mdastTree => toHast(mdastTree, { allowDangerousHtml: true })
```

#### hastToHtml

Typed: `(tree: HastTree) => string`

Given an `hast` (HTML Abstract State Tree) output an HTML string.

Note that, if you use templates of any kind, the `hast` will contain text nodes that are HTML (as opposed to a strict `hast`) so you'll probably want to allow that. Here's one way:

```js
import { toHtml } from 'hast-util-to-html'
const hastToHtml = hastTree => toHtml(hastTree, { allowDangerousHtml: true })
```

## `render`

An initialized `render` is an object containing the following properties:

### `fromString`

Typed: `(markdown: string, virtualFilename?: string) => Promise<string>`

This function is used to render free-hand sections of Markdown as noddity, e.g. instead of rendering a file you can render a chunk of Markdown with not other context.

The `virtualFilename` is used only for logging purposes, and if not provided will default to `VIRTUAL_FILE.md`.

#### `loadFile`

Typed: `(filename: string) => Promise<string>`

This is a per-file renderer function. It renders a file by loading the provided `filename` using the defined `loadFile` function, which can load files from anywhere, e.g. from disk, database, cloud storage, etc.

It then passes through the flow Markdown -> mdast -> Noddity (templates and links) -> hast -> html

### `loadMetadata`

Typed: `(filename: string) => Promise<Object>`

This is a convenience method, which will use the defined `loadFile` to read in a file and parse out the frontmatter metadata section, using your provided `metadataParser` function to turn that string into an object.

### `loadPost`

Typed: `(templateFilename: string, postFilename: string) => Promise<string>`

Similar to the `loadFile` function, except it renders the `postFilename` inside the context of the `templateFilename` (inside Noddity, by default this is the [`content/post`](https://github.com/TehShrike/noddity/blob/master/content/post) file).

## License

Published and released under the [Very Open License](http://veryopenlicense.com).

If you need a commercial license, [contact me here](https://davistobias.com/license?software=noddity-micromark-renderer).
