import sharedbClient from 'sharedb/lib/client'
import SocketIoWebSocketAdapter from '~/lib/socketio-websocket-adapter'
import { sharedbChannel } from '~/lib/sockets'
import '../../lib/monkeypatch-sharedb'

function getConnection(isServer, req) {
  if (isServer)
    return {}

  /* eslint no-underscore-dangle: 0 */
  const socket = new SocketIoWebSocketAdapter(sharedbChannel._io)

  return new sharedbClient.Connection(socket)
}

export default ({ req }, inject) => {
  inject('sharedb', getConnection(process.server, req))
}
