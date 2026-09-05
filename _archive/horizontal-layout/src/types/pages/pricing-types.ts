export type FeatureValue = boolean | string

export type PricingPlanIconKey = 'sprout' | 'flower' | 'flower2'

export type PricingFeatureIconKey = 'chart-line' | 'rocket' | 'users-round'

export type PricingFeatureItem = {
  name: string
  values: FeatureValue[]
}

export type PricingFeature = {
  category: string
  icon: PricingFeatureIconKey
  features: PricingFeatureItem[]
}

export type PricingPlan = {
  icon: PricingPlanIconKey
  title: string
  price: {
    yearly: number
    monthly: number
  }
  period: string
  buttonText: string
  isPopular?: boolean
}

export type PricingData = {
  plans: PricingPlan[]
  features: PricingFeature[]
}
