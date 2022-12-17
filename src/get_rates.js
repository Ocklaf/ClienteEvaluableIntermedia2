
import fetch from 'node-fetch'

const host = 'https://api.frankfurter.app'

function addDays(date, days) {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + days)
  return newDate
}

function YYYYMMDD(date) {
  return date.toISOString().slice(0, 10)
}

function getAllDatesAsc(startDate, weeksBefore) {
  let dates = []

  startDate = new Date(startDate)
  startDate = new Date(startDate.setDate(startDate.getDate() - ((weeksBefore - 1) * 7))) /*quito una semana para poder fecha enviada, si quito todas me voy una semanta atrás*/

  for (let weeksElapsed = 0; weeksElapsed < weeksBefore; weeksElapsed++) {
    let date = addDays(startDate, weeksElapsed * 7)
    dates.push(YYYYMMDD(new Date(date)))
  }

  return dates
}

function existsCurrency(currentCurreny, searchedCurrency) {
  return currentCurreny.toLowerCase().includes(searchedCurrency.toLowerCase())
}

async function obtainCurrency(currency) {
  let allCurrencies

  try {
    allCurrencies = await fetch(`${host}/currencies`)
      .then(response => {
        if (response.status !== 200) {
          throw response.status
        }
        return response.json()
      })
  }
  catch (error) {
    if (typeof error === 'number') {
      throw `Error: ${error}`
    }
    throw 'No se han podido obtener las divisas'
  }

  for (let current in allCurrencies) {
    if (existsCurrency(allCurrencies[current], currency)) {
      return current
    }
  }

  throw `No se ha encontrado ninguna divisa con el nombre ${currency}`
}

function obtainMin(obj) {
  let min = Object.values(obj.rates).sort((a, b) => a - b)[0]
  let currency = Object.keys(obj.rates).find(key => obj.rates[key] === min)
  //console.log({ date: obj.date, currency, min })
  return { date: obj.date, currency, min }
}

function yesterday(date) {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() - 1)
  return YYYYMMDD(newDate)
}

function urlForEurExchange(miObj, date) {
  let previousDay = yesterday(date)
  return `${host}/${previousDay}?from=${miObj.currency}&to=EUR`
}

function getLimitDate(dateDemanded) {
  return YYYYMMDD(addDays(new Date(dateDemanded), -2))
}

async function paralelActions(allDates, currency) {
  let paralelPromises = []
  let dateLimit = getLimitDate(allDates.at(-1))

  allDates.forEach(async date => {
      let urlMin = `${host}/${date}?from=${currency}`
      paralelPromises.push(
        fetch(urlMin)      
          .then(res => {
            if (res.status !== 200) {
              throw res.status
            }
            return res.json()
          })
          .then(json => {
            if (new Date(json.date) < new Date(dateLimit) && new Date(date).getTime() === new Date(allDates.at(-1)).getTime()) {
              throw `No se ha podido obtener el cambio para la divisa ${currency} el día ${allDates.at(-1)}: El cambio no pertenece a la fecha solicitada`
            }
            return obtainMin(json)
          })
          .then(obj => urlForEurExchange(obj, date))
          .then(url => fetch(url))     
          .then(res => {
            if (res.status !== 200) {
              throw res.status
            }
            return res.json()
          })
          .then(response => {
            return { day: date, min: { currency: response.base, EUR: response.rates.EUR } }
          })
      )

    })

  const result = await Promise.all(paralelPromises)

  return result
}

async function getMinRates(date, currency, weeks) {
  let currencyToUse
  let result = []
  try {
    currencyToUse = await obtainCurrency(currency)
    if (weeks) {
      let allDates = getAllDatesAsc(date, weeks)
      result = await paralelActions(allDates, currencyToUse)
      console.log(result)
    }
    return await { currency: currencyToUse, rates: [...result] }
  } catch (error) {
    return error
  }

}

let respuesta

// respuesta = await getMinRates('2022-12-04', 'Dollar', 5)
// console.log(respuesta)

// respuesta = await getMinRates('2022-05-13', 'Dollar', 0)
// console.log(respuesta)

// respuesta = await getMinRates('2022-05-13', 'banana', 5)
// console.log(respuesta)

respuesta = await getMinRates('2023-12-12', 'Dollar', 5)
console.log(respuesta)

// respuesta = await getMinRates('2022-12-04', 'pou', 5)
// console.log(JSON.stringify(respuesta, null, 4))

export { getMinRates }
