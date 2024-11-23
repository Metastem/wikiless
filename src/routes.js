const config = require('../config');
const path = require('path');

module.exports = (app, utils) => {
  // Middleware to handle cookies and theme/language overrides
  app.all('*', (req, res, next) => {
    const { theme, default_lang: lang } = req.query;

    if (theme) {
      req.cookies.theme = theme.toLowerCase();
      res.cookie('theme', req.cookies.theme, { maxAge: 31536000, httpOnly: true, secure: true });
    } else if (!req.cookies.theme || req.cookies.theme === '') {
      req.cookies.theme = config.theme;
    }

    if (lang) {
      req.cookies.default_lang = lang.toLowerCase();
      res.cookie('default_lang', req.cookies.default_lang, { maxAge: 31536000, httpOnly: true, secure: true });
    } else if (!req.cookies.default_lang) {
      req.cookies.default_lang = config.default_lang;
    }

    next();
  });

  // Route for handling media requests
  app.get('*', async (req, res, next) => {
    try {
      if (req.url.startsWith('/w/load.php')) return res.sendStatus(404);

      if (req.url.startsWith('/media')) {
        const media = await utils.proxyMedia(req);
        if (media?.success) {
          if (media.mime) res.setHeader('Content-Type', media.mime);
          return res.sendFile(media.path);
        }
        return res.sendStatus(404);
      }

      if (req.url.startsWith('/static/images/project-logos/') || req.url === '/static/images/mobile/copyright/wikipedia.png') {
        return res.sendFile(utils.wikilessLogo());
      }

      if (req.url.startsWith('/static/favicon/wikipedia.ico')) {
        return res.sendFile(utils.wikilessFavicon());
      }

      if (req.url.startsWith('/static/images/mobile/copyright/')) {
        const lang = req.url.match(/-(\w+)\.svg/)?.[1] || '';
        const customLogo = utils.customLogos(req.url, lang);
        if (customLogo) return res.sendFile(customLogo);
      }

      next();
    } catch (error) {
      console.error('Error in media handling route:', error);
      res.sendStatus(500);
    }
  });

  // Wiki routes
  app.get(['/wiki/:page?/:sub_page?', '/wiki//:page?/:sub_page?'], (req, res) => {
    if (req.url.startsWith('/wiki//') && req.params.page) {
      req.params.page = `/${req.params.page}`;
    }
    return utils.handleWikiPage(req, res, '/wiki/');
  });

  app.get('/w/index.php', (req, res, next) => {
    const searchQuery = req.query.search;
    if (searchQuery) {
      const lang = req.query.lang || req.cookies.default_lang || config.default_lang;
      const redirectUrl = `/wiki/${encodeURIComponent(searchQuery)}?lang=${lang}`;
      return res.redirect(redirectUrl);
    }
    next();
  });

  app.get('/api/rest_v1/page/pdf/:page', async (req, res) => {
    if (!req.params.page) return res.redirect('/');
    try {
      const media = await utils.proxyMedia(req, '/api/rest_v1/page/pdf');
      if (media?.success) {
        const filename = `${req.params.page}.pdf`;
        return res.download(media.path, filename);
      }
      res.sendStatus(404);
    } catch (error) {
      console.error('Error in PDF generation:', error);
      res.sendStatus(500);
    }
  });

  // Chinese variants redirect
  app.get('/zh*', (req, res) => {
    const [, lang, page] = req.path.split('/');
    return res.redirect(`/wiki/${page}?lang=${lang}`);
  });

  // Home route
  app.get('/', (req, res) => utils.handleWikiPage(req, res, '/'));

  // Static routes
  app.get('/about', (req, res) => res.sendFile(path.join(__dirname, '../static/about.html')));

  app.get('/preferences', (req, res) => res.send(utils.preferencesPage(req, res)));

  app.post('/preferences', (req, res) => {
    const { theme, default_lang } = req.body;
    const back = req.url.split('?back=')[1] || '/';

    res.cookie('theme', theme, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true });
    res.cookie('default_lang', default_lang, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true });

    return res.redirect(back.startsWith('/') ? back : '/');
  });

  app.post('/DownloadAsPdf', (req, res) => {
    const { page, lang } = req.body;
    if (!page) return res.redirect('/');
    const language = lang || req.cookies.default_lang || config.default_lang;
    const url = `/w/index.php?title=Special%3ADownloadAsPdf&page=${encodeURIComponent(page)}&action=redirect-to-electron&lang=${language}`;
    return res.redirect(url);
  });
};
