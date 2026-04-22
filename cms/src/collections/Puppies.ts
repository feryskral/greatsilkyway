import type { CollectionConfig } from 'payload'

export const Puppies: CollectionConfig = {
  slug: 'puppies',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'gender', 'status', 'litter', 'order'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'gender',
      type: 'select',
      required: true,
      options: [
        { label: 'Fena', value: 'female' },
        { label: 'Pes', value: 'male' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'available',
      options: [
        { label: 'Volné', value: 'available' },
        { label: 'Rezervované', value: 'reserved' },
        { label: 'Prodané', value: 'sold' },
      ],
    },
    { name: 'breed', type: 'text', defaultValue: 'Yorkshire teriér' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'litter', type: 'relationship', relationTo: 'litters' },
    { name: 'description', type: 'textarea' },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
