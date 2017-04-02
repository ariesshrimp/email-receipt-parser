import { promisify } from 'bluebird'
import fs from 'fs'
import googleAuth from 'google-auth-library'
import readline from 'readline'
import {problem, waiting, success, hyperlink, instruction} from './messaging'
const {error, log, info} = console

const readFile = async (file) => {
  const buffer = await promisify(fs.readFile)(file)
  return buffer.toString()
}
const writeFile = promisify(fs.writeFile)

// CONSTANTS
const scopes = ['https://www.googleapis.com/auth/gmail.readonly']
const SECRET_PATH = `${__dirname}/local-secret.json`

// MODULE
export const localToken = async (secretPath) => {
  log(waiting('attempting to read an existing token from disk')   )
  const token = await readFile(secretPath)
  return JSON.parse(token)
}

export const saveToken = async (secretPath, token) => {
  log(waiting('attempting to save a new token object to disk')  )
  try {
    const results = await writeFile(secretPath, token)
    log(success('token saved to disk!')    )
  } catch(e) {
    error(problem(`failed to find save token ${token} locally at ${secretPath}`, e))
  }
}

export const newToken = async (oauth) => {
  log(waiting('a new token is needed! generating oauth token verification'))
  const authUrl = oauth.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  })
  log(instruction('Authorize this app by visiting this url'))
  info(hyperlink(`
${authUrl}
`))
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const ask = question => new Promise(resolve => rl.question(question, resolve))

  const accessCode = await ask(instruction('Enter the code from that page here: '))
  rl.close()
  try {
    const getToken = code => new Promise((resolve, reject) => 
      oauth.getToken(
        code, 
        (err, token) => err ? reject(err) : resolve(token)
      ))
    const oauthToken = await getToken(accessCode)
    return oauthToken;
  } catch (e) {error(problem('getNewToken - oauth failed', e))}
}

export default async ({installed: {
  client_secret, 
  client_id, 
  redirect_uris: [redirectUrl, ...rest]
}}) => {
  log(waiting('attempting to authorize via client secret'))
  const auth = new googleAuth();
  const oauth = new auth.OAuth2(client_id, client_secret, redirectUrl);
  try {
    const token = await localToken(SECRET_PATH)
    oauth.credentials = token
    log(success('client authorized!'))
  } catch (e) {
    error(problem(`failed to find local token`, e))
    const token = await newToken(oauth)
    await saveToken(SECRET_PATH, JSON.stringify(token, '\t', 1))
    oauth.credentials = token
  }
  return oauth
}

// SECRETS
export {default as CLIENT_TOKEN} from './client-secret.json'
