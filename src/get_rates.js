
import fetch from 'node-fetch'

const host = 'https://api.frankfurter.app'
const wwwError = 'No se han podido obtener las divisas'

function errorsHandler(errorMessage) {
  let isStatusOrSystemError = typeof errorMessage === 'number' || errorMessage.type === 'system'

  if (isStatusOrSystemError) return wwwError
  
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
    if (currencyName.includes(stringForSearch)) return currency
  }

  throw `No se ha encontrado ninguna divisa con el nombre ${stringForSearch}`
}

async function fetchConcurrencies() {
  let response = await fetch(`${host}/currencies`)

  if (response.status !== 200) throw response.status

  return await response.json()
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

function outOfDate(date, fetchDate) {
  let limit2days = obtainADate(new Date(date), -2)

  return new Date(fetchDate) < limit2days
}

function searchMin(json, date) {
  let min = Math.min(...Object.values(json.rates))
  let currency = Object.keys(json.rates).find(key => json.rates[key] === min)

  return { date, currency, min }
}

async function obtainMin(date, currency) {
  let urlMin = `${host}/${date}?from=${currency}`
  let response = await fetch(urlMin)

  if (response.status !== 200) throw response.status

  response = await response.json()

  if (outOfDate(date, response.date)) throw `No se ha podido obtener el cambio para la divisa ${currency} el día ${date}: El cambio no pertenece a la fecha solicitada`

  return searchMin(response, date)
}

async function obtainExchange(json, date) {
  let yesterdayDate = YYYYMMDD(obtainADate(date, -1))
  let url = `${host}/${yesterdayDate}?from=${json.currency}&to=EUR`
  let response = await fetch(url)

  if (response.status !== 200) throw response.status
  response = await response.json()

  return { day: date, min: { currency: response.base, EUR: response.rates.EUR } }
}

async function serialData(date, currency) {
  let objMin = await obtainMin(date, currency)
  
  return obtainExchange(objMin, date)
}

async function allPromises(dates, currency) {
  let parallelData = []

  dates.forEach(date => {
    parallelData.push(
      serialData(date, currency)
    )
  })

  return Promise.all(parallelData)
}

async function getMinRates(date, currency, weeks) {
  let result = []

  try {
    let correctCurrency = await obtainCurrency(currency)

    if (correctCurrency && weeks) {
      let dates = datesAscendentOrder(date, weeks)
      result = await allPromises(dates, correctCurrency)
    }

    return { currency: correctCurrency, rates: [...result] }
  } catch (error) {

    return errorsHandler(error)
  }
}

export { getMinRates }
