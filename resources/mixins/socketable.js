import { sharedbChannel } from '~/lib/sockets'

export default {
  mounted() {
    if (sharedbChannel) {
      if (sharedbChannel._io.io.readyState === 'open')
        console.log('readystate = open')

      sharedbChannel._io.on('connect', this.onReadyStateChange)
      sharedbChannel._io.on('error', this.onReadyStateChange)
      sharedbChannel._io.on('disconnect', this.onReadyStateChange)
      sharedbChannel._io.on('close', this.onReadyStateChange)
      sharedbChannel._io.on('closing', this.onReadyStateChange)
      sharedbChannel._io.on('reconnect', this.onReadyStateChange)
      sharedbChannel._io.on('reconnecting', this.onReadyStateChange)
      sharedbChannel._io.on('reconnect_attempt', this.switchTransport)
    }
  },
  beforeDestroy() {
    if (sharedbChannel) {
      sharedbChannel._io.off('connect', this.onReadyStateChange)
      sharedbChannel._io.off('error', this.onReadyStateChange)
      sharedbChannel._io.off('disconnect', this.onReadyStateChange)
      sharedbChannel._io.off('close', this.onReadyStateChange)
      sharedbChannel._io.off('closing', this.onReadyStateChange)
      sharedbChannel._io.off('reconnect', this.onReadyStateChange)
      sharedbChannel._io.off('reconnecting', this.onReadyStateChange)
      sharedbChannel._io.off('reconnect_attempt', this.switchTransport)
    }
  },
  methods: {
    onReadyStateChange() {
      let onlineState
      switch (sharedbChannel._io.io.readyState) {
        case 'open':
          console.log('socket open')
          onlineState = 'online'
          break
        case 'opening':
        case 'closing':
          console.log('socket opening/closing')
          onlineState = 'connecting'
          break
        case 'closed':
          console.log('socket closed')
          onlineState = 'offline'
          break
        default:
          break
      }
    },
    switchTransport() {
      if (sharedbChannel._io.io && sharedbChannel._io.io.opts)
        sharedbChannel._io.io.opts.transports = ['polling', 'websocket']
    },
  },
}
