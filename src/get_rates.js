
import fetch from 'node-fetch'

const host = 'https://api.frankfurter.app'
const urlConcurrencies = `${host}/currencies`
const daysInAWeek = 7
const convertToNegative = - 1
const maxDaysPermitted = -2
const wwwError = 'No se han podido obtener las divisas'

function errorsHandler(errorMessage) {
  let isStatusOrNoInternetError = typeof errorMessage === 'number' || errorMessage.type === 'system'

  if (isStatusOrNoInternetError) throw wwwError

  throw errorMessage
}

function createNewDate(date, addOrSubstractDays) {
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

    if (currencyName.includes(stringForSearch)) return currency
  }

  throw `No se ha encontrado ninguna divisa con el nombre ${stringForSearch}`
}

function calculateFirstDate(endDate, weeks) {
  let totalWeeksBefore = weeks - 1
  let totalDaysToSubstract = totalWeeksBefore * daysInAWeek * convertToNegative
  let date = createNewDate(endDate, totalDaysToSubstract)

  return date
}

function datesAscendentOrder(endDate, weeks) {
  let dates = []
  let firstDate = calculateFirstDate(endDate, weeks)

  for (let weeksElapsed = 0; weeksElapsed < weeks; weeksElapsed++) {
    let date = createNewDate(firstDate, weeksElapsed * daysInAWeek)
    dates.push(YYYYMMDD(date))
  }

  return dates
}

function throwIfIsOutOfDate(date, fetchedDate, currency) {
  let date2DaysBefore = createNewDate(new Date(date), maxDaysPermitted)
  let isMoreThan2Days = new Date(fetchedDate) < date2DaysBefore

  if (isMoreThan2Days)
    throw `No se ha podido obtener el cambio para la divisa ${currency} el día ${date}: El cambio no pertenece a la fecha solicitada`
}

function searchMinCurrency(json) {
  let minExchange = Math.min(...Object.values(json.rates))
  let currency = Object.keys(json.rates).find(key => json.rates[key] === minExchange)

  return currency
}

function createUrl(date, currency) {

  return `${host}/${date}?from=${currency}`
}

async function fetchResponse(url, date, currency) {
  let response = await fetch(url)

  if (response.status !== 200) throw response.status

  response = await response.json()

  throwIfIsOutOfDate(date, response.date, currency)

  return response
}

async function obtainCurrency(currencyString) {
  let response = await fetchResponse(urlConcurrencies)
  let stringForSearch = prepareString(currencyString)

  return searchCurrency(response, stringForSearch)
}

async function createMinRateObject(date, currency) {
  let urlForMinimumExchange = createUrl(date, currency)
  let objMinExchange = await fetchResponse(urlForMinimumExchange, date, currency)
  let currencyOtained = searchMinCurrency(objMinExchange)

  let yesterday = YYYYMMDD(createNewDate(date, -1))
  let urlForEurExchange = createUrl(yesterday, currencyOtained) + '&to=EUR'
  let objEurExchange = await fetchResponse(urlForEurExchange, yesterday, currency)

  return { day: date, min: { currency: objMinExchange.base, EUR: objEurExchange.rates.EUR } }
}

async function allPromises(dates, currency) {

  return Promise.all(dates.map(date => createMinRateObject(date, currency)))
}

async function getMinRates(date, currency, weeks) {
  
  try {
    let result = []
    let correctCurrency = await obtainCurrency(currency)

    if (correctCurrency && weeks) {
      let dates = datesAscendentOrder(date, weeks)
      result = await allPromises(dates, correctCurrency)
    }

    return { currency: correctCurrency, rates: [...result] }
  } catch (error) {

    errorsHandler(error)
  }
}

export { getMinRates }
