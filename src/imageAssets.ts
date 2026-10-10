export type ResponsiveImageAsset = {
  height: number
  src: string
  srcSet: string
  width: number
}

const widths = [480, 768, 1024, 1536] as const

function image(folder: string, name: string): ResponsiveImageAsset {
  const base = `/generated/${folder}/${name}`
  return {
    height: 1024,
    src: `${base}-1536.webp`,
    srcSet: widths.map((width) => `${base}-${width}.webp ${width}w`).join(', '),
    width: 1536,
  }
}

export const pageImages = {
  about: {
    hero: image('about', '01-about-hero'),
    story: image('about', '02-about-story'),
    onsite: image('about', '03-about-onsite'),
    cta: image('about', '04-about-cta'),
  },
  caseStudies: {
    hero: image('case-studies', '01-case-studies-hero'),
    network: image('case-studies', '02-case-studies-network'),
    cctv: image('case-studies', '03-case-studies-cctv'),
    website: image('case-studies', '04-case-studies-website'),
    workstation: image('case-studies', '05-case-studies-workstation'),
    process: image('case-studies', '06-case-studies-process'),
  },
  contact: {
    hero: image('contact', '01-contact-hero'),
  },
  faq: {
    hero: image('faq', '01-faq-hero'),
    cta: image('faq', '02-faq-cta'),
  },
  services: {
    hero: image('services', '01-services-hero'),
    cards: [
      image('services', '02-services-hardware'),
      image('services', '03-services-software'),
      image('services', '04-services-networking'),
      image('services', '05-services-desktop'),
      image('services', '06-services-microsoft-365'),
      image('services', '07-services-cctv'),
      image('services', '08-services-printer'),
      image('services', '09-services-website'),
    ],
    cta: image('services', '10-services-cta'),
  },
  solutions: {
    hero: image('solutions', '01-solutions-hero'),
    approach: image('solutions', '02-solutions-approach'),
  },
} as const

export const brandLogos = [
  { alt: 'Dell', src: '/GauvisTech_individual_images/brand_logos/dell-logo.svg' },
  { alt: 'HP', src: '/GauvisTech_individual_images/brand_logos/hp-logo.svg' },
  { alt: 'Lenovo', src: '/GauvisTech_individual_images/brand_logos/lenovo-logo.svg' },
  { alt: 'Microsoft 365', src: '/GauvisTech_individual_images/brand_logos/microsoft365.png' },
  { alt: 'SAP', src: '/GauvisTech_individual_images/brand_logos/sap.svg' },
  { alt: 'Oracle', src: '/GauvisTech_individual_images/brand_logos/oracle.svg' },
  { alt: 'Cisco', src: '/GauvisTech_individual_images/brand_logos/cisco.svg' },
  { alt: 'ServiceNow', src: '/GauvisTech_individual_images/brand_logos/servicenow.svg' },
] as const
