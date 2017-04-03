import {load} from 'cheerio'
import {map, head, prop, split, join, compose, pipe, reject, identity, propEq, evolve, tap, trim} from 'ramda'
const {error, log} = console

/**
 * @description standard HTML structure of email recepits
  <table class="basket">
    <thead/>
    <tbody>
      <tr>
        <td class="basket-item-qty">{number}</td>
        <td class="basket-item-desc">{string}</td>
        <td class="basket-item-amt">{float}</td>
      </tr>
      <tr/> <-- just a spacer
      <tr> <-- might not exist
        <td class="basket-item-desc modifier">
          <span>{float} @${float}/lb</span>
        </td>
      </tr>        
      ...
      <tr>
        ...
        <td class="basket-total-amt">{float}</td>
      </tr>
    </tbody>
  </table>
*/

/**
 * @description strips a gMail email response object of all the metadata
 * and returns raw HTML
 */
export const htmlContentFrom = pipe(
  split('Content-Type: text/html; charset="utf-8"'),
  head
)

// specifically formatted for sorting as a column in GoogleSheets
const now = () => {
  const now = new Date()
  return `${now.getMonth()}/${now.getDate()}/${now.getFullYear()} ${now.getUTCHours()}:${now.getMinutes()}:${now.getSeconds()}`
}

/**
 * @description takes raw text and transforms it into pure table data.
 * takes an intermediate step to ensure that the raw text is properly formatted HMTL 
 * before starting
 */
export const dataFrom = (html) => {
    const $ = load(html) // for jQuery emulation
    let items = []
    
    // TODO:jmf figure out how to work around this garbage jQuery object and use native maps...
    const basket = $('.basket-item-qty').each((index, element) => {

      const quantity = $(element).text().trim()
      const [desc, amt] = $(element).nextAll().toArray()
      const name = $(desc).text().trim()
      const price = $(amt).text().trim()

      // TODO:jmf refactor this crazy monster. probably need a good regex
      const description = $(element)
        .parent().next().next() // look ahead to the description modifier row, skipping a spacer
        .find('.basket-item-desc.modifier') // only one cell has data
        .text().trim()
        .split('\n').join('') // throw out internal new lines
        .split('@') // pop this for a sec
        .map(trim) // so we can trim internally
        .join(' @ ') // drop it back in

      // TODO:jmf return idempotent items instead of pushing them this way
      items.push({
        description, // might be empty
        name,
        price,
        quantity,
      })
    })

    // TODO:jmf use compose to make this more legible    
    const total = $($('.basket-total-amt').toArray()[0]).text()

    return {
      items: reject(propEq('quantity', ''))(items),
      total,
      date: now() // specifically formatted for sorting as a column in GoogleSheets
    }
}

export default pipe(
  htmlContentFrom,
  dataFrom
)
