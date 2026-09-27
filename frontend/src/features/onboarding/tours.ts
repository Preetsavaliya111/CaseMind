export interface TourStep {
  target: string
  title: string
  description: string
}

export const productTours: Record<string, TourStep[]> = {
  main: [
    { target: '[data-tour="home"]', title: 'Your Command Center', description: 'Start here to see what needs attention and continue recent work.' },
    { target: '[data-tour="cases"]', title: 'Cases', description: 'All customer issues live here. Open a case to investigate, collaborate, and resolve it.' },
    { target: '[data-tour="assistant"]', title: 'Ask CaseMind', description: 'Ask questions using previous cases and trusted company knowledge. Every answer shows its sources.' },
    { target: '[data-tour="memory"]', title: 'Organizational Memory', description: 'See proven solutions and lessons that your team can reuse instead of solving the same problem twice.' },
    { target: '[data-tour="knowledge"]', title: 'Knowledge', description: 'Keep trusted guides, known issues, and internal support information in one place.' },
    { target: '[data-tour="global-search"]', title: 'Search everything', description: 'Quickly search cases, solutions, knowledge, and documents from anywhere.' },
  ],
  memory: [
    { target: '[data-tour="memory-intro"]', title: 'Knowledge learned from real work', description: 'Memory preserves useful lessons from solved cases after a person reviews them.' },
    { target: '[data-tour="memory-filters"]', title: 'Find the right lesson', description: 'Browse known solutions, root causes, workarounds, and items that still need review.' },
  ],
  knowledge: [
    { target: '[data-tour="knowledge-intro"]', title: 'Trusted team guidance', description: 'Knowledge articles are curated instructions your team can review and publish.' },
    { target: '[data-tour="knowledge-search"]', title: 'Find guidance quickly', description: 'Search titles and content using the words your team naturally uses.' },
  ],
  assistant: [
    { target: '[data-tour="assistant-intro"]', title: 'Ask in plain language', description: 'Ask how similar problems were solved or what your trusted documentation recommends.' },
    { target: '[data-tour="assistant-sources"]', title: 'Answers show their sources', description: 'Open any source to verify the recommendation before you act.' },
  ],
}
