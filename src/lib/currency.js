import { createContext, useContext } from 'react'

export const supportedCurrencies = [
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'USD', symbol: '$' },
]

export const CurrencyContext = createContext(null)

export function useCurrency() {
  const context = useContext(CurrencyContext)

  if (!context) {
    throw new Error('useCurrency must be used inside CurrencyProvider.')
  }

  return context
}
