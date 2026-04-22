import type { CollectionConfig } from 'payload'

export const GalleryItems: CollectionConfig = {
  slug: 'gallery-items',
  admin: {
    useAsTitle: 'caption',
    defaultColumns: ['caption', 'category', 'wide', 'order'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'caption', type: 'text', required: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Senorita', value: 'senorita' },
        { label: 'Matteo', value: 'matteo' },
        { label: 'Michelle', value: 'michelle' },
        { label: 'Oxygen', value: 'oxygen' },
        { label: 'Štěňata', value: 'stenata' },
        { label: 'Vrhy', value: 'vrhy' },
      ],
    },
    { name: 'photo', type: 'upload', relationTo: 'media', required: true },
    { name: 'wide', type: 'checkbox', defaultValue: false },
    {
      name: 'objectPosition',
      type: 'text',
      defaultValue: 'center center',
      admin: { description: 'CSS object-position pro výřez fotky' },
    },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
