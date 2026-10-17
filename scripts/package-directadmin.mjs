import { cp, copyFile, lstat, mkdir, readdir, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { pathToFileURL, URL } from 'node:url'

export function validateFrontendEnvironment(environment, production = true) {
  const configuredOrigin = environment.VITE_API_BASE_URL
  // An omitted URL is the secure default for a combined Cloudflare deployment:
  // the browser uses same-origin /api. An explicit URL is still fully validated.
  if (!configuredOrigin?.trim()) return undefined

  const configurationError = new Error(
    'VITE_API_BASE_URL must be an absolute API origin without credentials, a path, query, or fragment; HTTPS is required in production.',
  )
  let origin
  try {
    origin = new URL(configuredOrigin)
  } catch {
    throw configurationError
  }

  if (
    configuredOrigin.includes('*') ||
    origin.hostname.includes('*') ||
    origin.origin.includes('*') ||
    (origin.protocol !== 'https:' && (production || origin.protocol !== 'http:')) ||
    origin.username ||
    origin.password ||
    origin.pathname !== '/' ||
    origin.href.includes('?') ||
    origin.href.includes('#')
  ) {
    throw configurationError
  }

  return origin.origin
}

const forbiddenName = /^(?:\.env(?:\..*)?|\.git(?:\..*)?|src|server|scripts|tests?|__tests__|node_modules|package(?:-lock)?\.json)$/i
const forbiddenExtension = /(?:\.(?:map|ts|tsx|jsx|pem|key)|\.(?:test|spec)\.[^.]*)$/i

async function assertSafeTree(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (forbiddenName.test(entry.name) || forbiddenExtension.test(entry.name) || entry.isSymbolicLink()) {
      throw new Error('DirectAdmin release contains forbidden source, secret, test, metadata, source map, or symbolic link content.')
    }
    if (entry.isDirectory()) await assertSafeTree(join(directory, entry.name))
  }
}

async function rejectSymbolicLink(path) {
  try {
    if ((await lstat(path)).isSymbolicLink()) {
      throw new Error('DirectAdmin packaging refuses symbolic link directories.')
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

export async function copyDirectAdminRelease(projectRoot = process.cwd()) {
  const root = resolve(projectRoot)
  const dist = join(root, 'dist')
  const apacheConfig = join(root, 'deploy', 'directadmin', '.htaccess')
  const releaseRoot = join(root, 'release')
  const release = join(releaseRoot, 'directadmin')

  await rejectSymbolicLink(dist)
  if (!(await lstat(join(dist, 'index.html'))).isFile()) {
    throw new Error('Build dist/index.html before packaging the frontend.')
  }
  await assertSafeTree(dist)
  if (!(await lstat(apacheConfig)).isFile()) throw new Error('Missing DirectAdmin .htaccess file.')
  // These fixed, resolved targets are the only directories packaging may recreate.
  await rejectSymbolicLink(releaseRoot)
  await rejectSymbolicLink(release)
  await rm(release, { recursive: true, force: true })
  await mkdir(release, { recursive: true })
  await cp(dist, release, { recursive: true })
  await copyFile(apacheConfig, join(release, '.htaccess'))
  await assertSafeTree(release)
  return release
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { loadEnv } = await import('vite')
    validateFrontendEnvironment(loadEnv('production', process.cwd(), 'VITE_'))
    const release = await copyDirectAdminRelease()
    globalThis.console.info(`DirectAdmin frontend release ready: ${release}`)
  } catch (error) {
    globalThis.console.error(error instanceof Error ? error.message : 'DirectAdmin packaging failed.')
    process.exitCode = 1
  }
}
