const sharedb = use('App/ShareDB')

const Http = {}

function monkeyPatchAdonis() {
  const Event = use('Adonis/Src/Event')

  Event.emitAsync = async function emitAsync(...args) {
    return this.emitter.emitAsync(...args)
  }
}

function configureSharedbProjections() {
  sharedb.addProjection('artifacts_summary', 'artifacts', {
    name: true,
    project: true,
    owner: true,
    persona: true,
    order: true,
    type: true,
    deleted: true,
    updatedAt: true,
    createdAt: true,
    avatar: true,
    description: true,
    isSubstagesVisible: true,
  })
}

/**
 * listener for Http.start event, emitted after
 * starting http server.
 */
Http.onStart = function () {
  monkeyPatchAdonis()
  configureSharedbProjections()
}

module.exports = Http
