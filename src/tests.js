
import { getMinRates } from "./get_rates_second.js"
import util from 'util'


console.log(await getMinRates('2023-12-04', 'Dollar', 1))
console.log(await getMinRates('2022-12-04', '   banana   ', 7))
console.log(util.inspect(await getMinRates('2022-12-04', 'Dollar', 5), { showHidden: false, depth: null, colors: true }))
console.log(await getMinRates('2022-05-13', 'Dollar', 0))
//console.log(util.inspect(await getMinRates('2022-12-04', 'Dollar', 5), {showHidden: false, depth: null, colors: true}))
console.log(util.inspect(await getMinRates('2022-12-04', 'pou', 5), { showHidden: false, depth: null, colors: true }))
console.log(util.inspect(await getMinRates('2022-12-04', 'euro', 5), { showHidden: false, depth: null, colors: true }))