import { Link, Node } from 'mdast'

export function isLink(node: Node): node is Link {
	return node.type === 'link'
}

export function isLocalLink(node: Link) {
	return (
		isLink(node) &&
		node.url.startsWith('/') &&
		!node.url.startsWith('//') &&
		!node.url.startsWith('/User:') &&
		!node.url.startsWith('/File:') &&
		!node.url.startsWith('/Special:') &&
		!node.url.startsWith('/Template:') &&
		!node.url.startsWith('/Images:') &&
		!node.url.startsWith('/Category:') &&
		!node.url.startsWith('/index.php')
	)
}

export function isRejected(
	promise: PromiseSettledResult<any>,
): promise is PromiseRejectedResult {
	return promise.status === 'rejected'
}
