export type FaqItem = {
  question: string
  answer: string
}

export type FaqIconKey = 'general' | 'security' | 'billing' | 'support'

export type FaqCategory = {
  id: string
  title: string
  description: string
  icon: FaqIconKey
  questions: FaqItem[]
}

export type FaqSupportCardIconKey = 'support' | 'call' | 'docs'

export type FaqSupportCard = {
  title: string
  icon: FaqSupportCardIconKey
  description: string
  buttonText: string
}

export type FaqData = {
  categories: FaqCategory[]
  supportCards: FaqSupportCard[]
}
