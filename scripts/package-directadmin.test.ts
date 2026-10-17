// @vitest-environment node
import { mkdtemp, mkdir, readFile, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { copyDirectAdminRelease, validateFrontendEnvironment } from './package-directadmin.mjs'

const temporaryRoots: string[] = []

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'gauvis-directadmin-'))
  temporaryRoots.push(root)
  await mkdir(join(root, 'dist', 'assets'), { recursive: true })
  await mkdir(join(root, 'deploy', 'directadmin'), { recursive: true })
  await writeFile(join(root, 'dist', 'index.html'), '<html>Built frontend</html>')
  await writeFile(join(root, 'dist', 'assets', 'index-abc123.js'), 'console.info("frontend")')
  await writeFile(join(root, 'deploy', 'directadmin', '.htaccess'), 'Options -Indexes\n')
  return root
}

describe('production frontend environment validation', () => {
  it.each([
    '*', 'not-a-url', '//api.example.com',
    'http://api.example.com', 'ftp://api.example.com',
    'https://api.example.com/path', 'https://user:password@api.example.com',
    'https://api.example.com?query=value', 'https://api.example.com?',
    'https://api.example.com#fragment', 'https://api.example.com#',
    'https://*', 'https://*.example.com', 'https://api.*.example.com',
    'https://api*.example.com/', 'https://%2A.example.com',
    'https://%2a.example.com', 'https://api%2A.example.com/',
  ])('rejects an invalid explicit API origin %s', (origin) => {
    expect(() => validateFrontendEnvironment({ VITE_API_BASE_URL: origin })).toThrow(/VITE_API_BASE_URL/)
  })

  it.each([undefined, '', ' '])('uses same-origin API calls when the origin is omitted (%s)', (origin) => {
    expect(validateFrontendEnvironment({ VITE_API_BASE_URL: origin })).toBeUndefined()
  })

  it('accepts and normalizes an HTTPS API origin', () => {
    expect(validateFrontendEnvironment({ VITE_API_BASE_URL: 'https://GAUVIS-API.onrender.com:443/' }))
      .toBe('https://gauvis-api.onrender.com')
  })

  it('keeps local development compatible with the proxy and HTTP API origins', () => {
    expect(validateFrontendEnvironment({}, false)).toBeUndefined()
    expect(validateFrontendEnvironment({ VITE_API_BASE_URL: 'http://localhost:3001/' }, false))
      .toBe('http://localhost:3001')
  })
})

describe('DirectAdmin release packaging', () => {
  it('copies only built files and the maintained Apache dotfile, replacing only its own release', async () => {
    const root = await fixture()
    await mkdir(join(root, 'release', 'directadmin'), { recursive: true })
    await writeFile(join(root, 'release', 'directadmin', 'stale.html'), 'stale')
    await writeFile(join(root, 'release', 'keep.txt'), 'other release')
    for (const name of ['.env', '.git', 'server', 'src', 'tests']) {
      await writeFile(join(root, name), 'must stay outside the artifact')
    }

    const release = await copyDirectAdminRelease(root)

    expect(release).toBe(join(root, 'release', 'directadmin'))
    expect((await readdir(release)).sort()).toEqual(['.htaccess', 'assets', 'index.html'])
    expect(await readFile(join(release, 'index.html'), 'utf8')).toBe('<html>Built frontend</html>')
    expect(await readFile(join(release, 'assets', 'index-abc123.js'), 'utf8')).toBe('console.info("frontend")')
    expect(await readFile(join(release, '.htaccess'), 'utf8')).toBe('Options -Indexes\n')
    expect(await readFile(join(root, 'release', 'keep.txt'), 'utf8')).toBe('other release')
    expect(await readFile(join(root, '.env'), 'utf8')).toBe('must stay outside the artifact')
  })

  it.each([
    '.env', '.env.production', '.git/config', 'server/index.js', 'src/App.tsx',
    'tests/api.test.js', 'assets/main.js.map', 'assets/debug.ts', 'assets/main.test.js',
    'node_modules/package/index.js', 'package.json',
  ])('rejects forbidden build output %s before publishing a release', async (name) => {
    const root = await fixture()
    const target = join(root, 'dist', name)
    await mkdir(join(target, '..'), { recursive: true })
    await writeFile(target, 'must not deploy')

    await expect(copyDirectAdminRelease(root)).rejects.toThrow(/forbidden/i)
    await expect(readdir(join(root, 'release', 'directadmin'))).rejects.toThrow()
  })

  it('requires a successful frontend build before replacing an existing release', async () => {
    const root = await fixture()
    await rm(join(root, 'dist', 'index.html'))
    await mkdir(join(root, 'release', 'directadmin'), { recursive: true })
    await writeFile(join(root, 'release', 'directadmin', 'previous.html'), 'previous')

    await expect(copyDirectAdminRelease(root)).rejects.toThrow(/index.html/)
    expect(await readFile(join(root, 'release', 'directadmin', 'previous.html'), 'utf8')).toBe('previous')
  })

  it('rejects symbolic links in built content', async () => {
    const root = await fixture()
    await mkdir(join(root, 'private'))
    await writeFile(join(root, 'private', '.env'), 'must not deploy')
    await symlink(join(root, 'private'), join(root, 'dist', 'assets', 'private'), 'junction')

    await expect(copyDirectAdminRelease(root)).rejects.toThrow(/forbidden/i)
  })

  it('rejects a symbolic link used as the build directory', async () => {
    const root = await fixture()
    await rename(join(root, 'dist'), join(root, 'external-build'))
    await symlink(join(root, 'external-build'), join(root, 'dist'), 'junction')

    await expect(copyDirectAdminRelease(root)).rejects.toThrow(/symbolic link/i)
  })

  it.each(['release', 'release/directadmin'])('refuses to recreate a release through a %s symbolic link', async (link) => {
    const root = await fixture()
    await mkdir(join(root, 'external', 'directadmin'), { recursive: true })
    await writeFile(join(root, 'external', 'directadmin', 'keep.txt'), 'external release')
    if (link.endsWith('directadmin')) await mkdir(join(root, 'release'))
    await symlink(join(root, 'external'), join(root, link), 'junction')

    await expect(copyDirectAdminRelease(root)).rejects.toThrow(/symbolic link/i)
    expect(await readFile(join(root, 'external', 'directadmin', 'keep.txt'), 'utf8')).toBe('external release')
  })
})
