import { z } from 'zod'

export const knowledgeIngestionSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be 200 characters or fewer'),
  category: z.string().min(1, 'Select a category'),
  tags: z.array(z.string()).min(1, 'Add at least one tag').max(10, 'Maximum 10 tags'),
  file: z
    .custom<File>((val) => val instanceof File, 'A file is required')
    .refine(
      (file) => file.size <= 50 * 1024 * 1024,  // 50 MB
      'File must be smaller than 50 MB'
    )
    .refine(
      (file) => {
        const allowed = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/markdown',
          'text/plain',
        ]
        return allowed.includes(file.type) || file.name.endsWith('.md')
      },
      'Supported formats: PDF, DOCX, Markdown (.md), TXT'
    ),
})

export type KnowledgeIngestionFormValues = z.infer<typeof knowledgeIngestionSchema>
