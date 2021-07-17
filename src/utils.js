module.exports = function(redis) {
  const config = require('../config')
  const https = require('https')
  const parser = require('node-html-parser')
  const fs = require('fs')
  const path = require('path')
  
  this.download = async (url, params = '') => {
    return new Promise(resolve => {
      if(!url) {
        resolve({ success: false, reason: 'MISSING_URL' })
      }
      
      url = encodeURI(url)
      if(params != '') {
        url = `${url}?${params}`
      }
      
      redis.get(url, (error, data) => {
        if(data) {
          console.log(`Got key ${url} from cache.`)
          resolve({ success: true, html: data, processed: true })
        } else {
          https.get(url, (res) => {
            if(res.statusCode !== 200) {
              if(res.statusCode === 301 || res.statusCode === 302) {
                resolve({ success: false, reason: 'REDIRECT', url: res.headers.location })
                res.resume()
              } else if(res.statusCode === 404) {
                // let's redirect 404s to homepage
                console.log(`Didn't find ${url} HTTP status code: ${res.statusCode}`)
                res.resume()
                return resolve({ success: false, reason: 'REDIRECT', url: 'https://wikipedia.org/' })
              } else {
                console.log(`Error while fetching data from ${url}. HTTP status code: ${res.statusCode}`)
                res.resume()
                return resolve({ success: false, reason: `INVALID_HTTP_RESPONSE: ${res.statusCode}` })
              }
            }
            
            let data = ''

            res.on('data', (chunk) => {
              data += chunk
            })

            res.on('end', () => {
              console.log(`Fetched url ${url} from Wikipedia.`)
              resolve({ success: true, html: data, processed: false })
            })
          }).on('error', (err) => {
            console.log(`Error while fetching data from ${url}. Error: ${err}`)
            resolve({ success: false, reason: 'SERVER_ERROR' })
          })
        }
      })
    })
  }
  
  this.applyUserMods = (data, user_preferences) => {
    /**
    * We have already processed the HTML, but we haven't applied the user's
    * cookie specific modifications to it yet. Let's do it.
    */
    
    // add dark style theme file if needed
    if(user_preferences.theme == 'dark') {
      data = data.replace('</head>', `<link rel="stylesheet" href="/wikipedia_styles_dark.css"></head>`)
    }
    return data
  }
  
  this.processHtml = (data, url, params, lang, user_preferences, process_user_prefs) => {
    return new Promise(resolve => {
      if(validHtml(data.html)) {
        url = encodeURI(url)
        if(params != '') {
          url = `${url}?${params}`
        }
        
        let setting_lang = user_preferences.default_lang || config.default_lang
        
        data.html = parser.parse(data.html)
        
        // insert wikiless styles
        let head = data.html.querySelector('head')
        if(head) {
          let head_html = `<link rel="stylesheet" href="/styles.css">`
          head.insertAdjacentHTML('beforeend', head_html)
        }
        
        // replace default wikipedia top right nav bar links
        let nav = data.html.querySelector('nav#p-personal .vector-menu-content-list')
        if(nav) {
          nav.innerHTML = `
            <li>
              <a href="/about">[ about ]</a>
            </li>
            <li>
              <a href="/preferences?back=${url.split('wikipedia.org')[1]}">[ preferences ]</a>
            </li>
          
          `
        }
        
        // append the lang query param to the URLs starting with /wiki/ or /w/
        let links = data.html.querySelectorAll('a')
        for(let i = 0; i < links.length; i++) {
          let href = links[i].getAttribute('href')
          if(href) {
            if(href.startsWith('/wiki/') || href.startsWith('/w/')) {
              href = `${protocol}${config.domain}${href}`
              let u = new URL(href)
              u.searchParams.append('lang', lang)
              href = u.href
              links[i].setAttribute('href', href)
            }
          }
        }
        
        // remove #p-wikibase-otherprojects
        let wikibase_links = data.html.querySelector('#p-wikibase-otherprojects')
        if(wikibase_links) {
          wikibase_links.remove()
        }
        
        /**
        * Remove the language subdomain from the sidebar language switchers.
        * Then append the language as a URL query param.
        */
        let lang_links = data.html.querySelectorAll('#p-lang .interlanguage-link a')
        for(let i = 0; i < lang_links.length; i++) {
          let href = lang_links[i].getAttribute('href')
          let lang_code = href.split('wikipedia.org')[0].split('//')[1]
          href = href.replace(lang_code, '')
          href = `${href}?lang=${lang_code.slice(0, -1)}`
          lang_links[i].setAttribute('href', href)
        }
        
        data.html = data.html.toString()
        
        // replace upload.wikimedia.org with /media
        const upload_wikimedia_regx = /((https:|http:|)\/\/?upload.wikimedia.org)/gm
        data.html = data.html.replace(upload_wikimedia_regx, '/media')
        
        // replace maps.wikimedia.org with /media
        const maps_wikimedia_regx = /((https:|http:|)\/\/?maps.wikimedia.org)/gm
        data.html = data.html.replace(maps_wikimedia_regx, '/media/maps_wikimedia_org')
        
        // replace wiki links
        const wiki_href_regx = /(href=\"(https:|http:|)\/\/([A-z.-]+\.)?(wikipedia.org|wikimedia.org|wikidata.org|mediawiki.org))/gm
        data.html = data.html.replace(wiki_href_regx, `href="${protocol}${config.domain}`)
        
        redis.setex(url, config.setexs.wikipage, data.html, (error) => {
          if(error) {
            console.log(`Error setting the ${url} key to Redis. Error: ${error}`)
            resolve({ success: false, reason: 'SERVER_ERROR_REDIS_SET' })
          } else {
            resolve({ success: true, html: data.html })
          }
        })
      } else {
        console.log('Invalid wiki_html.')
        resolve({ success: false, reason: 'INVALID_HTML' })
      }
    })
  }
  
  this.proxyMedia = (req, wiki_domain='') => {
    return new Promise(async resolve => {
      let params = new URLSearchParams(req.query).toString() || ''
      
      if(params != '') {
        params = '?' + params
      }
      
      let path = ''
      let domain = 'upload.wikimedia.org'
      let wikimedia_path = ''
      
      if(wiki_domain === 'maps.wikimedia.org') {
        path = req.url.split('/media/maps_wikimedia_org')[1]
        domain = 'maps.wikimedia.org'
        wikimedia_path = path
      } else {
        path = req.url.split('/media')[1]
        wikimedia_path = path + params
      }
      
      url = new URL(`https://${domain}${wikimedia_path}`)
      
      let file = await saveFile(url, path)
      
      if(file.success === true) {
        resolve({ success: true, path: file.path })
      } else {
        resolve({ success: false, reason: file.reason })
      }
    })
  }
  
  this.saveFile = (url, file_path) => {
    return new Promise(async resolve => {
      let media_path = ''
      if(url.href.startsWith('https://maps.wikimedia.org/')) {
        media_path = path.join(__dirname, '../media/maps_wikimedia_org')
      } else {
        media_path = path.join(__dirname, '../media')
      }
      
      const path_with_filename = decodeURI(`${media_path}${file_path}`)
      let path_without_filename = path_with_filename.split('/')
          path_without_filename.pop()
          path_without_filename = path_without_filename.join('/')

      if(!fs.existsSync(path_with_filename)) {
        fs.mkdir(path_without_filename, { recursive: true }, (err) => {
          if(err) {
            resolve({ success: false, reason: 'MKDIR_FAILED' })
          } else {
            let file = fs.createWriteStream(path_with_filename)
            const options = {
              headers: { 'User-Agent': config.wikimedia_useragent }
            }
            
            https.get(url.href, options, (res) => {
              res.pipe(file)
              file.on('finish', () => {
                file.close()
                res.resume()
                resolve({ success: true, path: path_with_filename })
              })
            }).on('error', (err) => {
              console.log('Error while fetching data. Details:', err)
              resolve({ success: false, reason: 'SERVER_ERROR' })
            })
          }
        })
      } else {
        resolve({ success: true, path: path_with_filename })
      }
    })
  }
  
  this.writeToDisk = (data, file) => {
    return new Promise(resolve => {
      fs.writeFile(file, data, 'binary', (error, result) => {
        if(!error) {
          resolve({ success: true })
        } else {
          resolve({ success: false, reason: error })
        }
      })
    }).catch((err) => {
      console.log('Writing media file to disk failed for unknown reason. Details:', err)
    })
  }
  
  this.handleWikiPage = async (req, res, prefix) => {
    let lang = req.query.lang || req.cookies.default_lang || config.default_lang
    
    if(lang) {
      if(typeof(lang) !== 'string') {
        lang = lang[0]
      } else {
        lang = lang.split('?')[0]
      }
    }
    
    if(!validLang(lang)) {
      return res.send('invalid lang')
    }
    
    let params = new URLSearchParams(req.query).toString()
    
    let url = ''
    
    if(prefix === '/wiki/') {
      let page = req.params.page || ''
      let sub_page = req.params.sub_page || ''
      if(sub_page != '') {
        sub_page = `/${sub_page}`
      }
      url = `https://${lang}.wikipedia.org/wiki/${page}${sub_page}`
    }
    
    if(prefix === '/w/') {
      let file = req.params.file
      url = `https://${lang}.wikipedia.org/w/${file}`
    }
    
    if(prefix === '/wiki/Map') {
      let page = 'Special:Map'
      let sub_page = req.params['0'] || ''
      url = `https://${lang}.wikipedia.org/wiki/${page}/${sub_page}`
    }
    
    if(prefix === '/') {
      url = `https://${lang}.wikipedia.org/?lang=${lang}`
    }
    
    let result = await download(url, params)
    
    if(result.success !== true) {
      if(result.reason === 'REDIRECT' && result.url != '') {
        url = result.url.split('wikipedia.org')[1]
        let prefix = ''
        
        if(url) {
          if(url.startsWith('/w/')) {
            prefix = '/w/'
          }
          if(url.startsWith('/wiki/')) {
            prefix = '/wiki/'
          }
        }
        
        if(prefix != '') {
          redirect_to = `${prefix}${result.url.split(prefix)[1]}`
          return res.redirect(redirect_to)
        } else {
          return res.redirect(`/?lang=${lang}`)
        }
      }
    }
    
    if(result.processed === true) {
      return res.send(applyUserMods(result.html, req.cookies))
    } else {
      let process_html = await processHtml(result, url, params, lang, req.cookies)
      if(process_html.success === true) {
        return res.send(applyUserMods(process_html.html.toString(), req.cookies))
      } else {
        return res.send(process_html.reason)
      }
    }
  }
  
  this.validLang = (lang, return_langs=false) => {
    let valid_langs = ['ab','ace','ady','af','ak','als','am','an','ang','ar',
    'arc','ary','arz','as','ast','atj','av','avk','awa','ay','az','azb','ba',
    'ban','bar','bat-smg','bcl','be','be-tarask','bg','bh','bi','bjn','bm','bn',
    'bo','bpy','br','bs','bug','bxr','ca','cbk-zam','cdo','ce','ceb','ch','chr',
    'chy','ckb','co','cr','crh','cs','csb','cu','cv','cy','da','de','din','diq',
    'dsb','dty','dv','dz','ee','el','eml','en','eo','es','et','eu','ext','fa',
    'ff','fi','fiu-vro','fj','fo','fr','frp','frr','fur','fy','ga','gag','gan',
    'gcr','gd','gl','glk','gn','gom','gor','got','gu','gv','ha','hak','haw',
    'he','hi','hif','hr','hsb','ht','hu','hy','hyw','ia','id','ie','ig','ik',
    'ilo','inh','io','is','it','iu','ja','jam','jbo','jv','ka','kaa','kab',
    'kbd','kbp','kg','ki','kk','kl','km','kn','ko','koi','krc','ks','ksh','ku',
    'kv','kw','ky','la','lad','lb','lbe','lez','lfn','lg','li','lij','lld',
    'lmo','ln','lo','lt','ltg','lv','mad','mai','map-bms','mdf','mg','mhr','mi',
    'min','mk','ml','mn','mnw','mr','mrj','ms','mt','mwl','my','myv','mzn','na',
    'nah','nap','nds','nds-nl','ne','new','nia','nl','nn','no','nostalgia',
    'nov','nqo','nrm','nso','nv','ny','oc','olo','om','or','os','pa','pag',
    'pam','pap','pcd','pdc','pfl','pi','pih','pl','pms','pnb','pnt','ps','pt',
    'qu','rm','rmy','rn','ro','roa-rup','roa-tara','ru','rue','rw','sa','sah',
    'sat','sc','scn','sco','sd','se','sg','sh','shn','si','simple','sk','skr',
    'sl','sm','smn','sn','so','sq','sr','srn','ss','st','stq','su','sv','sw',
    'szl','szy','ta','tcy','te','tet','tg','th','ti','tk','tl','tn','to','tpi',
    'tr','ts','tt','tum','tw','ty','tyv','udm','ug','uk','ur','uz','ve','vec',
    'vep','vi','vls','vo','wa','war','wo','wuu','xal','xh','xmf','yi','yo','za',
    'zea','zh','zh-classical','zh-min-nan','zh-yue','zu']
    
    if(return_langs) {
      return valid_langs
    }
    
    if(valid_langs.includes(lang)) {
      return true
    }
    return false
  }
  
  this.validHtml = (html) => {
    if(html) {
      if(parser.valid(html)) {
        return true
      }
    }
    return false
  }
  
  this.wikilessLogo = () => {
    let static_path = path.join(__dirname, '../static')
    return `${static_path}/wikiless-logo.png`
  }
  
  this.preferencesPage = (req, res) => {
    let user_preferences = req.cookies
    let lang_select = '<select id="default_lang" name="default_lang">'
    let valid_langs = validLang('', true)
    
    for(var i = 0; i < valid_langs.length; i++) {
      let selected = ''
      if(valid_langs[i] == user_preferences.default_lang) {
        selected = 'selected'
      }
      lang_select += `<option value="${valid_langs[i]}" ${selected}>${valid_langs[i]}</option>`
    }
    
    lang_select += '</select>'
    
    let back = req.url.split('?back=')[1]
    
    let html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="stylesheet" href="/styles.css"></head>
          <title>Preferences - Wikiless</title>
        </head>
        <body>
          <div id="preferences">
            <h4>Preferences</h4>
            <form method="POST" action="/preferences?back=${back}">
              <div class="setting">
                <div class="label">
                  <label for="theme">Theme:</label>
                </div>
                <div class="option">
                  <select id="theme" name="theme">
                    <option value="" ${(!user_preferences.theme || user_preferences.theme == '' ? 'selected' : '')}>White</option>
                    <option value="dark" ${(user_preferences.theme == 'dark' ? 'selected' : '')}>Dark (experimental)</option>
                  </select>
                </div>
              </div>
              <div class="setting">
                <div class="label">
                  <label for="default_lang">Default language:</label>
                  <br>
                  <small>When you change the default language and visit the Wikiless without the lang parameter in the URL, the page will load with a language from this setting.</small>
                </div>
                <div class="option">
                  ${lang_select}
                </div>
              </div>
              <div class="bottom">
                <small class="notice">Preferences are stored client-side using cookies without any personal information.</small>
                <input type="submit" value="Save preferences">
              </div>
            </form>
          </div>
        </body>
      </html>
    `
    
    return html
  }
}
