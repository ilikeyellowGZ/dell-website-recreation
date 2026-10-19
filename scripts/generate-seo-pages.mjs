import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cwd } from 'node:process'

const root = cwd()
const dist = join(root, 'dist')
const shell = await readFile(join(dist, 'index.html'), 'utf8')
const origin = 'https://gauvistech.com'

const pages = [
  ['/about', 'About Gauvis | Technology Partner for South Africa', 'Learn about Gauvis Technology Holdings, a practical technology partner helping South African businesses use dependable IT solutions.'],
  ['/services', 'Services | Gauvis Technology Holdings', 'Explore GuavisTech hardware, software, networking, Microsoft 365, CCTV, printer, desktop support and website development services.'],
  ['/solutions', 'Solutions | Gauvis Technology Holdings', 'See how GuavisTech combines technology services into practical solutions shaped around South African business needs.'],
  ['/faq', 'FAQ | Gauvis Technology Holdings', 'Find answers about GuavisTech IT services, support, project enquiries and service delivery across South Africa.'],
  ['/contact', 'Contact Gauvis | Request an IT Quote', 'Contact GuavisTech to discuss an IT support, networking, software, CCTV, printer, hardware or website development requirement.'],
  ['/services/hardware-support', 'Hardware Support | Gauvis Technology Holdings', 'Repairs, maintenance and upgrades for dependable business equipment.'],
  ['/services/software-solutions', 'Software Solutions | Gauvis Technology Holdings', 'Development, testing and business applications shaped around how your team works.'],
  ['/services/networking-services', 'Networking Services | Gauvis Technology Holdings', 'Reliable wired and wireless connectivity for productive, connected teams.'],
  ['/services/pc-desktop-support', 'PC & Desktop Support | Gauvis Technology Holdings', 'Workstation setup, troubleshooting and day-to-day assistance for end users.'],
  ['/services/microsoft-365-support', 'Microsoft 365 Support | Gauvis Technology Holdings', 'Practical help with Microsoft 365 accounts, email and productivity applications.'],
  ['/services/cctv-security', 'CCTV & Security | Gauvis Technology Holdings', 'Camera installation and security-system setup for better visibility around your premises.'],
  ['/services/printer-services', 'Printer Services | Gauvis Technology Holdings', 'Printer installation, connectivity, troubleshooting and repair assistance.'],
  ['/services/website-development', 'Website Development | Gauvis Technology Holdings', 'Responsive business websites that communicate clearly across phones and desktops.'],
]

const replaceContent = (html, pattern, value) => html.replace(pattern, (_, prefix, suffix) => `${prefix}${value}${suffix}`)

for (const [path, title, description] of pages) {
  const canonical = `${origin}${path}`
  let html = shell.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
  html = replaceContent(html, /(<meta\s+name="description"\s+content=")[^"]*("\s*\/?>)/, description)
  html = replaceContent(html, /(<meta\s+property="og:title"\s+content=")[^"]*("\s*\/?>)/, title)
  html = replaceContent(html, /(<meta\s+property="og:description"\s+content=")[^"]*("\s*\/?>)/, description)
  html = replaceContent(html, /(<meta\s+property="og:url"\s+content=")[^"]*("\s*\/?>)/, canonical)
  html = replaceContent(html, /(<meta\s+name="twitter:title"\s+content=")[^"]*("\s*\/?>)/, title)
  html = replaceContent(html, /(<meta\s+name="twitter:description"\s+content=")[^"]*("\s*\/?>)/, description)
  html = replaceContent(html, /(<link\s+rel="canonical"\s+href=")[^"]*("\s*\/?>)/, canonical)
  const segments = path.slice(1).split('/')
  const filename = `${segments.pop()}.html`
  const directory = join(dist, ...segments)
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, filename), html)
}

for (const path of ['/admin/login', '/admin/enquiries']) {
  let html = replaceContent(shell, /(<meta\s+name="robots"\s+content=")[^"]*("\s*\/?>)/, 'noindex,nofollow')
  html = html.replace(/<title>[^<]*<\/title>/, '<title>Restricted Admin | GuavisTech</title>')
  const segments = path.slice(1).split('/')
  const filename = `${segments.pop()}.html`
  const directory = join(dist, ...segments)
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, filename), html)
}
