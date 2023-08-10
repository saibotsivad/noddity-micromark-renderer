import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { sanitize } from 'hast-util-sanitize'
import { noddityRenderer } from './legacy.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const options = {
	directory: join(__dirname, '..', 'example', 'noddity'),
	domain: 'site.com',
	pathPrefix: '#!/',
	pagePathPrefix: 'post/',
	name: 'Legacy Test',
	siteParam: 'original',
}

const render = noddityRenderer(options)

test('rendering from a string', async () => {
	const out = await render.fromString('a [[cool.md|file]] link', 'yolo.md')
	assert.equal(out.html, '<p>a <a href="https://site.com/#!/post/cool.md">file</a> link</p>')
})

test('rendering a string with a template', async () => {
	const out = await render.fromString('a ::home|cool:: template')
	assert.equal(out.html, '<p>a <a href="https://site.com/">cool</a> template</p>')
})

test('rendering a string with a template and additional metadata', async () => {
	const out = await render.fromString('Hello ::different::!', { site: { helloName: 'world' } })
	assert.equal(out.html, '<p>Hello <em>world</em>!</p>')
})

test('rendering a string with a template which has a parameter', async () => {
	const out = await render.fromString('Hello ::different|helloName=world::!')
	assert.equal(out.html, '<p>Hello <em>world</em>!</p>')
})

test('rendering a non-markdown string and passing in site level data', async () => {
	const out = await render.fromString('Frodo {{surname}}', { site: { surname: 'Baggins' }, metadata: { markdown: false } })
	assert.equal(out.html, 'Frodo Baggins')
})

test('loading a file', async () => {
	const out = await render.loadFile('example-file.md')
	assert.equal(out.html, '<p>Here is an <a href="picture.png" target="_blank"><img src="picture.png" style="max-width:100%;"></a> and an <a href="https://site.com/#!/post/file.md">internal</a> link.</p>')
})

test('loading a file but sanitizing the html', async () => {
	const renderWithSanitize = noddityRenderer({
		...options,
		hastSanitizer: hast => sanitize(hast),
	})
	const out = await renderWithSanitize.loadFile('example-file.md')
	assert.equal(out.html, '<p>Here is an <a href="picture.png" target="_blank"><img src="picture.png"></a> and an <a href="https://site.com/#!/post/file.md">internal</a> link.</p>')
})

test('loading a file with older style metadata', async () => {
	const out = await render.loadFile('old-school.md')
	assert.equal(out.html, '<p>Notice how there are no triple dashes.\nBut it\'s still valid.</p>')
})

test('loading just some metadata', async () => {
	const metadata = await render.loadMetadata('old-school.md')
	assert.equal(metadata, { title: 'An Old School Noddity File' })
})

test('loading a full post', async () => {
	const out = await render.loadPost('post', 'example-file.md')
	assert.equal(out.html, '<div class="main-wrapper"><h1>An Example</h1> <p>Here is an <a href="picture.png" target="_blank"><img src="picture.png" style="max-width:100%;"></a> and an <a href="https://site.com/#!/post/file.md">internal</a> link.</p></div>')
})

test('you can even contort non-HTML out of it, loading a non-markdown file with additional context', async () => {
	const out = await render.loadFile('img', {
		site: { markdownOutput: true },
		variables: [
			// The exact format of `variables` will be dependent on your
			// non-Markdown renderer implementation details. Here, of course,
			// we are using legacy Ractive.
			{ positional: true, name: 'picture.png' },
			{ positional: true, name: '24em' },
		],
	})
	assert.equal(out.html, '![](picture.png){width=24em}')
})

test('loading a non markdown file without any context is kind of weird but okay', async () => {
	const out = await render.loadFile('img')
	assert.equal(out.html, '<a target="_blank"><img style="max-width:100%;"></a>')
})

test('loading a non-markdown file with noddity in it and the hash fragment is ignored', async () => {
	const out = await render.loadFile('html-with-noddity.md')
	assert.equal(out.html, [
		'<p><a href="picture.png" target="_blank"><img src="picture.png" style="max-width:100%;"></a></p>',
		'<p><a href="https://site.com/#!/post/file.md">internal</a></p>',
	].join('\n'))
})

test('but if we override the site context we can retain the hash fragment', async () => {
	const renderWithoutHash = noddityRenderer({
		...options,
		pathPrefix: '',
		pagePathPrefix: '',
	})
	const out = await renderWithoutHash.loadFile('html-with-noddity.md')
	assert.equal(out.html, [
		'<p><a href="picture.png" target="_blank"><img src="picture.png" style="max-width:100%;"></a></p>',
		'<p><a href="https://site.com/file.md#header1">internal</a></p>',
	].join('\n'))
})

test.run()
