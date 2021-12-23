module.exports = function(redis) {
  const config = require('../config')
  const parser = require('node-html-parser')
  const fs = require('fs').promises
  const { existsSync } = require('fs')
  const path = require('path')
  const got = require('got')

  this.download = async (url, params = '') => {
    if(!url) {
      return { success: false, reason: 'MISSING_URL' }
    }

    if(url.includes('?')) {
      let wikipage = url.split('wikipedia.org/wiki/')[1]
      let uriencoded_wikipage = ''

      if(wikipage) {
        uriencoded_wikipage = encodeURIComponent(wikipage)
      }
      url = url.replace(wikipage, uriencoded_wikipage)
    }

    if(params) {
      url = `${url}?${params}`
    }

    let data = ''
    try {
      if(redis.isOpen === false) {
        await redis.connect()
      }
      data = await redis.get(url)
    } catch(err) {
      console.log(`Error while fetching key ${url} from cache. Error: ${err}`)
    }

    if(data) {
      console.log(`Got key ${url} from cache.`)
      return { success: true, html: data, processed: true }
    }
    try {
      const gotUrl = new URL(url)
      const { body } = await got(gotUrl)

      console.log(`Fetched url ${url} from Wikipedia.`)
      return { success: true, html: body, processed: false }
    } catch(err) {
      const { statusCode } = err.response
      if(statusCode !== 200) {
        if(statusCode === 404) {
          // let's redirect 404s to homepage
          console.log(`Didn't find ${url} HTTP status code: ${statusCode}`)
          return { success: false, reason: 'REDIRECT', url: 'https://wikipedia.org/' }
        }

        console.log(`Error while fetching data from ${url}. HTTP status code: ${statusCode}`)
        return { success: false, reason: `INVALID_HTTP_RESPONSE: ${statusCode}` }
      }
    }
  }

  this.applyUserMods = (data, theme, lang) => {
    /**
    * We have already processed the HTML, but we haven't applied the user's
    * cookie specific modifications to it yet. Let's do it.
    */

    // load fr style, issue #12
    const langSuffix = (lang === 'fr') ? `_${lang}` : '';

    if(theme === 'white') {
      // if the user has chosen the white theme from the preferences
      data = data.replace('</head>', `<link rel="stylesheet" href="/wikipedia_styles_light${langSuffix}.css"></head>`)
    } else if(theme === 'dark') {
      // if the user has chosen the dark theme from the preferences
      data = data.replace('</head>', `<link rel="stylesheet" href="/wikipedia_styles_light${langSuffix}.css">
                                      <link rel="stylesheet" href="/wikipedia_styles_dark.css"></head>`)
    } else {
      // default, auto theme
      data = data.replace('</head>', `<link rel="stylesheet" href="/styles${langSuffix}.css"></head>`)
    }

    return data
  }

  this.processHtml = async (data, url, params, lang) => {
    if(validHtml(data.html)) {
      url = encodeURI(url)
      if(params) {
        url = `${url}?${params}`
      }

      data.html = parser.parse(data.html)

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
        if(href && (href.startsWith('/wiki/') || href.startsWith('/w/'))) {
          href = `${protocol}${config.domain}${href}`
          let u = new URL(href)
          u.searchParams.append('lang', lang)
          href = `${u.pathname}${u.search}`
          links[i].setAttribute('href', href)
        }
      }

      // remove #p-wikibase-otherprojects
      let wikibase_links = data.html.querySelector('#p-wikibase-otherprojects')
      if(wikibase_links) {
        wikibase_links.remove()
      }

      // remove all <script> elements
      let script_elements = data.html.querySelectorAll('script')
      for(let i = 0; i < script_elements.length; i++) {
        script_elements[i].remove()
      }

      // remove all <iframe> elements
      let iframe_elements = data.html.querySelectorAll('iframe')
      for(let i = 0; i < iframe_elements.length; i++) {
        iframe_elements[i].remove()
      }

      // remove all JavaScript event attributes
      let event_attributes = ['[onAbort]', '[onBlur]', '[onChange]', '[onClick]', '[onDblClick]', '[onError]', '[onFocus]', '[onKeydown]', '[onKeypress]', '[onKeyup]', '[onLoad]'
, '[onMousedown]', '[onMousemove]', '[onMouseout]', '[onMouseover]', '[onMouseUp]', '[onReset]', '[onSelect]', '[onSubmit]', '[onUnload]']
      let elements_with_event_attr = data.html.querySelectorAll(event_attributes.join(','))
      for(let i = 0; i < elements_with_event_attr.length; i++) {
        for(let j = 0; j < event_attributes.length; j++) {
          if(typeof(elements_with_event_attr.removeAttribute) === 'function') {
            elements_with_event_attr.removeAttribute(event_attributes[j])
          }
        }
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

      // replace maps.wikimedia.org with /media/maps_wikimedia_org
      const maps_wikimedia_regx = /((https:|http:|)\/\/?maps.wikimedia.org)/gm
      data.html = data.html.replace(maps_wikimedia_regx, '/media/maps_wikimedia_org')

      // replace wikimedia.org with /media
      const wikimedia_regex = /((https:|http:|)\/\/?wikimedia.org)/gm
      data.html = data.html.replace(wikimedia_regex, '/media')

      // replace wiki links
      const wiki_href_regx = /(href=\"(https:|http:|)\/\/([A-z.-]+\.)?(wikipedia.org|wikimedia.org|wikidata.org|mediawiki.org))/gm
      data.html = data.html.replace(wiki_href_regx, 'href="')

      /**
      * If we are on DownloadAsPdf page, we have to inject a input which
      * holds the language value. Without this input, we can't access the
      * language (not avail from the POST data).
      * See more on https://codeberg.org/orenom/Wikiless/issues/9
      */
      if(url.includes('%3ADownloadAsPdf')) {
        let lang_input = `<input type='hidden' name='lang' value='${lang}'>`
        let replace_str = `<input type='hidden' name='page'`
        data.html = data.html.replace(replace_str, `${lang_input}${replace_str}`)
      }

      try {
        if(redis.isOpen === false) {
          await redis.connect()
        }
        await redis.setEx(url, config.setexs.wikipage, data.html)
        return { success: true, html: data.html }
      } catch(error) {
        console.log(`Error setting the ${url} key to Redis. Error: ${error}`)
        return { success: false, reason: 'SERVER_ERROR_REDIS_SET' }
      }
    }

    console.log('Invalid wiki_html.')
    return { success: false, reason: 'INVALID_HTML' }
  }

  this.proxyMedia = async (req, wiki_domain='') => {
    let params = new URLSearchParams(req.query).toString() || ''

    if(params) {
      params = '?' + params
    }

    let path = ''
    let domain = 'upload.wikimedia.org'
    let wikimedia_path = ''

    switch (wiki_domain) {
      case 'maps.wikimedia.org':
        path = req.url.split('/media/maps_wikimedia_org')[1]
        domain = 'maps.wikimedia.org'
        wikimedia_path = path
        break;
      case '/api/rest_v1/page/pdf':
        const lang = req.query.lang || req.cookies.default_lang || config.default_lang
        domain = `${lang}.wikipedia.org`
        wikimedia_path = `/api/rest_v1/page/pdf/${req.params.page}`
        path = `/api/${lang}${wiki_domain}/${req.params.page}`
        break;
      case 'wikimedia.org/api/rest_v1/media':
        domain = 'wikimedia.org'
        wikimedia_path = req.url.replace('/media/api/rest_v1', '/api/rest_v1')
        path = req.url.split('/media/api')[1]
        break;
      default:
        path = req.url.split('/media')[1]
        wikimedia_path = path + params
    }

    url = new URL(`https://${domain}${wikimedia_path}`)
    const file = await saveFile(url, path)

    if(file.success === true) {
      return { success: true, path: file.path }
    }
    return { success: false, reason: file.reason }
  }

  this.saveFile = async (url, file_path) => {
    let media_path = ''
    if(url.href.startsWith('https://maps.wikimedia.org/')) {
      media_path = path.join(__dirname, '../media/maps_wikimedia_org')
    } else if(url.href.startsWith('https://wikimedia.org/media/api/')) {
      media_path = path.join(__dirname, '../media/api')
    } else {
      media_path = path.join(__dirname, '../media')
    }

    const path_with_filename = decodeURI(`${media_path}${file_path}`)
    const path_without_filename = path.dirname(path_with_filename)
    const options = {
      headers: { 'User-Agent': config.wikimedia_useragent }
    }

    if(!existsSync(path_with_filename)) {
      try {
        await fs.mkdir(path_without_filename, { recursive: true })
      } catch(err) {
        return { success: false, reason: 'MKDIR_FAILED' }
      }

      let body = ''
      try {
        const { body: res } = await got(url, options)
        body = res
      } catch(err) {
        console.log('Error while fetching data. Details:', err)
        return { success: false, reason: 'SERVER_ERROR' }
      }

      const encoding = url.includes('render/svg/') ? 'utf8' : 'binary'

      if(body) {
        try {
          await fs.writeFile(path_with_filename, body, encoding)
          return { success: true, path: path_with_filename }
        } catch(err) {
          console.log('Writing media file to disk failed for unknown reason. Details:', err)
          return { success: false, reason: 'WRITEFILE_FAILED' }
        }
      }
      return { success: false, reason: 'EMPTY_BODY' }
    }

    return { success: true, path: path_with_filename }
  }

  this.handleWikiPage = async (req, res, prefix) => {
    let lang = req.query.lang || req.cookies.default_lang || config.default_lang

    if(lang) {
      if(Array.isArray(lang)) {
        lang = lang[0]
      } else {
        lang = lang.split('?')[0]
      }
    }

    if(!validLang(lang)) {
      return res.status(500).send('invalid lang')
    }

    let params = new URLSearchParams(req.query).toString()

    let url = ''
    let page = ''
    let sub_page = ''

    switch (prefix) {
      case '/wiki/':
        page = req.params.page || ''
        sub_page = req.params.sub_page || ''
        if(sub_page) {
          sub_page = `/${sub_page}`
        }
        url = `https://${lang}.wikipedia.org/wiki/${page}${sub_page}`
        break
      case '/w/':
        let file = req.params.file
        url = `https://${lang}.wikipedia.org/w/${file}`
        break
      case '/wiki/Map':
        page = 'Special:Map'
        sub_page = req.params['0'] || ''
        url = `https://${lang}.wikipedia.org/wiki/${page}/${sub_page}`
        break
      case '/':
        url = `https://${lang}.wikipedia.org/?lang=${lang}`
        break
    }

    let result = await download(url, params)

    if(result.success !== true) {
      if(result.reason === 'REDIRECT' && result.url) {
        url = result.url.split('wikipedia.org')[1]
        let prefix = ''

        if(url) {
          if(url.startsWith('/w/')) {
            prefix = '/w/'
          } else if(url.startsWith('/wiki/')) {
            prefix = '/wiki/'
          } else if(url.startsWith('/api/rest_v1/page/pdf/')) {
            let page = result.url.split('/').slice(-1)[0]
            let lang_code = result.url.split('.wikipedia.org')[0].split('//')[1]
            return res.redirect(`/api/rest_v1/page/pdf/${page}/?lang=${lang_code}`)
          }
        }

        if(prefix) {
          let redirect_to = `${prefix}${result.url.split(prefix)[1]}`
          return res.redirect(redirect_to)
        }
        return res.redirect(`/?lang=${lang}`)
      }
    }

    if(result.processed === true) {
      return res.send(applyUserMods(result.html, req.cookies.theme, lang))
    }
    const process_html = await processHtml(result, url, params, lang, req.cookies)
    if(process_html.success === true) {
      return res.send(applyUserMods(process_html.html.toString(), req.cookies, lang))
    }
    return res.status(500).send(process_html.reason)
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
    if(html && parser.valid(html)) {
      return true
    }
    return false
  }

  this.wikilessLogo = () => {
    const static_path = path.join(__dirname, '../static')
    return `${static_path}/wikiless-logo.png`
  }

  this.preferencesPage = (req, res) => {
    const { default_lang, theme } = req.cookies
    let lang_select = '<select id="default_lang" name="default_lang">'
    const valid_langs = validLang('', true)

    for(let i = 0; i < valid_langs.length; i++) {
      let selected = ''
      if(valid_langs[i] === default_lang) {
        selected = 'selected'
      }
      lang_select += `<option value="${valid_langs[i]}" ${selected}>${valid_langs[i]}</option>`
    }

    lang_select += '</select>'

    const back = req.url.split('?back=')[1]

    const html = `
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
                    <option value="" ${(!theme ? 'selected' : '')}>Auto</option>
                    <option value="white" ${(theme == 'white' ? 'selected' : '')}>White</option>
                    <option value="dark" ${(theme == 'dark' ? 'selected' : '')}>Dark (experimental)</option>
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
