import { noddityMdastMutator } from 'mdast-util-noddity'

export const noddityRenderer = ({
	loadFile,
	metadataMdastMutator,
	urlRenderer,
	nonMarkdownRenderer,
	markdownToMdast,
	mdastToHast,
	hastToHtml,
}) => {
	const parseMarkdownToMdastAndParseMetadata = async (filename, markdownString) => {
		const mdastTree = await markdownToMdast(markdownString)
		if (metadataMdastMutator) await metadataMdastMutator({ filename, mdastTree })
		const metadata = mdastTree.children[0].metadata
		const metadataCharsOffset = metadata && mdastTree.children[0].position.end.offset
		if (metadata) mdastTree.children.shift()
		return {
			tree: mdastTree,
			contentString: metadataCharsOffset
				// 1 = number of empty lines between metadata and content
				? markdownString.substring(metadataCharsOffset + 1)
				: markdownString,
			metadata,
		}
	}
	const convertMdastToHtml = async (mdastTree, filename, { site, metadata }) => {
		await noddityMdastMutator({
			urlRenderer,
			templateResolver: async ({ template, variables }) => {
				const { html } = await loadAndRenderNoddityContent(
					template,
					await loadFile(template),
					{ variables, site, metadata },
				)
				return {
					type: 'html',
					value: html,
				}
			},
		})(mdastTree, filename)

		const hastTree = mdastToHast(mdastTree, { site, metadata })
		return hastToHtml(hastTree)
	}
	const loadAndRenderNoddityContent = async (filename, markdownString, opts) => {
		let { tree, metadata, contentString } = await parseMarkdownToMdastAndParseMetadata(filename, markdownString)
		if (!metadata) metadata = {}
		if (opts?.metadata) Object.assign(metadata, opts.metadata)
		const html = metadata?.markdown === false && nonMarkdownRenderer
			? await nonMarkdownRenderer({
				...(opts || {}),
				filename,
				metadata,
				templateString: contentString,
			})
			: await convertMdastToHtml(tree, filename, { site: opts?.site, metadata, variables: opts?.variables })
		return { html, metadata }
	}
	return {
		fromString: async (markdownString, options) => loadAndRenderNoddityContent(
			options?.filename || 'VIRTUAL_FILE.md',
			markdownString,
			{ site: options?.site, metadata: options?.metadata, variables: options?.variables },
		),
		loadFile: async (filename, options) => loadFile(filename)
			.then(markdownString => loadAndRenderNoddityContent(
				filename,
				markdownString,
				{ site: options?.site, metadata: options?.metadata, variables: options?.variables },
			)),
		loadMetadata: async filename => {
			const { metadata } = await parseMarkdownToMdastAndParseMetadata(filename, await loadFile(filename))
			return metadata
		},
		loadPost: async (templateFilename, postFilename, { site, metadata: loaderMetadata, variables } = {}) => {
			const { html: postHtml, metadata: postMetadata } = await loadAndRenderNoddityContent(postFilename, await loadFile(postFilename), { site, metadata: loaderMetadata, variables })
			const { tree, metadata: postTemplateMetadata, contentString: postTemplateString } = await parseMarkdownToMdastAndParseMetadata(templateFilename, await loadFile(templateFilename))
			const metadata = { ...(postTemplateMetadata || {}), ...(postMetadata || {}) }
			const postWrappedHtml = postTemplateMetadata?.markdown === false
				? await nonMarkdownRenderer({
					filename: postFilename,
					templateString: postTemplateString,
					metadata,
					innerHtml: postHtml,
				})
				: await convertMdastToHtml(tree, postFilename, { site, metadata, variables })
			return { html: postWrappedHtml, metadata }
		},
	}
}
