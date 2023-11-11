import { glob } from 'glob'
import { remark } from 'remark'
import fs from 'node:fs'
import { read } from 'to-vfile'
import { visit } from 'unist-util-visit'
import { isLink, isLocalLink, isRejected } from './filter'

async function validate() {
	const files = await glob('dist/**/*.mdoc')
	const results = await Promise.allSettled(files.map(validateFile))
	const rejected = results.filter(isRejected)

	for (const result of rejected) {
		console.log(result.reason)
	}

	if (rejected.length) {
		console.log('🚨 found some broken local links')
		process.exit(1)
	}

	console.log('No problem detected')
}

async function validateFile(filePath: string) {
	const content = await read(filePath)
	const brokenPaths: string[] = []

	await remark()
		.use(() => {
			return (tree, file) => {
				visit(tree, (node, index, parent) => {
					if (isLink(node) && isLocalLink(node)) {
						const [path, _hash] = node.url.split('#')

						try {
							fs.statSync(`./dist${path}.mdoc`)
						} catch {
							brokenPaths.push(path)
						}
					}
				})
			}
		})
		.process(content)

	if (brokenPaths.length) {
		return Promise.reject([filePath, brokenPaths])
	}

	return Promise.resolve()
}

validate()
