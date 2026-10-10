import 'dotenv/config'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { generateAdminPassword, generateJwtSecret, hashPassword } from './adminAuth'

const envPath = resolve(process.cwd(), '.env')

function setEnvValue(contents: string, key: string, value: string): string {
  const line = `${key}=${value}`
  const matcher = new RegExp(`^${key}=.*$`, 'm')
  if (matcher.test(contents)) return contents.replace(matcher, line)
  const separator = contents.length > 0 && !contents.endsWith('\n') ? '\n' : ''
  return `${contents}${separator}${line}\n`
}

let envContents: string
try {
  envContents = await readFile(envPath, 'utf8')
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  envContents = ''
}

const username = process.env.ADMIN_USERNAME?.trim() || 'admin'
const password = generateAdminPassword()
const passwordHash = await hashPassword(password)
const jwtSecret = generateJwtSecret()

envContents = setEnvValue(envContents, 'ADMIN_USERNAME', username)
envContents = setEnvValue(envContents, 'ADMIN_PASSWORD_HASH', passwordHash)
envContents = setEnvValue(envContents, 'JWT_SECRET_KEY', jwtSecret)
envContents = setEnvValue(envContents, 'ENABLE_ENQUIRIES', 'false')
envContents = setEnvValue(envContents, 'VITE_ENABLE_ENQUIRIES', 'false')

await writeFile(envPath, envContents, { encoding: 'utf8', mode: 0o600 })

console.info('Admin credentials generated and saved securely in .env.')
console.info(`Username: ${username}`)
console.info(`One-time password: ${password}`)
console.info('Local login URL: http://localhost:4173/admin/login')
console.info('The JWT secret and password hash were intentionally not printed.')
