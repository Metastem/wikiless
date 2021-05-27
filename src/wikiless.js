const config = require('../config')
const compression = require('compression')
const path = require('path')
const express = require('express')
const cookieParser = require('cookie-parser')
const fs = require('fs')
const parser = require('node-html-parser')
const app = express()
const r = require('redis')
const bodyParser = require('body-parser')

const redis = (() => {
  const redisOptions = {
    host: '127.0.0.1',
    port: 6379
  }
  
  if(config.redis_db) {
    redisOptions.db = config.redis_db
  }

  if(config.redis_host) {
    redisOptions.host = config.redis_host
  }
  
  if(config.redis_port && config.redis_port > 0) {
    redisOptions.port = config.redis_port
  }  

  if(config.redis_password) {
    redisOptions.password = config.redis_password
  }

  return r.createClient(redisOptions)
})()

const utils = require('./utils.js')(redis)

let https = null
if(config.https_enabled) {
  const privateKey = fs.readFileSync(`${config.cert_dir}/privkey.pem`, 'utf8')
  const certificate = fs.readFileSync(`${config.cert_dir}/cert.pem`, 'utf8')
  const ca = fs.readFileSync(`${config.cert_dir}/chain.pem`, 'utf8')
  const credentials = {
	  key: privateKey,
	  cert: certificate,
	  ca: ca
  }
  https = require('https').Server(credentials, app)
  global.protocol = 'https://'
} else {
  global.protocol = 'http://'
}

const http = require('http').Server(app)

app.use((req, res, next) => {  
  // set CSP rules and other headers to every request
  res.set({
    'Content-Security-Policy': "default-src 'none'; base-uri 'none'; font-src 'self' data:; img-src 'self' data:; object-src 'none'; script-src 'none'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; media-src 'self'; form-action 'self'; frame-ancestors 'none'; " + (config.https_enabled ? 'upgrade-insecure-requests;' : '') + " block-all-mixed-content;",
    'Referrer-Policy': 'no-refferer',
    ...(config.https_enabled ? { 'Strict-Transport-Security': 'max-age=31536000' } : {}),
    'X-Content-Type-Options': 'nosniff',
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'X-Frame-Options': 'DENY',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-XSS-Protection': '0'
  })
  next()
})

if(!config.https_enabled && config.redirect_http_to_https) {
  console.error(`Cannot redirect HTTP=>HTTPS while "https_enabled" is false.`)
}

if(config.redirect_http_to_https) {
  app.use((req, res, next) => {
    if(req.secure) {
      next()
    } else {
      res.redirect(`https://${req.headers.host}${req.url}`)
    }
  })
}

app.use(compression())
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }))
app.use(express.static(path.join(__dirname, '../static')))
app.use(express.static(path.join(__dirname, '../media')))

if(config.trust_proxy) {
  app.set('trust proxy', config.trust_proxy_address)
}

require('./routes')(app, utils)

redis.on('error', (error) => {
  if(error) {
    console.error(`Redis error: ${error}`)
  }
})

if(config.https_enabled) {
  https.listen(config.ssl_port, '::', () => console.log(`Wikiless running on https://${config.domain}:${config.ssl_port}`))
}
http.listen(config.nonssl_port, '::', () => console.log(`Wikiless running on http://${config.domain}:${config.nonssl_port}`))
