export async function format(input: string) {
	const [{ format }, markdownPlugin] = await Promise.all([
		import('prettier/standalone'),
		import('prettier/plugins/markdown'),
	])

	return format(input, {
		parser: 'markdown',
		singleQuote: true,
		singleAttributePerLine: true,
		semi: false,
		useTabs: true,
		tabWidth: 2,
		plugins: [markdownPlugin],
	})
}
