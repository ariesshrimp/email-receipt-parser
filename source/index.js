import { promisify } from 'bluebird'
import color from 'chalk'
import fs from 'fs'
import google from 'googleapis'
import googleAuth from 'google-auth-library'
import readline from 'readline'

// SECRETS
import CLIENT_TOKEN from './client-secret.json'

// LIBRARY FUNCTIONS
const gmail = google.gmail('v1')
const {error, log} = console

const readFile = async (file) => {
  const buffer = await promisify(fs.readFile)(file)
  return buffer.toString()
}
const writeFile = promisify(fs.writeFile)

// CONSTANTS
const scopes = ['https://www.googleapis.com/auth/gmail.readonly']
const SECRET_PATH = `${__dirname}/local-secret.json`

// MODULE
export const authorize = async ({installed: {
  client_secret, 
  client_id, 
  redirect_uris: [redirectUrl, ...rest]
}}) => {
  log(color.green('⏳ \t attempting to authorize via client secret...'))    
  const auth = new googleAuth();
  const oauth = new auth.OAuth2(client_id, client_secret, redirectUrl);
  try {
    const token = await localToken(SECRET_PATH)
    oauth.credentials = token
    log('✅ \t client authorized!')
  } catch (e) {
    error(`❌ \t failed to find local token...`, e)
    const token = await newToken(oauth)
    await saveToken(SECRET_PATH, JSON.stringify(token, '\t', 1))
    oauth.credentials = token
  }
  return oauth
}

export const localToken = async (secretPath) => {
  log(color.green('⏳ \t attempting to read an existing token from disk...'))    
  const token = await readFile(secretPath)
  return JSON.parse(token)
}

export const saveToken = async (secretPath, token) => {
  log(color.green('⏳ \t attempting to save a new token object to disk...'))  
  try {
    const results = await writeFile(secretPath, token)
    log('✅ \t token saved to disk!')    
  } catch(e) {
    error(`❌ \t failed to find save token ${token} locally at ${secretPath}...`, e)    
  }
}

export const newToken = async (oauth) => {
  log(color.green('⏳ \t a new token is needed! generating oauth token verification...'))
  const authUrl = oauth.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  })
  log(`
    ${color.bold('Authorize this app by visiting this url:')}
      ---
      ${color.underline.blue(authUrl)}
      ---
  `)
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const ask = question => new Promise(resolve => rl.question(question, resolve))

  const accessCode = await ask(color.bold('Enter the code from that page here: '))
  rl.close()
  try {
    const getToken = code => new Promise((resolve, reject) => 
      oauth.getToken(
        code, 
        (err, token) => err ? reject(err) : resolve(token)
      ))
    const oauthToken = await getToken(accessCode)
    return oauthToken;
  } catch (e) {error('❌ \t getNewToken - oauth failed...', e)}
}

export const connectToEmail = async (auth) => {
  log(color.green('⏳ \t attempting to start up an email watcher...'))    
  const message = promisify(gmail.users.messages.get)
  try {
    const results = await message({
      auth, 
      userId: 'me', 
      id: '15a33c10131fd38a',
      format: 'raw'
    })
    return results
  } catch (e) {error('❌ \t connectToEmail failed...', e)}
}

export const run = async () => {
  const auth = await authorize(CLIENT_TOKEN)
  const results = await connectToEmail(auth)
  log(`
  ---
  RESULTS
  ---
  \${results.payload.parts[0].body.data.toString()}

  ${new Buffer(results.raw, 'base64').toString('ascii')}
  ---`)
} 

run()
