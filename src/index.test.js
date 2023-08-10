import { fromMarkdown } from 'mdast-util-from-markdown'
import { toHast } from 'mdast-util-to-hast'
import { toHtml } from 'hast-util-to-html'

import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { noddityRenderer } from './index.js'

const options = {
	urlRenderer: ({ file, nodes }) => ([
		{
			type: 'element',
			tagName: 'a',
			properties: { href: file },
			children: nodes,
		},
	]),
	markdownToMdast: async string => fromMarkdown(string),
	mdastToHast: mdastTree => toHast(mdastTree, { allowDangerousHtml: true }),
	hastToHtml: async hastTree => toHtml(hastTree, { allowDangerousHtml: true }),
}

const simplestRender = noddityRenderer({
	...options,
	loadFile: async filename => {
		if (filename === 'hello.md') return 'Hello *world*!'
		else throw new Error('this test only calls those two files')
	},
})

test('the absolute simplest renderer actually does not need to even know about noddity although that would be weird', async () => {
	assert.equal(
		(await simplestRender.fromString('a [cool](file.md) link')).html,
		'<p>a <a href="file.md">cool</a> link</p>',
	)
})

test('in fact in this case it could not render noddity blocks', async () => {
	assert.equal(
		(await simplestRender.fromString('a [[cool.md|file]] link')).html,
		'<p>a [[cool.md|file]] link</p>',
	)
})

test('it will load a file', async () => {
	assert.equal(
		(await simplestRender.loadFile('hello.md')).html,
		'<p>Hello <em>world</em>!</p>',
	)
})

const renderNonMarkdown = noddityRenderer({
	...options,
	loadFile: async filename => {
		if (filename === 'hello.md') return 'Hello *world*!'
		else if (filename === 'layout') return '<div>$$CONTENT$$</div>'
		else throw new Error('this test should not call ' + filename)
	},
	metadataMdastMutator: async ({ filename, mdastTree }) => {
		if (filename === 'layout') {
			mdastTree.children = [
				{
					metadata: { markdown: false },
					position: { end: { offset: 0 } },
				},
				...mdastTree.children,
			]
		}
	},
	nonMarkdownRenderer: ({ templateString, innerHtml }) => {
		return templateString.replace('$$CONTENT$$', innerHtml)
	},
})

test('it will load a post', async () => {
	assert.equal(
		(await renderNonMarkdown.loadPost('layout', 'hello.md')).html,
		'<div><p>Hello <em>world</em>!</p></div>',
	)
})

test.run()
