
import { getMinRates } from "./get_rates.js"
import util from 'util'


console.log(util.inspect(await getMinRates('2022-12-04', 'Dollar', 5), { showHidden: false, depth: null, colors: true }))
console.log(await getMinRates('2022-05-13', 'Dollar', 0))
console.log(await getMinRates('2022-05-13', 'banana', 5))
console.log(await getMinRates('2023-12-12', 'Dollar', 5))
console.log(util.inspect(await getMinRates('2022-12-04', 'pou', 5), { showHidden: false, depth: null, colors: true }))
// console.log(util.inspect(await getMinRates('2022-12-04', 'Dollar', 5), {showHidden: false, depth: null, colors: true}))
// console.log(util.inspect(await getMinRates('2022-12-04', 'z', 5), { showHidden: false, depth: null, colors: true }))