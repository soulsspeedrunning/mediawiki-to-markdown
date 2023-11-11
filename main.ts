import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import remarkStringify from 'remark-stringify'
import rehypeRemoveComments from 'rehype-remove-comments'
import remarkGfm from 'remark-gfm'
import * as cheerio from 'cheerio'
import path from 'node:path'
import { visit } from 'unist-util-visit'
import fs from 'node:fs/promises'
import { format } from './prettier'
import redirects from './map'

let downloaded = 0
let cached = 0
let notFound = 0

import { PrismaClient } from '@prisma/client'
import { slugify } from './slugify'
import { isLink, isLocalLink, isRejected } from './filter'

const prisma = new PrismaClient()
const INPUT = 'https://wiki.speedsouls.com'
const OUTPUT = 'dist'
const done = new Set<string>()

async function getHtml(url: string) {
	const cache = await prisma.pageCache.findUnique({
		where: {
			id: url,
		},
	})

	if (cache) {
		cached++
		return cache.body
	}

	const full = `${INPUT}/${url}`
	const resp = await fetch(full)

	if (!resp.ok) {
		throw new Error(resp.statusText)
	}

	const text = await resp.text()
	downloaded++

	await prisma.pageCache.upsert({
		where: {
			id: url,
		},
		update: {
			body: text,
		},
		create: {
			id: url,
			body: text,
		},
	})

	return text
}

async function convert(url: string, ouput: string) {
	if (done.has(url)) return
	done.add(url)

	const html = await getHtml(url)
	const children: Promise<void>[] = []
	const $ = cheerio.load(html)

	$('#toc').remove()

	const h1 = $('#firstHeading')
	const body = $('#mw-content-text')

	const file = await unified()
		.use(rehypeParse) // Parse HTML to a syntax tree
		.use(rehypeRemoveComments) // removes html comments
		.use(remarkGfm) // github flavored markdown
		.use(rehypeRemark) // Turn HTML syntax tree to markdown syntax tree
		.use(() => {
			return (tree, file) => {
				visit(tree, (node, index, parent) => {
					if (isLink(node) && isLocalLink(node)) {
						let originalUrl = node.url
						let withoutSlash = originalUrl.slice(1, originalUrl.length)
						delete node.title

						const [key, hash] = withoutSlash.split('#')
						const to = redirects.get(key)

						if (to) {
							node.url = hash ? `/${to}#${hash}` : `/${to}`
						} else {
							node.url = slugify(node.url)
						}

						children.push(convert(withoutSlash, to ?? withoutSlash))
					}
				})
			}
		})
		.use(remarkStringify) // Serialize HTML syntax tree
		.process(body.toString())

	const markdown = await format(`---
title: "${h1.text()}"
---

${String(file)}`)

	const filePath = `${OUTPUT}/${slugify(ouput)}.mdoc`
	const dirname = path.dirname(filePath)
	await fs.mkdir(dirname, { recursive: true })
	await fs.writeFile(filePath, markdown)

	console.log(`${url} 👉 ${filePath}`)

	await Promise.allSettled(children)
}

export async function sync() {
	await fs.rm(OUTPUT, {
		recursive: true,
		force: true,
	})

	await convert(`Main_Page`, 'index')

	console.log(
		`{ cached: ${cached}, downloaded: ${downloaded}, notFound: ${notFound} }`,
	)
}

sync()
