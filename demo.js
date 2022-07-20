import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { toHast } from 'mdast-util-to-hast'
import { toHtml } from 'hast-util-to-html'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { frontmatter } from 'micromark-extension-frontmatter'
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import { gfm } from 'micromark-extension-gfm'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { load, JSON_SCHEMA } from 'js-yaml'

import { micromarkFromNoddity, mdastFromNoddity } from 'mdast-util-noddity'

import { noddityRenderer } from './src/index.js'

const recurseRemovePosition = obj => {
	if (obj?.children?.length) obj.children.forEach(recurseRemovePosition)
	if (obj?.position) delete obj.position
}

const NODDITY_DIR = '/Users/saibotsivad/Development/git/KayserCommentary/Markdown/Web'
const DOMAIN = 'site.com'
// const FILEPATH = 'asin'
const FILEPATH = 'tobias-test-file.md'
// Here is an ::img|picture.png|size=big:: and an [[file.md|internal]] link.

const render = noddityRenderer({
	loadFile: async file => readFile(join(NODDITY_DIR, file), 'utf8'),
	metadataParser: string => load(string, { schema: JSON_SCHEMA }),
	urlRenderer: async ({ link }) => `https://${DOMAIN}/#!/post/${link}`,
	nonMarkdownRenderer: async ({ filename, template, string, metadata, variables }) => {
		console.log('-----------nonMarkdownRenderer-------------', { filename, template, metadata, variables, string })
		return '<abbr title="Some demo thing">Hey there.</abbr>'
	},
	markdownToMdast: string => fromMarkdown(string, {
		extensions: [
			frontmatter([ 'yaml' ]),
			gfm(),
			micromarkFromNoddity(),
		],
		mdastExtensions: [
			frontmatterFromMarkdown([ 'yaml' ]),
			gfmFromMarkdown(),
			mdastFromNoddity(),
		],
	}),
	mdastToHast: toHast,
	hastToHtml: toHtml,
})

const html = await render.fromDisk(FILEPATH)
console.log('----------- HTML -------------')
console.log(html)

const html2 = await render.fromString('yolo.md', 'a [[cool.md|file]] link')
console.log('----------- HTML -------------')
console.log(html2)
