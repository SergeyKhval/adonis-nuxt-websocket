const Ws = use('Ws')

const globalMiddlewareWs = [
  'Adonis/Middleware/Session',
  'Adonis/Middleware/AuthInitWs',
]

const namedMiddlewareWs = {
  auth: 'Adonis/Middleware/AuthWs',
}

Ws.global(globalMiddlewareWs)
Ws.named(namedMiddlewareWs)
