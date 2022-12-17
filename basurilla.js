import fetch from 'node-fetch';

const host = 'api.frankfurter.app';
fetch(`https://${host}/latest?amount=10&from=GBP&to=USD`)
  .then(resp => resp.json())
  .then((data) => {
    console.log(`10 GBP = ${data.rates.USD} USD`);
  });

function dateOfFirstWeek(weeksBefore, date) {

  let msStart = daysInAWeek * weeksBefore * msPerDay

  let msActualDate = new Date(date).getTime()

  return new Date(msActualDate - msStart)
}

// async function euroExchange(miObj) {
//   let url = createUrlForEurExchange(miObj)
//   return fetch(url)
//     .then(response => response.json())
// }

function createUrlForEurExchange(miObj) {
  let previousDay = yesterday(miObj.date)
  return `${host}/${previousDay}?from=${miObj.currency}&to=EUR`
}

async function getHistorical(allUrlsForMin) {
  try {
    const result = await Promise.all(
      allUrlsForMin.map(
        url => fetch(url)
          .then(res => res.json())))
    return result
  } catch (error) {
    console.log(error)
  }
}

function allMinRatesDates(objDataHistorical) {
  let array = []

  console.log(objDataHistorical[0].date)

  objDataHistorical.forEach((e) => {
    let min = Object.values(e.rates).sort((a, b) => a - b)[0]
    for (let currency in e.rates) {
      if (e.rates[currency] === min) {
        let obj = { [currency]: e.rates[currency] }
        array.push(obj)
        return
      }
    }
  })

  return array
}

function getAllDates(startDate, weeksBefore) { /* Inicializar array y usar algún método para rellenar?? repensar*/
  let dates = []

  let msActualDate = new Date(startDate).getTime()

  for (let weeksElapsed = 0; weeksElapsed < weeksBefore; weeksElapsed++) {
    let msStart = daysInAWeek * msPerDay * weeksElapsed
    dates.push(YYYYMMDD(new Date(msActualDate - msStart)))
  }
  //console.log(dates)
  return dates
}

function createUrls(dates, currency) {
  return dates.map((date) => `${host}/${date}?from=${currency}`)
}

const msPerDay = 86400000
const daysInAWeek = 7