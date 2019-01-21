const { Duplex } = require('stream')

class SocketIoJsonStream extends Duplex {
  constructor(socket) {
    super({ objectMode: true })
    this.socket = socket

    socket.on('message', (msg) => {
      this.push(JSON.parse(msg))
    })

    socket.on('disconnect', () => {
      this.push(null)
      this.end()

      this.emit('close')
    })

    this.on('error', () => {
      socket.disconnect(true)
    })
  }

  _write(msg, encoding, next) {
    this.socket.emit('message', msg)
    next()
  }

  _read() {
    return null
  }
}

module.exports = SocketIoJsonStream
