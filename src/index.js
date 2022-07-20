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

export const noddityRenderer = ({ loadFile, metadataParser, urlRenderer, nonMarkdownRenderer, markdownToMdast, mdastToHast, hastToHtml }) => {
	const mutate = noddityMdastMutator({
		urlRenderer,
		templateResolver: async ({ filename, template, variables }) => {
			return {
				type: 'html',
				value: await loadAndRenderNoddityContent(filename, await loadFile(template), { filename, template, variables }),
			}
		},
	})
	const loadAndRenderNoddityContent = async (filename, markdownString, opts) => {
		const mdastTree = await markdownToMdast(markdownString)

		parseAndSetMetadata({ mdastTree, metadataParser })

		if (mdastTree.children[0].type === 'yaml' && mdastTree.children[0].metadata?.markdown === false) {
			const nonMarkdownString = markdownString.substring(mdastTree.children[0].position.end.offset + 1) // 1 = number of empty lines between metadata and content
			return nonMarkdownRenderer({
				...(opts || {}),
				filename,
				string: nonMarkdownString,
				metadata: mdastTree.children[0].metadata,
			})
		}

		await mutate(mdastTree, filename)
		const hastTree = mdastToHast(mdastTree, { allowDangerousHtml: true })
		return hastToHtml(hastTree, { allowDangerousHtml:true })
	}
	return {
		fromDisk: async filename => loadFile(filename).then(markdownString => loadAndRenderNoddityContent(loadFile, markdownString)),
		fromString: async (virtualFilename, markdownString) => loadAndRenderNoddityContent(virtualFilename, markdownString),
	}
}
