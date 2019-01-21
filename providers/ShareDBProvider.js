require('../lib/monkeypatch-sharedb')

const { ServiceProvider } = require('@adonisjs/fold')
const ShareDB = require('sharedb')
const ShareDBMongo = require('sharedb-mongo')

class ShareDBProvider extends ServiceProvider {
  register() {
    this.app.singleton('App/ShareDB', (app) => {
      const connectionString = 'mongodb://localhost:27017/uxpressia-node-development'

      return ShareDB({
        db: new ShareDBMongo(connectionString),
        disableDocAction: true,
        disableSpaceDelimitedActions: true,
      })
    })

    this.app.singleton('App/ShareDBConnection', (app) => {
      const sharedb = app.use('App/ShareDB')
      return sharedb.connect()
    })
  }

  * boot() {
    // Everything is registered do some hard work
  }
}

module.exports = ShareDBProvider
