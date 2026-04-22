import type { CollectionConfig } from 'payload'

export const Dogs: CollectionConfig = {
  slug: 'dogs',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'gender', 'breed', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'gender',
      type: 'select',
      required: true,
      options: [
        { label: 'Fena', value: 'female' },
        { label: 'Pes', value: 'male' },
      ],
    },
    { name: 'breed', type: 'text', defaultValue: 'Yorkshire teriér' },
    { name: 'titles', type: 'text' },
    { name: 'health', type: 'text', defaultValue: 'V pořádku' },
    { name: 'description', type: 'textarea' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    {
      name: 'achievements',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'detail', type: 'text' },
        {
          name: 'medal',
          type: 'select',
          options: [
            { label: 'Zlato', value: 'gold' },
            { label: 'Stříbro', value: 'silver' },
            { label: 'Bronz', value: 'bronze' },
          ],
        },
      ],
    },
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Pořadí pro zobrazení na webu' },
    },
  ],
}
