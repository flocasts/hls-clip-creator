import pino from 'pino'

export default pino({
  name: process.env.APP_ID,
  level: process.env.LOG_LEVEL || 'debug'
})