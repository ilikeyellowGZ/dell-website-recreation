export const serviceSlugs = [
  'hardware-support', 'software-solutions', 'networking-services', 'pc-desktop-support',
  'microsoft-365-support', 'cctv-security', 'printer-services', 'website-development',
] as const

export type ServiceSlug = (typeof serviceSlugs)[number]

type ServiceProcessStep = { title: string; description: string }
type ServiceBenefit = { title: string; description: string }

export type ServiceRecord = {
  slug: ServiceSlug
  title: string
  homeTitle: string
  summary: string
  alt: string
  imageIndex: number
  metaTitle: string
  heroLead: string
  overview: readonly string[]
  capabilities: readonly string[]
  benefits: readonly ServiceBenefit[]
  process: readonly [ServiceProcessStep, ServiceProcessStep, ServiceProcessStep]
  relatedSlugs: readonly ServiceSlug[]
}

export const serviceCatalogue = [
  {
    slug: 'hardware-support',
    title: 'Hardware Support',
    homeTitle: 'Hardware Support',
    summary: 'Repairs, maintenance and upgrades for dependable business equipment.',
    alt: 'A technician repairing computer hardware inside a server rack',
    imageIndex: 0,
    metaTitle: 'Hardware Support | Gauvis Technology Holdings',
    heroLead: 'Keep business-critical computers and equipment dependable with practical hardware support.',
    overview: [
      'Unreliable equipment slows teams down and turns small faults into expensive interruptions. Gauvis helps businesses identify hardware problems, restore working systems and plan sensible upgrades.',
      'Support is shaped around the equipment you use and the way your team works, from individual workstations to wider office hardware requirements.',
    ],
    capabilities: ['Hardware fault assessment', 'Computer repairs and component replacement', 'Memory and storage upgrades', 'New device setup and configuration', 'Preventive maintenance guidance'],
    benefits: [
      { title: 'Less disruption', description: 'Resolve equipment issues before they keep people from doing their work.' },
      { title: 'Better device life', description: 'Use maintenance and targeted upgrades to get more value from existing equipment.' },
      { title: 'Practical decisions', description: 'Understand when repair, upgrade or replacement is the sensible next step.' },
    ],
    process: [
      { title: 'Assess', description: 'We review the affected hardware, symptoms and business impact.' },
      { title: 'Deliver', description: 'We agree on the appropriate repair or upgrade and configure the equipment for use.' },
      { title: 'Support', description: 'We confirm operation and help you plan any follow-up maintenance.' },
    ],
    relatedSlugs: ['pc-desktop-support', 'networking-services', 'printer-services'],
  },
  {
    slug: 'software-solutions',
    title: 'Software Solutions',
    homeTitle: 'Software Solutions',
    summary: 'Development, testing and business applications shaped around how your team works.',
    alt: 'Code displayed on a development workstation',
    imageIndex: 1,
    metaTitle: 'Software Solutions | Gauvis Technology Holdings',
    heroLead: 'Turn a business requirement into software that fits the work your team actually does.',
    overview: [
      'When existing tools create extra steps or leave gaps, a considered software solution can bring the process together. Gauvis helps define requirements and develop business applications around practical needs.',
      'From integration and testing to deployment support, we focus on making the path from an idea to a usable application clear.',
    ],
    capabilities: ['Requirements review', 'Business application development', 'System integration', 'Software testing', 'Deployment support'],
    benefits: [
      { title: 'Closer process fit', description: 'Shape applications around the tasks and information your team handles.' },
      { title: 'Fewer manual hand-offs', description: 'Connect steps and systems where repeated transfers slow work down.' },
      { title: 'Clearer route to release', description: 'Move from requirements through testing and deployment with defined steps.' },
    ],
    process: [
      { title: 'Assess', description: 'We discuss the workflow, users and requirements the solution needs to address.' },
      { title: 'Deliver', description: 'We develop, integrate and test the agreed application or improvements.' },
      { title: 'Support', description: 'We assist with deployment and help your team settle into the solution.' },
    ],
    relatedSlugs: ['microsoft-365-support', 'website-development', 'pc-desktop-support'],
  },
  {
    slug: 'networking-services',
    title: 'Networking Services',
    homeTitle: 'Network Services',
    summary: 'Reliable wired and wireless connectivity for productive, connected teams.',
    alt: 'Network rack with connected blue cables',
    imageIndex: 2,
    metaTitle: 'Networking Services | Gauvis Technology Holdings',
    heroLead: 'Give your team steadier access to the systems and connections they rely on.',
    overview: [
      'A patchy connection can affect every part of the working day. Gauvis assesses business networks, sets up wired and wireless connectivity and investigates problems that interrupt access.',
      'We consider the devices, spaces and working patterns your network must support so the setup is useful now and easier to expand later.',
    ],
    capabilities: ['Network assessment', 'Wired network setup', 'Wireless network setup', 'Network device configuration', 'Connectivity troubleshooting', 'Network expansion planning'],
    benefits: [
      { title: 'Steadier access', description: 'Reduce avoidable connection problems that interrupt everyday work.' },
      { title: 'Better coverage', description: 'Plan wired and wireless access around the areas your team uses.' },
      { title: 'Room to grow', description: 'Make practical provision for added users, devices and workspaces.' },
    ],
    process: [
      { title: 'Assess', description: 'We review your existing connection, coverage needs and network devices.' },
      { title: 'Deliver', description: 'We set up or troubleshoot the agreed wired and wireless connections.' },
      { title: 'Support', description: 'We check connectivity and advise on future network needs.' },
    ],
    relatedSlugs: ['hardware-support', 'pc-desktop-support', 'cctv-security'],
  },
  {
    slug: 'pc-desktop-support',
    title: 'PC & Desktop Support',
    homeTitle: 'PC & End User Support',
    summary: 'Workstation setup, troubleshooting and day-to-day assistance for end users.',
    alt: 'Desktop computers in an office workstation setup',
    imageIndex: 3,
    metaTitle: 'PC & Desktop Support | Gauvis Technology Holdings',
    heroLead: 'Help people get set up, stay productive and resolve everyday workstation issues.',
    overview: [
      'From a new employee needing a working computer to a fault stopping someone mid-task, desktop issues directly affect the workday. Gauvis supports workstation setup, configuration and troubleshooting.',
      'We help users with the devices and applications they need, with practical assistance that keeps everyday tasks moving.',
    ],
    capabilities: ['Workstation setup', 'Desktop fault troubleshooting', 'User configuration', 'Software installation', 'Device onboarding', 'Ongoing end-user assistance'],
    benefits: [
      { title: 'Faster onboarding', description: 'Prepare devices and user settings so new team members can get started.' },
      { title: 'Fewer interruptions', description: 'Address common workstation problems before they linger across the workday.' },
      { title: 'Consistent setup', description: 'Keep workstations configured for the tasks and tools your team uses.' },
    ],
    process: [
      { title: 'Assess', description: 'We identify the user needs, device state and problems to resolve.' },
      { title: 'Deliver', description: 'We set up, configure or troubleshoot the affected workstations.' },
      { title: 'Support', description: 'We check that users can work and assist with follow-up issues.' },
    ],
    relatedSlugs: ['hardware-support', 'microsoft-365-support', 'printer-services'],
  },
  {
    slug: 'microsoft-365-support',
    title: 'Microsoft 365 Support',
    homeTitle: 'Microsoft 365 Support',
    summary: 'Practical help with Microsoft 365 accounts, email and productivity applications.',
    alt: 'Microsoft 365 productivity application icons',
    imageIndex: 4,
    metaTitle: 'Microsoft 365 Support | Gauvis Technology Holdings',
    heroLead: 'Make everyday email, accounts and productivity tools easier for your team to use.',
    overview: [
      'Account and application problems can hold up communication and collaboration. Gauvis helps businesses set up Microsoft 365 users, email and productivity applications and troubleshoot access issues.',
      'We support onboarding and day-to-day use so people can reach the tools they need with fewer avoidable delays.',
    ],
    capabilities: ['Microsoft 365 account setup', 'Email configuration', 'Productivity application setup', 'Access troubleshooting', 'User onboarding', 'Everyday Microsoft 365 support'],
    benefits: [
      { title: 'Easier collaboration', description: 'Help people use the email and productivity applications they share.' },
      { title: 'Consistent access', description: 'Set up accounts and applications around each user’s working needs.' },
      { title: 'Less time lost', description: 'Resolve account and access problems that interrupt routine tasks.' },
    ],
    process: [
      { title: 'Assess', description: 'We review your accounts, applications and the access issue or setup need.' },
      { title: 'Deliver', description: 'We configure users, email and productivity tools as agreed.' },
      { title: 'Support', description: 'We help users settle in and troubleshoot ongoing access questions.' },
    ],
    relatedSlugs: ['pc-desktop-support', 'software-solutions', 'networking-services'],
  },
  {
    slug: 'cctv-security',
    title: 'CCTV & Security',
    homeTitle: 'CCTV & Security',
    summary: 'Camera installation and security-system setup for better visibility around your premises.',
    alt: 'CCTV security camera mounted indoors',
    imageIndex: 5,
    metaTitle: 'CCTV & Security | Gauvis Technology Holdings',
    heroLead: 'Plan and set up camera coverage that fits the spaces you need to monitor.',
    overview: [
      'Camera placement and system configuration matter as much as the devices themselves. Gauvis helps assess a site, plan coverage and install CCTV equipment for business premises.',
      'We configure recording and viewing options, check the setup and show you how to access the system in everyday use.',
    ],
    capabilities: ['Site assessment', 'Camera placement planning', 'Camera installation', 'Recorder configuration', 'Remote-viewing setup', 'Security-system checks'],
    benefits: [
      { title: 'Clearer coverage', description: 'Position cameras around the areas that matter to your premises.' },
      { title: 'Easier monitoring', description: 'Configure recording and viewing so the system is practical to use.' },
      { title: 'Site-matched setup', description: 'Choose a layout and configuration based on the space and its needs.' },
    ],
    process: [
      { title: 'Assess', description: 'We review the premises and the areas you want to monitor.' },
      { title: 'Deliver', description: 'We install cameras and configure recording and viewing.' },
      { title: 'Support', description: 'We check the system and help you understand its everyday operation.' },
    ],
    relatedSlugs: ['networking-services', 'hardware-support', 'microsoft-365-support'],
  },
  {
    slug: 'printer-services',
    title: 'Printer Services',
    homeTitle: 'Printer Services',
    summary: 'Printer installation, connectivity, troubleshooting and repair assistance.',
    alt: 'Office printer in a business workspace',
    imageIndex: 6,
    metaTitle: 'Printer Services | Gauvis Technology Holdings',
    heroLead: 'Keep shared and individual printers accessible when your team needs them.',
    overview: [
      'Printer faults and connection issues can stall routine documents and shared workflows. Gauvis helps install printers, connect them to users and networks, and diagnose printing problems.',
      'We assist with configuration and maintenance and help you decide whether a repair or replacement is the practical next step.',
    ],
    capabilities: ['Printer installation', 'Network printer connectivity', 'Driver configuration', 'Print fault diagnosis', 'Device setup', 'Maintenance assistance'],
    benefits: [
      { title: 'Fewer interruptions', description: 'Address print issues that hold up routine business tasks.' },
      { title: 'Consistent team access', description: 'Set up shared printers so the right users can reach them.' },
      { title: 'Practical decisions', description: 'Get guidance on when to repair or replace a troublesome device.' },
    ],
    process: [
      { title: 'Assess', description: 'We review the printer, connection and symptoms affecting users.' },
      { title: 'Deliver', description: 'We install, configure or troubleshoot the agreed printer setup.' },
      { title: 'Support', description: 'We confirm printing works and advise on maintenance or replacement.' },
    ],
    relatedSlugs: ['pc-desktop-support', 'hardware-support', 'networking-services'],
  },
  {
    slug: 'website-development',
    title: 'Website Development',
    homeTitle: 'Website Development',
    summary: 'Responsive business websites that communicate clearly across phones and desktops.',
    alt: 'Monitor displaying a Gauvis Tech business website',
    imageIndex: 7,
    metaTitle: 'Website Development | Gauvis Technology Holdings',
    heroLead: 'Give visitors a clear, usable view of your business on every screen size.',
    overview: [
      'A business website should make it easy to understand what you offer and how to get in touch. Gauvis helps plan and build responsive sites with clear structure and content.',
      'We bring together frontend development, content integration and browser testing, then assist with launch and improvements as your needs change.',
    ],
    capabilities: ['Discovery and planning', 'Information architecture', 'Responsive frontend development', 'Content integration', 'Browser testing', 'Launch support', 'Ongoing website improvements'],
    benefits: [
      { title: 'Clearer digital presence', description: 'Explain your services and business with a site visitors can navigate.' },
      { title: 'Cross-device consistency', description: 'Give phone and desktop visitors a usable experience.' },
      { title: 'Easier enquiries', description: 'Create a clear route for potential customers to contact your team.' },
    ],
    process: [
      { title: 'Assess', description: 'We discuss your audience, content and the goals of the site.' },
      { title: 'Deliver', description: 'We build, integrate content and test the responsive website.' },
      { title: 'Support', description: 'We help with launch and plan useful improvements over time.' },
    ],
    relatedSlugs: ['software-solutions', 'microsoft-365-support', 'cctv-security'],
  },
] satisfies readonly ServiceRecord[]

const servicesBySlug = new Map<ServiceSlug, ServiceRecord>(serviceCatalogue.map((service) => [service.slug, service]))

export function getServiceBySlug(slug: string | undefined): ServiceRecord | undefined {
  return slug ? servicesBySlug.get(slug as ServiceSlug) : undefined
}

export function serviceHref(slug: ServiceSlug): string {
  return `/services/${slug}`
}
