import ws from 'adonis-websocket-client'

function getWs() {
  let adonisWS
  let sharedbChannel

  if (process.browser) {
    adonisWS = ws('http://localhost:3000', {
      transports: ['websocket'],
      pingTimeout: 25000,
      pingInterval: 10000,
    })
    sharedbChannel = adonisWS.channel('sharedb')
    sharedbChannel.connect()
  }
  return { adonisWS, sharedbChannel }
}

const { adonisWS, sharedbChannel } = getWs()

export { adonisWS as ws, sharedbChannel }
