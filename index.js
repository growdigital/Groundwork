const Metalsmith = require('metalsmith');
const cleancss = require('metalsmith-clean-css');
const collection = require('metalsmith-collections');
const concat = require('metalsmith-concat');
const dateFormat = require('metalsmith-date-formatter');
const debug = require('metalsmith-debug-ui');
const drafts = require('metalsmith-drafts');
const feed = require('metalsmith-feed');
const markdown = require('metalsmith-markdown');
const metadata = require('metalsmith-writemetadata');
const move = require('metalsmith-movey').default;
const permalinks = require('metalsmith-permalinks');
const postcss = require('metalsmith-postcss');
const templates = require('metalsmith-layouts');
const uglifyjs = require('metalsmith-uglifyjs');

Metalsmith(__dirname)
  .metadata({
    site: {
      lang: 'en-gb',
      title: 'Groundwork',
      description: 'Blank Metalsmith blog template',
      url: 'https://blank.groundwork.rocks/',
      author: 'Jake Rayson',
      publisher: 'Grow Digital',
      twitter: '@GroundworkRocks',
      fbapp_id: '545470365821360'
    }
  })
  .source('./src')
  .destination('./build')
  // Does fresh build every time. Can slow down sites with lots of pages.
  .clean(true)
  // Concatenation: the order is important
  // Concatenate CSS
  .use(
    concat({
      files: [
        'assets/css/settings/variables.css',
        'normalize.css/normalize.css',
        'assets/css/settings/base.css',
        'assets/css/settings/typography.css',
        'assets/css/settings/responsive.css',
        'modules/objects/**/*.css',
        'modules/components/**/**/*.css',
        'modules/utilities/**/**/*.css',
        'assets/css/shame.css'
      ],
      searchPaths: ['node_modules'],
      output: 'assets/styles.css'
    })
  )
  // Optimise (uglify) CSS
  .use(
    cleancss({
      files: 'assets/styles.css'
    })
  )
  // Concatenate JavaScript
  .use(
    concat({
      files: [
        'assets/js/*.js',
        'modules/objects/**/*.js',
        'modules/components/**/**/*.js',
        'modules/utilities/**/**/*.js'
      ],
      output: 'assets/scripts.js'
    })
  )
  // Optimise (uglify) JavaScript
  .use(
    uglifyjs({
      src: ['assets/scripts.js'],
      override: true,
      uglifyOptions: {
        mangle: true,
        compress: {
          unused: false,
          warnings: true
        }
      }
    })
  )
  // +1 PostCSS. Use CSS preprocessor of your choice if you’d rather!
  .use(
    postcss({
      plugins: {
        'postcss-cssnext': {}
      }
    })
  )
  // Add value draft: true to front matter
  .use(drafts())
  .use(
    collection({
      // Post collection: just posts
      post: {
        pattern: 'posts/**/*.md',
        sortBy: 'date',
        reverse: true
      },
      status: {
        pattern: 'status/**/*.md',
        sortBy: 'date',
        reverse: true
      },
      // Status collection: status & posts
      syndicate: {
        pattern: ['status/**/*.md', 'posts/**/*.md'],
        sortBy: 'date',
        reverse: true
      }
    })
  )
  // To help with debugging, use metadata
  .use(
    metadata({
      pattern: ['*.md', '*.html']
    })
  )
  // Use GitFriendlyMarkdown formatter
  .use(
    markdown({
      gfm: true
    })
  )
  // Change your date format here
  // Uses Moment.js http://momentjs.com/docs/#/displaying/
  .use(
    dateFormat({
      dates: [
        {
          key: 'date',
          format: 'ddd D MMM YYYY'
        },
        {
          key: 'statusDate',
          format: 'YYMMDD-hhmm-ss'
        }
      ]
    })
  )
  // Set permalinks
  .use(
    permalinks({
      // By default, create permalink from title field
      pattern: 'blog/:title',
      // Match pages, create permalink with slug field
      // Set permalnk: false on index.md
      linksets: [
        {
          match: { collection: 'page' },
          pattern: ':slug'
        },
        {
          match: { collection: 'status' },
          pattern: 'status/:statusDate',
          date: 'mmddyy'
        }
      ]
    })
  )
  // RSS feed for newsreaders
  .use(
    feed({
      collection: 'post',
      postDescription(file) {
        return file.contents;
      }
    })
  )
  // RSS feed for social feed
  .use(
    feed({
      collection: 'syndicate',
      destination: 'syndicate.xml'
    })
  )
  // I like Handlebars templating. You can use what you like.
  .use(
    templates({
      engine: 'handlebars',
      partials: 'partials'
    })
  )
  // Move graphics assets out of modules and into /assets/images/ directory
  .use(
    move({
      'modules/components/**/**/*.+(png|svg|ico|jpg)':
        'assets/images/{name}{ext}'
    })
  )
  // Use metalsmith-debug-ui http://localhost:3000/debug-ui
  .use(debug.report())
  // Throw error
  .build(function(err, files) {
    if (err) {
      throw err;
    }
  });
