import type { GlobalConfig } from 'payload'

export const SiteInfo: GlobalConfig = {
  slug: 'site-info',
  access: {
    read: () => true,
  },
  fields: [
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text', admin: { description: 'Ve tvaru +420 777 12 34 56' } },
    { name: 'address', type: 'text' },
    { name: 'facebookUrl', type: 'text' },
    { name: 'instagramUrl', type: 'text' },
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'title1', type: 'text', defaultValue: 'Krásní Yorkshire teriéři' },
        { name: 'title2', type: 'text', defaultValue: 's láskou a péčí' },
        { name: 'description', type: 'textarea' },
      ],
    },
    { name: 'footerTagline', type: 'textarea' },
  ],
}
