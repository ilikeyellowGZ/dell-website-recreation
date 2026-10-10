import { mkdir, readdir } from 'node:fs/promises'
import { extname, join, parse, relative } from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

const sourceRoot = join(process.cwd(), 'public', 'GauvisTech_individual_images')
const outputRoot = join(process.cwd(), 'public', 'generated')
const targetWidths = [480, 768, 1024, 1536]

async function findPngFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) return findPngFiles(path)
      return extname(entry.name).toLowerCase() === '.png' ? [path] : []
    }),
  )
  return files.flat()
}

const sourceFiles = (await findPngFiles(sourceRoot)).filter((path) => !path.includes(`${join('', 'brand_logos')}`))

for (const sourcePath of sourceFiles) {
  const relativePath = relative(sourceRoot, sourcePath)
  globalThis.console.info(`Processing ${relativePath}`)
  const { dir, name } = parse(relativePath)
  const outputDirectory = join(outputRoot, dir)
  const metadata = await sharp(sourcePath).metadata()
  if (!metadata.width) throw new Error(`Could not read image width: ${relativePath}`)
  await mkdir(outputDirectory, { recursive: true })

  for (const width of targetWidths.filter((candidate) => candidate <= metadata.width)) {
    await sharp(sourcePath, { failOn: 'none' })
      .resize({ width, withoutEnlargement: true })
      .webp({ effort: 5, quality: 80 })
      .toFile(join(outputDirectory, `${name}-${width}.webp`))
  }
}

globalThis.console.info(`Generated responsive WebP derivatives for ${sourceFiles.length} photographs.`)
