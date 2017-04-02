import {green, red, bold, underline, blue} from 'chalk'
import {toString} from 'ramda'

export const waiting = (...messages) => 
  green(`🕚 \t ${messages.map(toString)}...`)
export const problem = (...messages) => 
  red(`❌ \t ${messages.map(toString)}`)
export const success = (...messages) => 
  green(`✅ \t ${messages.map(toString)}`)
export const link = (hyperlink) => 
  underline.blue(hyperlink)
export const instruction = (...messages) => 
  bold(`${messages.map(toString)} :`)
