import { glob } from 'glob'
import { remark } from 'remark'
import { read } from 'to-vfile'
import { visit } from 'unist-util-visit'
import { isLink } from './filter'

async function extract() {
	const files = await glob('dist/**/*.mdoc')
	const links = await Promise.all(files.map(extractFile))
	console.log([...new Set(links.flatMap((l) => l))])
}

async function extractFile(filePath: string) {
	const content = await read(filePath)
	const links: string[] = []

	await remark()
		.use(() => {
			return (tree, file) => {
				visit(tree, (node, index, parent) => {
					if (isLink(node) && node.url.startsWith('//pastebin')) {
						links.push(`https:${node.url}`)
					}
				})
			}
		})
		.process(content)

	return links
}

extract()
