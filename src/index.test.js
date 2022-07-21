import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { createCustomRenderer } from '../example/demo-renderer.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const NODDITY_DIR = join(__dirname, '..', 'example', 'noddity')
const DOMAIN = 'site.com'

const render = createCustomRenderer(NODDITY_DIR, DOMAIN)

test('rendering from a string', async () => {
	const out = await render.fromString('a [[cool.md|file]] link', 'yolo.md')
	assert.equal(out.html, '<p>a <a href="https://site.com/#!/post/cool.md">file</a> link</p>')
})

test('loading a file', async () => {
	const out = await render.loadFile('example-file.md')
	assert.equal(out.html, '<p>Here is an <a href="picture.png" class="link-no-underline" target="_blank"><img src="picture.png" style="max-width:100%;"></a> and an <a href="https://site.com/#!/post/file.md">internal</a> link.</p>')
})

test('loading a file with older style metadata', async () => {
	const out = await render.loadFile('old-school.md')
	assert.equal(out.html, '<p>Notice how there are no triple dashes.\nBut it\'s still valid.</p>')
})

test('loading a full post', async () => {
	const out = await render.loadPost('post', 'example-file.md')
	assert.equal(out.html, '<div class="main-wrapper"><h1>An Example</h1> <p>Here is an <a href="picture.png" class="link-no-underline" target="_blank"><img src="picture.png" style="max-width:100%;"></a> and an <a href="https://site.com/#!/post/file.md">internal</a> link.</p></div>')
})

test('loading just some metadata', async () => {
	const metadata = await render.loadMetadata('old-school.md')
	assert.equal(metadata, { title: 'An Old School Noddity File' })
})

test.run()
