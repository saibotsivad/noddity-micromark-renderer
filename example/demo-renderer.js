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
import Ractive from 'ractive'

Ractive.DEBUG = false

import { noddityRenderer } from '../src/index.js'

const sitewideProperties = {
	pathPrefix: '/',
	pagePathPrefix: 'post/',
}

const legacyRactiveNoddityRenderer = ({ filename, templateString, metadata, variables, innerHtml }) => {
	const data = {
		...sitewideProperties,
		filename,
	}
	;(variables || []).forEach((v, index) => {
		if (v.positional) data[index + 1] = v.name
		else data[v.name] = v.value
	})
	if (metadata) data.metadata = metadata
	return innerHtml
		? Ractive({ partials: { current: innerHtml }, template: templateString, data }).toHTML()
		: Ractive({ template: templateString, data }).toHTML()
}

export const createCustomRenderer = (noddityDirectory, websiteDomain) => noddityRenderer({
	loadFile: async file => readFile(join(noddityDirectory, file), 'utf8'),
	metadataParser: string => load(string, { schema: JSON_SCHEMA }),
	urlRenderer: async ({ link }) => `https://${websiteDomain}/#!/post/${link}`,
	nonMarkdownRenderer: async ({ filename, templateName, templateString, metadata, variables, innerHtml }) => {
		// console.log('========== nonMarkdownRenderer =========', { filename, templateName, templateString, metadata, variables })
		return legacyRactiveNoddityRenderer({ filename, templateString, metadata, variables, innerHtml })
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
	mdastToHast: mdastTree => toHast(mdastTree, { allowDangerousHtml: true }),
	hastToHtml: hastTree => toHtml(hastTree, { allowDangerousHtml: true }),
})
