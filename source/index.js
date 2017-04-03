import {promisify} from 'bluebird'
import {gmail, sheets} from 'googleapis'
import {map, head, prop, compose, pipe} from 'ramda'

import authorize, {CLIENT_TOKEN} from './authentication'
import {problem} from './messaging'
import parse from './parse-html'
const {error, log, info} = console

const gMail = gmail('v1')
const list = promisify(gMail.users.messages.list)
const get = promisify(gMail.users.messages.get)

const gSheets = sheets('v4')
const append = promisify(gSheets.spreadsheets.values.append)

// CONSTANTS
const scopes = ['https://www.googleapis.com/auth/gmail.readonly']

/**
 * @see https://support.google.com/mail/answer/7190?hl=en
 */
const query = `
from:(recepits@newseasons.com)
subject:()
newer_than:1d
`
// const query = `from:(jose.fraley@gmail.com)`
// const query = `from:(info@ujomusic.com)`

const SPREAD_SHEET_ID = '123' // An entire spreadsheet
const SHEET_ID = '123' // A particular "sheet" of that spreadsheet (kind of like a page)

// MODULE
export const connectToEmail = (auth) => async () => {
  try {
    const {messages} = await list({
      auth,
      userId: 'me',
      maxResults: 1,
      q: query,
    })
    return pipe(head, prop('id'))(messages)
  } catch (e) {error(problem('connectToEmail failed', e))}
}

export const emailContents = (auth) => async (emailId) => {
  try {
    const email = await get({
      auth,
      userId: 'me',
      id: emailId,
      format: 'raw',
    })
    return new Buffer(email.raw, 'base64').toString('ascii')
  } catch (e) {error(problem('emailContents failed', e))}
}

export const run = async () => {
  const auth = await authorize(CLIENT_TOKEN)
  const emailId = await connectToEmail(auth)()
  const raw = await emailContents(auth)(emailId)
  // const results = parseReceipt(raw)
  // const status = await saveResults(auth)(results)
  log(raw)
}

run()
