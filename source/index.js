import {promisify} from 'bluebird'
import {gmail} from 'googleapis'
import {map, head, prop, compose, pipe} from 'ramda'
import authorize, {CLIENT_TOKEN} from './authentication'
import {problem} from './messaging'
const {error, log, info} = console

const gMail = gmail('v1')
const list = promisify(gMail.users.messages.list)
const get = promisify(gMail.users.messages.get)

// CONSTANTS
const scopes = ['https://www.googleapis.com/auth/gmail.readonly']
const query = `
from:(please_reply@auth0.com) 
`

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
    return new Buffer(email.raw, 'base64').toString('ascii').split('------=')[1]
  } catch (e) {error(problem('emailContents failed', e))}
}

export const parseReceipt = (rawText) => {
  try {
    const results = rawText // parse it 
    return results
  } catch (e) {error(problem('parseReceipt failed', e))}
}

export const saveResults = (auth) => async (data) => {
  try {
    const status = data // await google sheets response code to see if save was a success
    return status
  } catch (e) {error(problem('saveResults failed', e))}
}

export const run = async () => {
  const auth = await authorize(CLIENT_TOKEN)
  const emailId = await connectToEmail(auth)()
  const raw = await emailContents(auth)(emailId)
  const results = parseReceipt(raw)
  const status = await saveResults(auth)(results)
  log(results)
}

run()
