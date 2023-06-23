import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { sanitize } from 'hast-util-sanitize'

import { createCustomRenderer } from '../example/demo-legacy-ractive-renderer.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const NODDITY_DIR = join(__dirname, '..', 'example', 'noddity')
const DOMAIN = 'site.com'

const render = createCustomRenderer({
	noddityDirectory: NODDITY_DIR,
	websiteDomain:DOMAIN,
})

const renderWithSanitize = createCustomRenderer({
	noddityDirectory: NODDITY_DIR,
	websiteDomain:DOMAIN,
	hastSanitizer: hast => sanitize(hast /* configure your sanitizer options here */),
})


test('rendering from a string', async () => {
	const out = await render.fromString('a [[cool.md|file]] link', 'yolo.md')
	assert.equal(out.html, '<p>a <a href="https://site.com/#!/post/cool.md">file</a> link</p>')
})

test('loading a file', async () => {
	const out = await render.loadFile('example-file.md')
	assert.equal(out.html, '<p>Here is an <a href="picture.png" target="_blank"><img src="picture.png" style="max-width:100%;"></a> and an <a href="https://site.com/#!/post/file.md">internal</a> link.</p>')
})

test('loading a file but sanitizing the html', async () => {
	const out = await renderWithSanitize.loadFile('example-file.md')
	assert.equal(out.html, '<p>Here is an <a href="picture.png" target="_blank"><img src="picture.png"></a> and an <a href="https://site.com/#!/post/file.md">internal</a> link.</p>')
})

test('loading a file with older style metadata', async () => {
	const out = await render.loadFile('old-school.md')
	assert.equal(out.html, '<p>Notice how there are no triple dashes.\nBut it\'s still valid.</p>')
})

test('loading a full post', async () => {
	const out = await render.loadPost('post', 'example-file.md')
	assert.equal(out.html, '<div class="main-wrapper"><h1>An Example</h1> <p>Here is an <a href="picture.png" target="_blank"><img src="picture.png" style="max-width:100%;"></a> and an <a href="https://site.com/#!/post/file.md">internal</a> link.</p></div>')
})

test('loading just some metadata', async () => {
	const metadata = await render.loadMetadata('old-school.md')
	assert.equal(metadata, { title: 'An Old School Noddity File' })
})

test('loading a non-markdown file', async () => {
	const out = await render.loadFile('img')
	assert.equal(out.html, '<a target="_blank"><img style="max-width:100%;"></a>')
})

test('loading a non-markdown file and passing in some metadata', async () => {
	const out = await render.loadFile(
		'img',
		{
			// The exact format of `variables` will be dependent on your
			// non-Markdown renderer implementation details.
			variables: [
				{ positional: true, name: 'fractal.png' },
				{ positional: true, name: '50px' },
			],
		},
	)
	assert.equal(out.html, '<a href="fractal.png" target="_blank"><img src="fractal.png" style="max-width:50px;"></a>')
})

test('loading a non-markdown file with noddity in it', async () => {
	const out = await render.loadFile('html-with-noddity.md')
	assert.equal(out.html, [
		'<p><a href="picture.png" target="_blank"><img src="picture.png" style="max-width:100%;"></a></p>',
		'<p><a href="https://site.com/file.md#header1">internal</a></p>',
	].join('\n'))
})

test.run()
