/* global Event, CloseEvent, MessageEvent */

export default class SocketIoWebSocketAdapter {
  constructor(socket) {
    this.socket = socket
    this.onopen = null
    this.onerror = null
    this.onclose = null
    this.onmessage = null
    this.status = 0

    socket.on('connect', () => {
      this.status = 1
      if (this.onopen)
        this.onopen(new Event('open'))
    })

    socket.on('error', () => {
      if (this.onerror)
        this.onerror(new Event('error'))
    })

    socket.on('disconnect', () => {
      this.status = 3
      if (this.onclose)
        this.onclose(new CloseEvent('socket closed'))
    })

    socket.on('message', (msg) => {
      if (this.onmessage)
        this.onmessage(new MessageEvent('message', { data: msg }))
    })
  }

  get readyState() {
    return this.status
  }

  close() {
    this.status = 2
    this.socket.disconnect()
  }

  send(msg) {
    this.socket.emit('message', msg)
  }
}
