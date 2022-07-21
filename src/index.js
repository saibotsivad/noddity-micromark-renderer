import { noddityMdastMutator } from 'mdast-util-noddity'

const parseAndSetMetadata = ({ mdastTree, metadataParser }) => {
	const hasSimpleStyleMetadata = mdastTree?.children?.[0]?.type === 'paragraph' && mdastTree?.children?.[0]?.children?.length === 1
	if (mdastTree?.children?.[0]?.type === 'yaml' || hasSimpleStyleMetadata) {
		let value = hasSimpleStyleMetadata ? mdastTree.children[0].children[0].value : mdastTree.children[0].value
		try {
			const metadata = metadataParser(value)
			if (metadata) mdastTree.children[0].metadata = metadata
			if (hasSimpleStyleMetadata) {
				mdastTree.children[0].type = 'yaml'
				mdastTree.children[0].value = mdastTree.children[0].children[0].value
				delete mdastTree.children[0].children
			}
		} catch (ignore) {
			//
		}
	}
}

export const noddityRenderer = ({
	loadFile,
	metadataParser,
	urlRenderer,
	nonMarkdownRenderer,
	markdownToMdast,
	mdastToHast,
	hastToHtml,
}) => {
	const parseMarkdownToMdastAndParseMetadata = async (markdownString) => {
		const mdastTree = await markdownToMdast(markdownString)
		parseAndSetMetadata({ mdastTree, metadataParser })
		const metadata = mdastTree.children[0].type === 'yaml' && mdastTree.children[0].metadata
		const metadataCharsOffset = metadata && mdastTree.children[0].position.end.offset
		return {
			tree: mdastTree,
			contentString: metadataCharsOffset && markdownString.substring(metadataCharsOffset + 1), // 1 = number of empty lines between metadata and content
			metadata,
		}
	}
	const mutate = noddityMdastMutator({
		urlRenderer,
		templateResolver: async ({ filename, template, variables }) => {
			const { html } = await loadAndRenderNoddityContent(filename, await loadFile(template), { filename, templateName: template, variables })
			return {
				type: 'html',
				value: html,
			}
		},
	})
	const convertMdastToHtml = async (mdastTree, filename) => {
		await mutate(mdastTree, filename)
		const hastTree = mdastToHast(mdastTree)
		return hastToHtml(hastTree)
	}
	const loadAndRenderNoddityContent = async (filename, markdownString, opts) => {
		const { tree, metadata, contentString } = await parseMarkdownToMdastAndParseMetadata(markdownString)
		const html = metadata?.markdown === false
			? await nonMarkdownRenderer({
				...(opts || {}),
				filename,
				templateString: contentString,
				metadata: tree.children[0].metadata,
			})
			: await convertMdastToHtml(tree, filename)
		return { html, metadata }
	}
	return {
		fromString: async (markdownString, virtualFilename = 'VIRTUAL_FILE.md') => loadAndRenderNoddityContent(virtualFilename, markdownString),
		loadFile: async filename => loadFile(filename).then(markdownString => loadAndRenderNoddityContent(filename, markdownString)),
		loadMetadata: async filename => {
			const { metadata } = await parseMarkdownToMdastAndParseMetadata(await loadFile(filename))
			return metadata
		},
		loadPost: async (templateFilename, postFilename) => {
			const { html: postHtml, metadata: postMetadata } = await loadAndRenderNoddityContent(postFilename, await loadFile(postFilename))
			const { tree, metadata: postTemplateMetadata, contentString: postTemplateString } = await parseMarkdownToMdastAndParseMetadata(await loadFile(templateFilename))
			const metadata = { ...(postTemplateMetadata || {}), ...(postMetadata || {}) }
			const postWrappedHtml = postTemplateMetadata?.markdown === false
				? await nonMarkdownRenderer({
					filename: postFilename,
					templateString: postTemplateString,
					metadata,
					innerHtml: postHtml,
				})
				: await convertMdastToHtml(tree, postFilename)
			return { html: postWrappedHtml, metadata }
		},
	}
}
