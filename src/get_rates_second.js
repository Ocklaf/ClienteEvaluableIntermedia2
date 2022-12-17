
import fetch from 'node-fetch'

const host = 'https://api.frankfurter.app'
const wwwError = 'No se han podido obtener las divisas'

function errorManage(errorMessage) {
  let isStatusOrSystemError = typeof errorMessage === 'number' || errorMessage.type === 'system'

  if (isStatusOrSystemError) {
    
    return wwwError
  }

  return errorMessage
}

function obtainADate(date, addOrSubstractDays) {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + addOrSubstractDays)

  return newDate
}

function YYYYMMDD(date) {

  return date.toISOString().slice(0, 10)
}

function prepareString(string) {

  return string.trim().toLowerCase()
}

function searchCurrency(jsonCurrencies, stringForSearch) {
  for (let currency in jsonCurrencies) {
    let currencyName = prepareString(jsonCurrencies[currency])
    if (currencyName.includes(stringForSearch)) {

      return currency
    }
  }
  throw `No se ha encontrado ninguna divisa con el nombre ${stringForSearch}`
}

async function fetchConcurrencies() {
  return fetch(`${host}/currencies`)
    .then(response => {
      if (response.status !== 200) {
        throw (response.status)
      }
      return response.json()
    })
}

async function obtainCurrency(currencyString) {
  let jsonCurrencies = await fetchConcurrencies()
  let stringForSearch = prepareString(currencyString)

  return searchCurrency(jsonCurrencies, stringForSearch)
}

function calculateFirstDate(endDate, weeks) {
  let totalDaysBefore = ((weeks - 1) * 7) * - 1
  let date = obtainADate(endDate, totalDaysBefore)

  return date
}

function datesAscendentOrder(endDate, weeks) {
  let dates = []
  let firstDate = calculateFirstDate(endDate, weeks)

  for (let weeksElapsed = 0; weeksElapsed < weeks; weeksElapsed++) {
    let date = obtainADate(firstDate, weeksElapsed * 7)
    dates.push(YYYYMMDD(date))
  }

  return dates
}

function outOfDate(startDate, fetchDate) {
  let limit2days = obtainADate(new Date(startDate), -2)

  return new Date(fetchDate) < limit2days
}

function searchMin(json, date) {
  // let nose = Object.entries(json.rates)
  // console.log(nose)
  let min = Math.min(...Object.values(json.rates))
  let currency = Object.keys(json.rates).find(key => json.rates[key] === min)

  return { date, currency, min }
}

async function obtainMin(date, startDate, currency) {
  let urlMin = `${host}/${date}?from=${currency}`
  let result = fetch(urlMin)
    .then(response => {
      if (response.status !== 200) throw (response.status)

      return response.json()
    })
    .then(json => {
      if (date === startDate && outOfDate(startDate, json.date)) {
        throw `No se ha podido obtener el cambio para la divisa ${currency} el día ${date}: El cambio no pertenece a la fecha solicitada`
      }

      return searchMin(json, date)
    })

  return result
}

async function obtainExchange(json, date) {
  let yesterdayDate = obtainADate(date, -1)
  yesterdayDate = YYYYMMDD(yesterdayDate)
  let url = `${host}/${yesterdayDate}?from=${json.currency}&to=EUR`

  let resultado = fetch(url)
    .then(response => {
      if (response.status !== 200) throw response.status
      return response.json()
    })
    .then(response => {
      return { day: date, min: { currency: response.base, EUR: response.rates.EUR } }
    })

  return resultado
}

async function parallelActions(dates, currency) {
  let startDate = dates.at(-1)
  let promises = []

  dates.forEach(date => {
    promises.push(
      obtainMin(date, startDate, currency)
        .then(minValueObj => obtainExchange(minValueObj, date))
    )
  })

  return await Promise.all(promises)
}

async function getMinRates(date, currency, weeks) {
  let result = []

  try {
    let correctCurrency = await obtainCurrency(currency)
    if (correctCurrency) {
      if (weeks) {
        let dates = datesAscendentOrder(date, weeks)
        result = await parallelActions(dates, correctCurrency)
      }
    }

    return { currency: correctCurrency, rates: [...result] }
  } catch (error) {

    return errorManage(error)
  }
}

export { getMinRates }
