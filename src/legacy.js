import { join } from 'node:path'
import { readFile } from 'node:fs/promises'

import { toHast } from 'mdast-util-to-hast'
import { toHtml } from 'hast-util-to-html'
import { hastUtilNoddity } from 'hast-util-noddity'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { raw } from 'hast-util-raw'
import { frontmatter } from 'micromark-extension-frontmatter'
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import { gfm } from 'micromark-extension-gfm'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { micromarkFromNoddity, mdastFromNoddity } from 'mdast-util-noddity'
import Ractive from 'ractive'

Ractive.DEBUG = false

import { noddityRenderer as coreNoddityMicromarkRenderer } from './index.js'
import { metadataMdastMutator } from './yaml-metadata-mdast-mutator.js'

const legacyRactiveNoddityRenderer = ({ siteProperties }) => ({ filename, templateString, site, metadata, variables, innerHtml }) => {
	const data = {
		...(siteProperties || {}),
		...(site || {}),
		filename,
	}
	;(variables || []).forEach((v, index) => {
		if (v.positional) data[index + 1] = v.name
		else data[v.name] = v.value
	})
	if (metadata) data.metadata = metadata
	if (filename === 'sermons-list') console.log('---------???', data, innerHtml, templateString)
	return innerHtml
		? Ractive({ partials: { current: innerHtml }, template: templateString, data }).toHTML()
		: Ractive({ template: templateString, data }).toHTML()
}

export const noddityRenderer = ({ directory, hastSanitizer, domain, pathPrefix, pagePathPrefix, ...options }) => {
	const urlPrefix = [
		domain === 'localhost' || domain.startsWith('localhost:')
			? 'http'
			: 'https',
		'://',
		domain,
		'/',
		pathPrefix || '',
		pagePathPrefix || '',
	].join('')
	const pathPrefixIsHashBased = pathPrefix?.includes('#')
	const urlString = ({ file, id }) => urlPrefix + (pathPrefixIsHashBased
		? file
		: (file + '#' + id))

	const addNoddityToHtml = async hastTree => hastUtilNoddity(hastTree, {
		urlRenderer: async ({ file, id, nodes }) => ([
			{
				type: 'element',
				tagName: 'a',
				properties: { href: urlString({ file, id }) },
				children: nodes,
			},
		]),
		templateRenderer: async ({ file, parameters: templateReferenceParameters }) => {
			const variables = templateReferenceParameters.map(p => {
				if (p.key && p.value !== undefined) return { name: p.key, value: p.value }
				return { positional: true, name: p }
			})
			const { html } = await renderer.loadFile(file, { variables })
			return [
				{
					type: 'raw',
					value: html,
				},
			]
		},
	})

	const renderer = coreNoddityMicromarkRenderer({
		loadFile: async file => readFile(join(directory, file), 'utf8'),
		metadataMdastMutator,
		urlRenderer: async ({ link }) => urlPrefix + link,
		nonMarkdownRenderer: legacyRactiveNoddityRenderer({
			siteProperties: { domain, pathPrefix, pagePathPrefix, ...options },
		}),
		markdownToMdast: async string => fromMarkdown(string, {
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
		hastToHtml: async hastTree => {
			hastTree = raw(hastTree)
			if (hastSanitizer) hastTree = hastSanitizer(hastTree)
			for (const child of hastTree.children) await addNoddityToHtml(child)
			return toHtml(hastTree, { allowDangerousHtml: true })
		},
	})

	return renderer
}
