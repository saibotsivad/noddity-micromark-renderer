import { load, JSON_SCHEMA } from 'js-yaml'

const SIMPLE_STYLE = /^\w+:\s\S/

export const metadataMdastMutator = ({ mdastTree }) => {
	const hasSimpleStyleMetadata = mdastTree?.children?.[0]?.type === 'paragraph'
		&& mdastTree?.children?.[0]?.children?.length === 1
		&& mdastTree.children[0].children[0].type === 'text'
		&& mdastTree.children[0].children[0].value
		&& SIMPLE_STYLE.test(mdastTree.children[0].children[0].value)
	if (mdastTree?.children?.[0]?.type === 'yaml' || hasSimpleStyleMetadata) {
		let value = hasSimpleStyleMetadata
			? mdastTree.children[0].children[0].value
			: mdastTree.children[0].value
		try {
			const metadata = load(value, { schema: JSON_SCHEMA })
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
