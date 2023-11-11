import _slugify from 'slugify'

const manualReplacements = [
	[':', '/'],
	['_', '-'],
]

const decodedReplacements = [
	['%', ''],
	["'", ''],
	['(', ''],
	[')', ''],
]

export function slugify(input: string) {
	try {
		input = decodeURIComponent(input)

		for (const [f, r] of decodedReplacements) {
			while (input.includes(f)) {
				input = input.replace(f, r)
			}
		}
	} catch (e) {
		// whatever hope for the best
	}

	for (const [f, r] of manualReplacements) {
		while (input.includes(f)) {
			input = input.replace(f, r)
		}
	}

	return input
		.split('/')
		.map((segment) =>
			_slugify(segment, {
				replacement: '-',
				lower: true,
				trim: true,
			}),
		)
		.join('/')
}
