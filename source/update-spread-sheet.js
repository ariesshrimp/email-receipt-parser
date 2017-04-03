import {promisify} from 'bluebird'
import {sheets} from 'googleapis'
import {map, head, prop, compose, pipe, values} from 'ramda'

import {problem} from './messaging'

const {error, log, info} = console

const gSheets = sheets('v4')
const append = promisify(gSheets.spreadsheets.values.append)


const SPREAD_SHEET_ID = '1RXqpV6AISrUl42eqULyJ-Be6c_teKk4fLmbZojlHCZw' // An entire spreadsheet
const SHEET_ID = '123' // A particular "sheet" of that spreadsheet (kind of like a page)

/**
 * [     A        B        C      D       E       F
 *  1 [ date, quantity, name, unit price, price, tripTotal ]
 *  2 [ ... ]
 *  3 [ ... ]
 *  ...
 * ]
 * 
 * Max Cell Count Per GoogleSheet === 200,000
 */
export default (auth) => async ({ items, date, total }) => {
  try {
    const data = {
      values: map(
        ({quantity, name, description, price }) => 
          [date, quantity, name, description, price, total]
      , items),
    }

    const status = await append({
      auth,
      spreadsheetId: SPREAD_SHEET_ID,
      resource: data,
      range: 'A1:F1', // defines the column positioning used to insert new data
      insertDataOption: 'INSERT_ROWS', //@ see https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append#InsertDataOption
      valueInputOption: 'USER_ENTERED', // @see https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption
    })
    return status
  } catch (e) {error(problem('saveResults failed', e))}
}
