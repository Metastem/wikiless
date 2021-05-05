module.exports = (app, utils) => {
  const config = require('../config')
  const path = require('path')
  
  app.all('*', (req, res, next) => {
    let themeOverride = req.query.theme
    if(themeOverride) {
      themeOverride = themeOverride.toLowerCase()
      req.cookies.theme = themeOverride
      res.cookie('theme', themeOverride, { maxAge: 31536000, httpOnly: true })
    } else if(!req.cookies.theme && req.cookies.theme !== '') {
      req.cookies.theme = config.theme
    }
    
    let langOverride = req.query.default_lang
    if(langOverride) {
      langOverride = langOverride.toLowerCase()
      req.cookies.default_lang = langOverride
      res.cookie('default_lang', langOverride, { maxAge: 31536000, httpOnly: true })
    } else if(!req.cookies.default_lang) {
      req.cookies.default_lang = config.default_lang
    }
    
    return next()
  })
  
  app.get('*', async (req, res, next) => {
    if(req.url.startsWith('/w/load.php')) {
      return res.sendStatus(404)
    }
    
    if(req.url.startsWith('/media')) {
      let media = await proxyMedia(req)
      if(media.success === true) {
        return res.sendFile(media.path)
      } else {
        return res.sendStatus(404)
      }
    }
    
    if(req.url.startsWith('/static/images/project-logos/')) {
      return res.sendFile(wikilessLogo())
    }
    
    return next()
  })
  
  app.get('/wiki/:page?/:sub_page?', (req, res, next) => {
    return handleWikiPage(req, res, '/wiki/')
  })
  
  app.get('/w/:file', (req, res, next) => {
    return handleWikiPage(req, res, '/w/')
  })
  
  app.get('/', (req, res, next) => {
    return handleWikiPage(req, res, '/')
  })
  
  app.get('/about', (req, res, next) => {
    return res.sendFile(path.join(__dirname, '../static/about.html'))
  })
  
  app.get('/preferences', (req, res, next) => {
    return res.send(preferencesPage(req, res))
  })
  
  app.post('/preferences', (req, res, next) => {
    let theme = req.body.theme
    let default_lang = req.body.default_lang
    let back = req.query.back
    
    res.cookie('theme', theme, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true })
    res.cookie('default_lang', default_lang, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true })
    
    if(back == 'undefined' || !back.startsWith('/')) {
      back = '/'
    }
    
    return res.redirect(back)
  })
}
