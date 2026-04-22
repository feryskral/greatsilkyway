import type { CollectionConfig } from 'payload'

export const Litters: CollectionConfig = {
  slug: 'litters',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'order', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'label', type: 'text', defaultValue: 'Great Silkyway' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'unavailable',
      options: [
        { label: 'Dostupný', value: 'available' },
        { label: 'Nedostupné', value: 'unavailable' },
        { label: 'Rezervované', value: 'reserved' },
      ],
    },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'description', type: 'textarea' },
    { name: 'sire', type: 'text' },
    { name: 'dame', type: 'text' },
    { name: 'dob', type: 'text', admin: { description: 'Datum narození (volný text)' } },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
