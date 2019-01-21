const { hooks } = require('@adonisjs/ignitor')

hooks.after.httpServer(() => {
  const Event = use('Event')
  Event.fire('Http.start')
})
