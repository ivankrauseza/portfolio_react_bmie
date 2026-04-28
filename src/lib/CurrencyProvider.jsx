import { useCallback, useEffect, useMemo, useState } from 'react'
import { CurrencyContext, supportedCurrencies } from './currency.js'

const currencySessionKey = 'sparrow.currency'
const rateSessionKey = 'sparrow.currencyRates'

function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(loadSessionCurrency)
  const [rates, setRates] = useState(loadSessionRates)
  const [rateError, setRateError] = useState('')

  const hasRate = currency === 'EUR' || Boolean(rates[currency]?.rate)
  const rate = hasRate ? (rates[currency]?.rate ?? 1) : 1
  const needsRate = currency !== 'EUR' && !rates[currency]?.rate

  const setCurrency = useCallback((nextCurrency) => {
    const supportedCurrency = supportedCurrencies.some(
      (item) => item.code === nextCurrency,
    )

    if (!supportedCurrency) {
      return
    }

    setCurrencyState(nextCurrency)
    setRateError('')
    saveSessionCurrency(nextCurrency)
  }, [])

  useEffect(() => {
    if (currency === 'EUR' || rates[currency]?.rate) {
      return undefined
    }

    let active = true

    fetch(`https://api.frankfurter.dev/v2/rate/EUR/${currency}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Exchange rate could not be loaded.')
        }

        return response.json()
      })
      .then((data) => {
        if (!active || !data.rate) {
          return
        }

        setRates((currentRates) => {
          const nextRates = {
            ...currentRates,
            [currency]: {
              date: data.date,
              rate: data.rate,
            },
          }

          saveSessionRates(nextRates)
          return nextRates
        })
        setRateError('')
      })
      .catch(() => {
        if (active) {
          setRateError('Using EUR pricing until the exchange rate loads.')
        }
      })

    return () => {
      active = false
    }
  }, [currency, rates])

  const formatMoney = useCallback(
    (eurAmount, options = {}) => {
      const convertedAmount = Number(eurAmount ?? 0) * rate
      const displayCurrency = hasRate ? currency : 'EUR'

      return new Intl.NumberFormat('en-IE', {
        currency: displayCurrency,
        maximumFractionDigits: options.maximumFractionDigits ?? 2,
        minimumFractionDigits: options.minimumFractionDigits ?? 0,
        style: 'currency',
      }).format(convertedAmount)
    },
    [currency, hasRate, rate],
  )

  const visibleRateError = hasRate ? '' : rateError
  const isLoadingRate = needsRate && !visibleRateError

  const value = useMemo(
    () => ({
      currency,
      formatMoney,
      hasRate,
      isLoadingRate,
      rate,
      rateDate: rates[currency]?.date ?? '',
      rateError: visibleRateError,
      setCurrency,
      supportedCurrencies,
    }),
    [
      currency,
      formatMoney,
      hasRate,
      isLoadingRate,
      rate,
      rates,
      visibleRateError,
      setCurrency,
    ],
  )

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  )
}

function loadSessionCurrency() {
  try {
    const storedCurrency = window.sessionStorage.getItem(currencySessionKey)
    const supportedCurrency = supportedCurrencies.some(
      (currency) => currency.code === storedCurrency,
    )

    return supportedCurrency ? storedCurrency : 'EUR'
  } catch {
    return 'EUR'
  }
}

function saveSessionCurrency(currency) {
  try {
    window.sessionStorage.setItem(currencySessionKey, currency)
  } catch {
    // Session storage can be unavailable in private or restricted contexts.
  }
}

function loadSessionRates() {
  try {
    const storedRates = window.sessionStorage.getItem(rateSessionKey)

    return storedRates ? JSON.parse(storedRates) : {}
  } catch {
    return {}
  }
}

function saveSessionRates(rates) {
  try {
    window.sessionStorage.setItem(rateSessionKey, JSON.stringify(rates))
  } catch {
    // Rates are an enhancement; pricing falls back to EUR if storage is blocked.
  }
}

export default CurrencyProvider
