const path = require('path')

/*
|--------------------------------------------------------------------------
| Providers
|--------------------------------------------------------------------------
|
| Providers are building blocks for your Adonis app. Anytime you install
| a new Adonis specific package, chances are you will register the
| provider here.
|
*/
const providers = [
  '@adonisjs/framework/providers/AppProvider',
  '@adonisjs/framework/providers/ViewProvider',
  '@adonisjs/lucid/providers/LucidProvider',
  '@adonisjs/bodyparser/providers/BodyParserProvider',
  '@adonisjs/cors/providers/CorsProvider',
  '@adonisjs/shield/providers/ShieldProvider',
  '@adonisjs/session/providers/SessionProvider',
  '@adonisjs/auth/providers/AuthProvider',
  'adonis-websocket/providers/WsProvider',
  path.join(__dirname, '..', 'providers', 'ShareDBProvider'),
]

/*
|--------------------------------------------------------------------------
| Ace Providers
|--------------------------------------------------------------------------
|
| Ace providers are specific to ace, and are not registered when starting
| http server. It helps in reducing boot time.
|
*/
/*
|--------------------------------------------------------------------------
| Namespace Aliases
|--------------------------------------------------------------------------
|
| Each provider is registered with a long unique namespace. Here we alias
| them with a short unique name to keep our import statements short and
| sweet.
|
*/
const aliases = {
  Ws: 'Adonis/Addons/Ws',
}

/*
|--------------------------------------------------------------------------
| Ace Commands
|--------------------------------------------------------------------------
|
| Ace Commands are also are registered inside the IoC container. Here we
| register with Ace Kernel using their unique namespace.
|
*/
const commands = [
  'App/Commands/NuxtBuild',
]

module.exports = {
  providers,
  aliases,
  commands,
}
