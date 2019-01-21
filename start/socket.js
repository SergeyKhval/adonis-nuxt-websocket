/*
|--------------------------------------------------------------------------
| Websocket
|--------------------------------------------------------------------------
|
| This file is used to register websocket channels and start the Ws server.
| Learn more about same in the official documentation.
| https://adonisjs.com/docs/websocket
|
| For middleware, do check `wsKernel.js` file.
|
*/

const Ws = use('Ws')

Ws
  .channel('sharedb', 'ShareDBController')
  // removing auth middleware for time being because it crashes redirect to dashboard for unauthed users
  // user cant download example projects and vue-router aborts redirect
  // .middleware(['auth'])
