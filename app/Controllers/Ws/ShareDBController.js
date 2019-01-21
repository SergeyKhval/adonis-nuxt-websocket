const SocketIoJsonStream = use('App/Lib/SocketIoJsonStream')
const sharedb = use('App/ShareDB')

class ShareDBController {
  constructor({ socket, request }) {
    this.socket = socket
    this.request = request
    const stream = new SocketIoJsonStream(socket.socket)
    sharedb.listen(stream)
  }
}

module.exports = ShareDBController
