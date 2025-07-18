# Getting Started

Getting-Started
Getting Started
Hello! Thank you for checking out Fastify!

This document aims to be a gentle introduction to the framework and its features. It is an elementary preface with examples and links to other parts of the documentation.

Let's start!

Install
Install with npm:

npm i fastify

Install with yarn:

yarn add fastify

Your first server
Let's write our first server:

// Require the framework and instantiate it

// ESM
import Fastify from 'fastify'

const fastify = Fastify({
logger: true
})
// CommonJs
const fastify = require('fastify')({
logger: true
})

// Declare a route
fastify.get('/', function (request, reply) {
reply.send({ hello: 'world' })
})

// Run the server!
fastify.listen({ port: 3000 }, function (err, address) {
if (err) {
fastify.log.error(err)
process.exit(1)
}
// Server is now listening on ${address}
})

If you are using ECMAScript Modules (ESM) in your project, be sure to include "type": "module" in your package.json.

{
"type": "module"
}

Do you prefer to use async/await? Fastify supports it out-of-the-box.

// ESM
import Fastify from 'fastify'

const fastify = Fastify({
logger: true
})
// CommonJs
const fastify = require('fastify')({
logger: true
})

fastify.get('/', async (request, reply) => {
return { hello: 'world' }
})

/\*\*

- Run the server!
  \*/
  const start = async () => {
  try {
  await fastify.listen({ port: 3000 })
  } catch (err) {
  fastify.log.error(err)
  process.exit(1)
  }
  }
  start()

Awesome, that was easy.

Unfortunately, writing a complex application requires significantly more code than this example. A classic problem when you are building a new application is how to handle multiple files, asynchronous bootstrapping, and the architecture of your code.

Fastify offers an easy platform that helps to solve all of the problems outlined above, and more!

Note The above examples, and subsequent examples in this document, default to listening only on the localhost 127.0.0.1 interface. To listen on all available IPv4 interfaces the example should be modified to listen on 0.0.0.0 like so:

fastify.listen({ port: 3000, host: '0.0.0.0' }, function (err, address) {
if (err) {
fastify.log.error(err)
process.exit(1)
}
fastify.log.info(`server listening on ${address}`)
})

Similarly, specify ::1 to accept only local connections via IPv6. Or specify :: to accept connections on all IPv6 addresses, and, if the operating system supports it, also on all IPv4 addresses.

When deploying to a Docker (or another type of) container using 0.0.0.0 or :: would be the easiest method for exposing the application.

Note that when using 0.0.0.0, the address provided in the callback argument above will be the first address the wildcard refers to.

Your first plugin
As with JavaScript, where everything is an object, with Fastify everything is a plugin.

Before digging into it, let's see how it works!

Let's declare our basic server, but instead of declaring the route inside the entry point, we'll declare it in an external file (check out the route declaration docs).

// ESM
import Fastify from 'fastify'
import firstRoute from './our-first-route.js'
/\*\*

- @type {import('fastify').FastifyInstance} Instance of Fastify
  \*/
  const fastify = Fastify({
  logger: true
  })

fastify.register(firstRoute)

fastify.listen({ port: 3000 }, function (err, address) {
if (err) {
fastify.log.error(err)
process.exit(1)
}
// Server is now listening on ${address}
})

// CommonJs
/\*\*

- @type {import('fastify').FastifyInstance} Instance of Fastify
  \*/
  const fastify = require('fastify')({
  logger: true
  })

fastify.register(require('./our-first-route'))

fastify.listen({ port: 3000 }, function (err, address) {
if (err) {
fastify.log.error(err)
process.exit(1)
}
// Server is now listening on ${address}
})

// our-first-route.js

/\*\*

- Encapsulates the routes
- @param {FastifyInstance} fastify Encapsulated Fastify Instance
- @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
  \*/
  async function routes (fastify, options) {
  fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
  })
  }

//ESM
export default routes;

// CommonJs
module.exports = routes

In this example, we used the register API, which is the core of the Fastify framework. It is the only way to add routes, plugins, et cetera.

At the beginning of this guide, we noted that Fastify provides a foundation that assists with asynchronous bootstrapping of your application. Why is this important?

Consider the scenario where a database connection is needed to handle data storage. The database connection needs to be available before the server is accepting connections. How do we address this problem?

A typical solution is to use a complex callback, or promises - a system that will mix the framework API with other libraries and the application code.

Fastify handles this internally, with minimum effort!

Let's rewrite the above example with a database connection.

First, install fastify-plugin and @fastify/mongodb:

npm i fastify-plugin @fastify/mongodb

server.js

// ESM
import Fastify from 'fastify'
import dbConnector from './our-db-connector.js'
import firstRoute from './our-first-route.js'

/\*\*

- @type {import('fastify').FastifyInstance} Instance of Fastify
  \*/
  const fastify = Fastify({
  logger: true
  })
  fastify.register(dbConnector)
  fastify.register(firstRoute)

fastify.listen({ port: 3000 }, function (err, address) {
if (err) {
fastify.log.error(err)
process.exit(1)
}
// Server is now listening on ${address}
})

// CommonJs
/\*\*

- @type {import('fastify').FastifyInstance} Instance of Fastify
  \*/
  const fastify = require('fastify')({
  logger: true
  })

fastify.register(require('./our-db-connector'))
fastify.register(require('./our-first-route'))

fastify.listen({ port: 3000 }, function (err, address) {
if (err) {
fastify.log.error(err)
process.exit(1)
}
// Server is now listening on ${address}
})

our-db-connector.js

// ESM
import fastifyPlugin from 'fastify-plugin'
import fastifyMongo from '@fastify/mongodb'

/\*\*

- @param {FastifyInstance} fastify
- @param {Object} options
  \*/
  async function dbConnector (fastify, options) {
  fastify.register(fastifyMongo, {
  url: 'mongodb://localhost:27017/test_database'
  })
  }

// Wrapping a plugin function with fastify-plugin exposes the decorators
// and hooks, declared inside the plugin to the parent scope.
export default fastifyPlugin(dbConnector)

// CommonJs
/\*\*

- @type {import('fastify-plugin').FastifyPlugin}
  \*/
  const fastifyPlugin = require('fastify-plugin')

/\*\*

- Connects to a MongoDB database
- @param {FastifyInstance} fastify Encapsulated Fastify Instance
- @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
  \*/
  async function dbConnector (fastify, options) {
  fastify.register(require('@fastify/mongodb'), {
  url: 'mongodb://localhost:27017/test_database'
  })
  }

// Wrapping a plugin function with fastify-plugin exposes the decorators
// and hooks, declared inside the plugin to the parent scope.
module.exports = fastifyPlugin(dbConnector)

our-first-route.js

/\*\*

- A plugin that provide encapsulated routes
- @param {FastifyInstance} fastify encapsulated fastify instance
- @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
  \*/
  async function routes (fastify, options) {
  const collection = fastify.mongo.db.collection('test_collection')

fastify.get('/', async (request, reply) => {
return { hello: 'world' }
})

fastify.get('/animals', async (request, reply) => {
const result = await collection.find().toArray()
if (result.length === 0) {
throw new Error('No documents found')
}
return result
})

fastify.get('/animals/:animal', async (request, reply) => {
const result = await collection.findOne({ animal: request.params.animal })
if (!result) {
throw new Error('Invalid value')
}
return result
})

const animalBodyJsonSchema = {
type: 'object',
required: ['animal'],
properties: {
animal: { type: 'string' },
},
}

const schema = {
body: animalBodyJsonSchema,
}

fastify.post('/animals', { schema }, async (request, reply) => {
// we can use the `request.body` object to get the data sent by the client
const result = await collection.insertOne({ animal: request.body.animal })
return result
})
}

module.exports = routes

Wow, that was fast!

Let's recap what we have done here since we've introduced some new concepts.

As you can see, we used register for both the database connector and the registration of the routes.

This is one of the best features of Fastify, it will load your plugins in the same order you declare them, and it will load the next plugin only once the current one has been loaded. In this way, we can register the database connector in the first plugin and use it in the second (read here to understand how to handle the scope of a plugin).

Plugin loading starts when you call fastify.listen(), fastify.inject() or fastify.ready()

The MongoDB plugin uses the decorate API to add custom objects to the Fastify instance, making them available for use everywhere. Use of this API is encouraged to facilitate easy code reuse and to decrease code or logic duplication.

To dig deeper into how Fastify plugins work, how to develop new plugins, and for details on how to use the whole Fastify API to deal with the complexity of asynchronously bootstrapping an application, read the hitchhiker's guide to plugins.

Loading order of your plugins
To guarantee consistent and predictable behavior of your application, we highly recommend to always load your code as shown below:

└── plugins (from the Fastify ecosystem)
└── your plugins (your custom plugins)
└── decorators
└── hooks
└── your services

In this way, you will always have access to all of the properties declared in the current scope.

As discussed previously, Fastify offers a solid encapsulation model, to help you build your application as independent services. If you want to register a plugin only for a subset of routes, you just have to replicate the above structure.

└── plugins (from the Fastify ecosystem)
└── your plugins (your custom plugins)
└── decorators
└── hooks
└── your services
│
└── service A
│ └── plugins (from the Fastify ecosystem)
│ └── your plugins (your custom plugins)
│ └── decorators
│ └── hooks
│ └── your services
│
└── service B
└── plugins (from the Fastify ecosystem)
└── your plugins (your custom plugins)
└── decorators
└── hooks
└── your services

Validate your data
Data validation is extremely important and a core concept of the framework.

To validate incoming requests, Fastify uses JSON Schema.

Let's look at an example demonstrating validation for routes:

/\*\*

- @type {import('fastify').RouteShorthandOptions}
- @const
  \*/
  const opts = {
  schema: {
  body: {
  type: 'object',
  properties: {
  someKey: { type: 'string' },
  someOtherKey: { type: 'number' }
  }
  }
  }
  }

fastify.post('/', opts, async (request, reply) => {
return { hello: 'world' }
})

This example shows how to pass an options object to the route, which accepts a schema key that contains all of the schemas for route, body, querystring, params, and headers.

Read Validation and Serialization to learn more.

Serialize your data
Fastify has first-class support for JSON. It is extremely optimized to parse JSON bodies and serialize JSON output.

To speed up JSON serialization (yes, it is slow!) use the response key of the schema option as shown in the following example:

/\*\*

- @type {import('fastify').RouteShorthandOptions}
- @const
  \*/
  const opts = {
  schema: {
  response: {
  200: {
  type: 'object',
  properties: {
  hello: { type: 'string' }
  }
  }
  }
  }
  }

fastify.get('/', opts, async (request, reply) => {
return { hello: 'world' }
})

By specifying a schema as shown, you can speed up serialization by a factor of 2-3. This also helps to protect against leakage of potentially sensitive data, since Fastify will serialize only the data present in the response schema. Read Validation and Serialization to learn more.

Parsing request payloads
Fastify parses 'application/json' and 'text/plain' request payloads natively, with the result accessible from the Fastify request object at request.body.

The following example returns the parsed body of a request back to the client:

/\*\*

- @type {import('fastify').RouteShorthandOptions}
  \*/
  const opts = {}
  fastify.post('/', opts, async (request, reply) => {
  return request.body
  })

Read Content-Type Parser to learn more about Fastify's default parsing functionality and how to support other content types.

Extend your server
Fastify is built to be extremely extensible and minimal, we believe that a bare-bones framework is all that is necessary to make great applications possible.

In other words, Fastify is not a "batteries included" framework, and relies on an amazing ecosystem!

Test your server
Fastify does not offer a testing framework, but we do recommend a way to write your tests that uses the features and architecture of Fastify.

Read the testing documentation to learn more!

Run your server from CLI
Fastify also has CLI integration via fastify-cli, a separate tool for scaffolding and managing Fastify projects.

First, install fastify-cli:

npm i fastify-cli

You can also install it globally with -g.

Then, add the following lines to package.json:

{
"scripts": {
"start": "fastify start server.js"
}
}

And create your server file(s):

// server.js
'use strict'

module.exports = async function (fastify, opts) {
fastify.get('/', async (request, reply) => {
return { hello: 'world' }
})
}

Then run your server with:

npm start

# Recommendations

This document contains a set of recommendations when using Fastify.

Use A Reverse Proxy
HAProxy
Nginx
Kubernetes
Capacity Planning For Production
Running Multiple Instances
Use A Reverse Proxy
Node.js is an early adopter of frameworks shipping with an easy-to-use web server within the standard library. Previously, with languages like PHP or Python, one would need either a web server with specific support for the language or the ability to set up some sort of CGI gateway that works with the language. With Node.js, one can write an application that directly handles HTTP requests. As a result, the temptation is to write applications that handle requests for multiple domains, listen on multiple ports (i.e. HTTP and HTTPS), and then expose these applications directly to the Internet to handle requests.

The Fastify team strongly considers this to be an anti-pattern and extremely bad practice:

It adds unnecessary complexity to the application by diluting its focus.
It prevents horizontal scalability.
See Why should I use a Reverse Proxy if Node.js is Production Ready? for a more thorough discussion of why one should opt to use a reverse proxy.

For a concrete example, consider the situation where:

The app needs multiple instances to handle load.
The app needs TLS termination.
The app needs to redirect HTTP requests to HTTPS.
The app needs to serve multiple domains.
The app needs to serve static resources, e.g. jpeg files.
There are many reverse proxy solutions available, and your environment may dictate the solution to use, e.g. AWS or GCP. Given the above, we could use HAProxy or Nginx to solve these requirements:

HAProxy

# The global section defines base HAProxy (engine) instance configuration.

global
log /dev/log syslog
maxconn 4096
chroot /var/lib/haproxy
user haproxy
group haproxy

# Set some baseline TLS options.

tune.ssl.default-dh-param 2048
ssl-default-bind-options no-sslv3 no-tlsv10 no-tlsv11
ssl-default-bind-ciphers ECDH+AESGCM:DH+AESGCM:ECDH+AES256:DH+AES256:ECDH+AES128:DH+AES:RSA+AESGCM:RSA+AES:!aNULL:!MD5:!DSS
ssl-default-server-options no-sslv3 no-tlsv10 no-tlsv11
ssl-default-server-ciphers ECDH+AESGCM:DH+AESGCM:ECDH+AES256:DH+AES256:ECDH+AES128:DH+AES:RSA+AESGCM:RSA+AES:!aNULL:!MD5:!DSS

# Each defaults section defines options that will apply to each subsequent

# subsection until another defaults section is encountered.

defaults
log global
mode http
option httplog
option dontlognull
retries 3
option redispatch

# The following option makes haproxy close connections to backend servers

# instead of keeping them open. This can alleviate unexpected connection

# reset errors in the Node process.

option http-server-close
maxconn 2000
timeout connect 5000
timeout client 50000
timeout server 50000

# Enable content compression for specific content types.

compression algo gzip
compression type text/html text/plain text/css application/javascript

# A "frontend" section defines a public listener, i.e. an "http server"

# as far as clients are concerned.

frontend proxy

# The IP address here would be the _public_ IP address of the server.

# Here, we use a private address as an example.

bind 10.0.0.10:80

# This redirect rule will redirect all traffic that is not TLS traffic

# to the same incoming request URL on the HTTPS port.

redirect scheme https code 308 if !{ ssl_fc }

# Technically this use_backend directive is useless since we are simply

# redirecting all traffic to this frontend to the HTTPS frontend. It is

# merely included here for completeness sake.

use_backend default-server

# This frontend defines our primary, TLS only, listener. It is here where

# we will define the TLS certificates to expose and how to direct incoming

# requests.

frontend proxy-ssl

# The `/etc/haproxy/certs` directory in this example contains a set of

# certificate PEM files that are named for the domains the certificates are

# issued for. When HAProxy starts, it will read this directory, load all of

# the certificates it finds here, and use SNI matching to apply the correct

# certificate to the connection.

bind 10.0.0.10:443 ssl crt /etc/haproxy/certs

# Here we define rule pairs to handle static resources. Any incoming request

# that has a path starting with `/static`, e.g.

# `https://one.example.com/static/foo.jpeg`, will be redirected to the

# static resources server.

acl is_static path -i -m beg /static
use_backend static-backend if is_static

# Here we define rule pairs to direct requests to appropriate Node.js

# servers based on the requested domain. The `acl` line is used to match

# the incoming hostname and define a boolean indicating if it is a match.

# The `use_backend` line is used to direct the traffic if the boolean is

# true.

acl example1 hdr_sub(Host) one.example.com
use_backend example1-backend if example1

acl example2 hdr_sub(Host) two.example.com
use_backend example2-backend if example2

# Finally, we have a fallback redirect if none of the requested hosts

# match the above rules.

default_backend default-server

# A "backend" is used to tell HAProxy where to request information for the

# proxied request. These sections are where we will define where our Node.js

# apps live and any other servers for things like static assets.

backend default-server

# In this example we are defaulting unmatched domain requests to a single

# backend server for all requests. Notice that the backend server does not

# have to be serving TLS requests. This is called "TLS termination": the TLS

# connection is "terminated" at the reverse proxy.

# It is possible to also proxy to backend servers that are themselves serving

# requests over TLS, but that is outside the scope of this example.

server server1 10.10.10.2:80

# This backend configuration will serve requests for `https://one.example.com`

# by proxying requests to three backend servers in a round-robin manner.

backend example1-backend
server example1-1 10.10.11.2:80
server example1-2 10.10.11.2:80
server example2-2 10.10.11.3:80

# This one serves requests for `https://two.example.com`

backend example2-backend
server example2-1 10.10.12.2:80
server example2-2 10.10.12.2:80
server example2-3 10.10.12.3:80

# This backend handles the static resources requests.

backend static-backend
server static-server1 10.10.9.2:80

Nginx

# This upstream block groups 3 servers into one named backend fastify_app

# with 2 primary servers distributed via round-robin

# and one backup which is used when the first 2 are not reachable

# This also assumes your fastify servers are listening on port 80.

# more info: https://nginx.org/en/docs/http/ngx_http_upstream_module.html

upstream fastify_app {
server 10.10.11.1:80;
server 10.10.11.2:80;
server 10.10.11.3:80 backup;
}

# This server block asks NGINX to respond with a redirect when

# an incoming request from port 80 (typically plain HTTP), to

# the same request URL but with HTTPS as protocol.

# This block is optional, and usually used if you are handling

# SSL termination in NGINX, like in the example here.

server {

# default server is a special parameter to ask NGINX

# to set this server block to the default for this address/port

# which in this case is any address and port 80

listen 80 default_server;
listen [::]:80 default_server;

# With a server_name directive you can also ask NGINX to

# use this server block only with matching server name(s)

# listen 80;

# listen [::]:80;

# server_name example.tld;

# This matches all paths from the request and responds with

# the redirect mentioned above.

location / {
return 301 https://$host$request_uri;
}
}

# This server block asks NGINX to respond to requests from

# port 443 with SSL enabled and accept HTTP/2 connections.

# This is where the request is then proxied to the fastify_app

# server group via port 3000.

server {

# This listen directive asks NGINX to accept requests

# coming to any address, port 443, with SSL.

listen 443 ssl default_server;
listen [::]:443 ssl default_server;

# With a server_name directive you can also ask NGINX to

# use this server block only with matching server name(s)

# listen 443 ssl;

# listen [::]:443 ssl;

# server_name example.tld;

# Enable HTTP/2 support

http2 on;

# Your SSL/TLS certificate (chain) and secret key in the PEM format

ssl_certificate /path/to/fullchain.pem;
ssl_certificate_key /path/to/private.pem;

# A generic best practice baseline for based

# on https://ssl-config.mozilla.org/

ssl_session_timeout 1d;
ssl_session_cache shared:FastifyApp:10m;
ssl_session_tickets off;

# This tells NGINX to only accept TLS 1.3, which should be fine

# with most modern browsers including IE 11 with certain updates.

# If you want to support older browsers you might need to add

# additional fallback protocols.

ssl_protocols TLSv1.3;
ssl_prefer_server_ciphers off;

# This adds a header that tells browsers to only ever use HTTPS

# with this server.

add_header Strict-Transport-Security "max-age=63072000" always;

# The following directives are only necessary if you want to

# enable OCSP Stapling.

ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /path/to/chain.pem;

# Custom nameserver to resolve upstream server names

# resolver 127.0.0.1;

# This section matches all paths and proxies it to the backend server

# group specified above. Note the additional headers that forward

# information about the original request. You might want to set

# trustProxy to the address of your NGINX server so the X-Forwarded

# fields are used by fastify.

location / { # more info: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
proxy_http_version 1.1;
proxy_cache_bypass $http_upgrade;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

    # This is the directive that proxies requests to the specified server.
    # If you are using an upstream group, then you do not need to specify a port.
    # If you are directly proxying to a server e.g.
    # proxy_pass http://127.0.0.1:3000 then specify a port.
    proxy_pass http://fastify_app;

}
}

Kubernetes
The readinessProbe uses (by default) the pod IP as the hostname. Fastify listens on 127.0.0.1 by default. The probe will not be able to reach the application in this case. To make it work, the application must listen on 0.0.0.0 or specify a custom hostname in the readinessProbe.httpGet spec, as per the following example:

readinessProbe:
httpGet:
path: /health
port: 4000
initialDelaySeconds: 30
periodSeconds: 30
timeoutSeconds: 3
successThreshold: 1
failureThreshold: 5

Capacity Planning For Production
In order to rightsize the production environment for your Fastify application, it is highly recommended that you perform your own measurements against different configurations of the environment, which may use real CPU cores, virtual CPU cores (vCPU), or even fractional vCPU cores. We will use the term vCPU throughout this recommendation to represent any CPU type.

Tools such as k6 or autocannon can be used for conducting the necessary performance tests.

That said, you may also consider the following as a rule of thumb:

To have the lowest possible latency, 2 vCPU are recommended per app instance (e.g., a k8s pod). The second vCPU will mostly be used by the garbage collector (GC) and libuv threadpool. This will minimize the latency for your users, as well as the memory usage, as the GC will be run more frequently. Also, the main thread won't have to stop to let the GC run.

To optimize for throughput (handling the largest possible amount of requests per second per vCPU available), consider using a smaller amount of vCPUs per app instance. It is totally fine to run Node.js applications with 1 vCPU.

You may experiment with an even smaller amount of vCPU, which may provide even better throughput in certain use-cases. There are reports of API gateway solutions working well with 100m-200m vCPU in Kubernetes.

See Node's Event Loop From the Inside Out to understand the workings of Node.js in greater detail and make a better determination about what your specific application needs.

Running Multiple Instances
There are several use-cases where running multiple Fastify apps on the same server might be considered. A common example would be exposing metrics endpoints on a separate port, to prevent public access, when using a reverse proxy or an ingress firewall is not an option.

It is perfectly fine to spin up several Fastify instances within the same Node.js process and run them concurrently, even in high load systems. Each Fastify instance only generates as much load as the traffic it receives, plus the memory used for that Fastify instance

# Database

Database
Fastify's ecosystem provides a handful of plugins for connecting to various database engines. This guide covers engines that have Fastify plugins maintained within the Fastify organization.

If a plugin for your database of choice does not exist you can still use the database as Fastify is database agnostic. By following the examples of the database plugins listed in this guide, a plugin can be written for the missing database engine.

If you would like to write your own Fastify plugin please take a look at the plugins guide

MySQL
Install the plugin by running npm i @fastify/mysql.

Usage:

const fastify = require('fastify')()

fastify.register(require('@fastify/mysql'), {
connectionString: 'mysql://root@localhost/mysql'
})

fastify.get('/user/:id', function(req, reply) {
fastify.mysql.query(
'SELECT id, username, hash, salt FROM users WHERE id=?', [req.params.id],
function onResult (err, result) {
reply.send(err || result)
}
)
})

fastify.listen({ port: 3000 }, err => {
if (err) throw err
console.log(`server listening on ${fastify.server.address().port}`)
})

Postgres
Install the plugin by running npm i pg @fastify/postgres.

Example:

const fastify = require('fastify')()

fastify.register(require('@fastify/postgres'), {
connectionString: 'postgres://postgres@localhost/postgres'
})

fastify.get('/user/:id', function (req, reply) {
fastify.pg.query(
'SELECT id, username, hash, salt FROM users WHERE id=$1', [req.params.id],
function onResult (err, result) {
reply.send(err || result)
}
)
})

fastify.listen({ port: 3000 }, err => {
if (err) throw err
console.log(`server listening on ${fastify.server.address().port}`)
})

Redis
Install the plugin by running npm i @fastify/redis

Usage:

'use strict'

const fastify = require('fastify')()

fastify.register(require('@fastify/redis'), { host: '127.0.0.1' })
// or
fastify.register(require('@fastify/redis'), { url: 'redis://127.0.0.1', /_ other redis options _/ })

fastify.get('/foo', function (req, reply) {
const { redis } = fastify
redis.get(req.query.key, (err, val) => {
reply.send(err || val)
})
})

fastify.post('/foo', function (req, reply) {
const { redis } = fastify
redis.set(req.body.key, req.body.value, (err) => {
reply.send(err || { status: 'ok' })
})
})

fastify.listen({ port: 3000 }, err => {
if (err) throw err
console.log(`server listening on ${fastify.server.address().port}`)
})

By default @fastify/redis doesn't close the client connection when Fastify server shuts down. To opt-in to this behavior, register the client like so:

fastify.register(require('@fastify/redis'), {
client: redis,
closeClient: true
})

Mongo
Install the plugin by running npm i @fastify/mongodb

Usage:

const fastify = require('fastify')()

fastify.register(require('@fastify/mongodb'), {
// force to close the mongodb connection when app stopped
// the default value is false
forceClose: true,

url: 'mongodb://mongo/mydb'
})

fastify.get('/user/:id', async function (req, reply) {
// Or this.mongo.client.db('mydb').collection('users')
const users = this.mongo.db.collection('users')

// if the id is an ObjectId format, you need to create a new ObjectId
const id = this.mongo.ObjectId(req.params.id)
try {
const user = await users.findOne({ id })
return user
} catch (err) {
return err
}
})

fastify.listen({ port: 3000 }, err => {
if (err) throw err
})

LevelDB
Install the plugin by running npm i @fastify/leveldb

Usage:

const fastify = require('fastify')()

fastify.register(
require('@fastify/leveldb'),
{ name: 'db' }
)

fastify.get('/foo', async function (req, reply) {
const val = await this.level.db.get(req.query.key)
return val
})

fastify.post('/foo', async function (req, reply) {
await this.level.db.put(req.body.key, req.body.value)
return { status: 'ok' }
})

fastify.listen({ port: 3000 }, err => {
if (err) throw err
console.log(`server listening on ${fastify.server.address().port}`)
})

Writing plugin for a database library
We could write a plugin for a database library too (e.g. Knex, Prisma, or TypeORM). We will use Knex in our example.

'use strict'

const fp = require('fastify-plugin')
const knex = require('knex')

function knexPlugin(fastify, options, done) {
if(!fastify.knex) {
const knex = knex(options)
fastify.decorate('knex', knex)

    fastify.addHook('onClose', (fastify, done) => {
      if (fastify.knex === knex) {
        fastify.knex.destroy(done)
      }
    })

}

done()
}

export default fp(knexPlugin, { name: 'fastify-knex-example' })

Writing a plugin for a database engine
In this example, we will create a basic Fastify MySQL plugin from scratch (it is a stripped-down example, please use the official plugin in production).

const fp = require('fastify-plugin')
const mysql = require('mysql2/promise')

function fastifyMysql(fastify, options, done) {
const connection = mysql.createConnection(options)

if (!fastify.mysql) {
fastify.decorate('mysql', connection)
}

fastify.addHook('onClose', (fastify, done) => connection.end().then(done).catch(done))

done()
}

export default fp(fastifyMysql, { name: 'fastify-mysql-example' })

Migrations
Database schema migrations are an integral part of database management and development. Migrations provide a repeatable and testable way to modify a database's schema and prevent data loss.

As stated at the beginning of the guide, Fastify is database agnostic and any Node.js database migration tool can be used with it. We will give an example of using Postgrator which has support for Postgres, MySQL, SQL Server and SQLite. For MongoDB migrations, please check migrate-mongo.

Postgrator
Postgrator is Node.js SQL migration tool that uses a directory of SQL scripts to alter the database schema. Each file in a migrations folder needs to follow the pattern: [version].[action].[optional-description].sql.

version: must be an incrementing number (e.g. 001 or a timestamp).

action: should be do or undo. do implements the version, undo reverts it. Think about it like up and down in other migration tools.

optional-description describes which changes migration makes. Although optional, it should be used for all migrations as it makes it easier for everyone to know which changes are made in a migration.

In our example, we are going to have a single migration that creates a users table and we are going to use Postgrator to run the migration.

Run npm i pg postgrator to install dependencies needed for the example.

// 001.do.create-users-table.sql
CREATE TABLE IF NOT EXISTS users (
id SERIAL PRIMARY KEY NOT NULL,
created_at DATE NOT NULL DEFAULT CURRENT_DATE,
firstName TEXT NOT NULL,
lastName TEXT NOT NULL
);

const pg = require('pg')
const Postgrator = require('postgrator')
const path = require('node:path')

async function migrate() {
const client = new pg.Client({
host: 'localhost',
port: 5432,
database: 'example',
user: 'example',
password: 'example',
});

try {
await client.connect();

    const postgrator = new Postgrator({
      migrationPattern: path.join(__dirname, '/migrations/*'),
      driver: 'pg',
      database: 'example',
      schemaTable: 'migrations',
      currentSchema: 'public', // Postgres and MS SQL Server only
      execQuery: (query) => client.query(query),
    });

    const result = await postgrator.migrate()

    if (result.length === 0) {
      console.log(
        'No migrations run for schema "public". Already at the latest one.'
      )
    }

    console.log('Migration done.')

    process.exitCode = 0

} catch(err) {
console.error(err)
process.exitCode = 1
}

await client.end()
}

migrate()

# Testing

Testing is one of the most important parts of developing an application. Fastify is very flexible when it comes to testing and is compatible with most testing frameworks (such as Node Test Runner, which is used in the examples below).

Application
Let's cd into a fresh directory called 'testing-example' and type npm init -y in our terminal.

Run npm i fastify && npm i pino-pretty -D

Separating concerns makes testing easy
First, we are going to separate our application code from our server code:

app.js:

'use strict'

const fastify = require('fastify')

function build(opts={}) {
const app = fastify(opts)
app.get('/', async function (request, reply) {
return { hello: 'world' }
})

return app
}

module.exports = build

server.js:

'use strict'

const server = require('./app')({
logger: {
level: 'info',
transport: {
target: 'pino-pretty'
}
}
})

server.listen({ port: 3000 }, (err, address) => {
if (err) {
server.log.error(err)
process.exit(1)
}
})

Benefits of using fastify.inject()
Fastify comes with built-in support for fake HTTP injection thanks to light-my-request.

Before introducing any tests, we will use the .inject method to make a fake request to our route:

app.test.js:

'use strict'

const build = require('./app')

const test = async () => {
const app = build()

const response = await app.inject({
method: 'GET',
url: '/'
})

console.log('status code: ', response.statusCode)
console.log('body: ', response.body)
}
test()

First, our code will run inside an asynchronous function, giving us access to async/await.

.inject ensures all registered plugins have booted up and our application is ready to test. Finally, we pass the request method we want to use and a route. Using await we can store the response without a callback.

Run the test file in your terminal node app.test.js

status code: 200
body: {"hello":"world"}

Testing with HTTP injection
Now we can replace our console.log calls with actual tests!

In your package.json change the "test" script to:

"test": "node --test --watch"

app.test.js:

'use strict'

const { test } = require('node:test')
const build = require('./app')

test('requests the "/" route', async t => {
t.plan(1)
const app = build()

const response = await app.inject({
method: 'GET',
url: '/'
})
t.assert.strictEqual(response.statusCode, 200, 'returns a status code of 200')
})

Finally, run npm test in the terminal and see your test results!

The inject method can do much more than a simple GET request to a URL:

fastify.inject({
method: String,
url: String,
query: Object,
payload: Object,
headers: Object,
cookies: Object
}, (error, response) => {
// your tests
})

.inject methods can also be chained by omitting the callback function:

fastify
.inject()
.get('/')
.headers({ foo: 'bar' })
.query({ foo: 'bar' })
.end((err, res) => { // the .end call will trigger the request
console.log(res.payload)
})

or in the promisified version

fastify
.inject({
method: String,
url: String,
query: Object,
payload: Object,
headers: Object,
cookies: Object
})
.then(response => {
// your tests
})
.catch(err => {
// handle error
})

Async await is supported as well!

try {
const res = await fastify.inject({ method: String, url: String, payload: Object, headers: Object })
// your tests
} catch (err) {
// handle error
}

Another Example:
app.js

const Fastify = require('fastify')

function buildFastify () {
const fastify = Fastify()

fastify.get('/', function (request, reply) {
reply.send({ hello: 'world' })
})

return fastify
}

module.exports = buildFastify

test.js

const { test } = require('node:test')
const buildFastify = require('./app')

test('GET `/` route', t => {
t.plan(4)

const fastify = buildFastify()

// At the end of your tests it is highly recommended to call `.close()`
// to ensure that all connections to external services get closed.
t.after(() => fastify.close())

fastify.inject({
method: 'GET',
url: '/'
}, (err, response) => {
t.assert.ifError(err)
t.assert.strictEqual(response.statusCode, 200)
t.assert.strictEqual(response.headers['content-type'], 'application/json; charset=utf-8')
t.assert.deepStrictEqual(response.json(), { hello: 'world' })
})
})

Testing with a running server
Fastify can also be tested after starting the server with fastify.listen() or after initializing routes and plugins with fastify.ready().

Example:
Uses app.js from the previous example.

test-listen.js (testing with undici)

const { test } = require('node:test')
const { Client } = require('undici')
const buildFastify = require('./app')

test('should work with undici', async t => {
t.plan(2)

const fastify = buildFastify()

await fastify.listen()

const client = new Client(
'http://localhost:' + fastify.server.address().port, {
keepAliveTimeout: 10,
keepAliveMaxTimeout: 10
}
)

t.after(() => {
fastify.close()
client.close()
})

const response = await client.request({ method: 'GET', path: '/' })

t.assert.strictEqual(await response.body.text(), '{"hello":"world"}')
t.assert.strictEqual(response.statusCode, 200)
})

Alternatively, starting with Node.js 18, fetch may be used without requiring any extra dependencies:

test-listen.js

const { test } = require('node:test')
const buildFastify = require('./app')

test('should work with fetch', async t => {
t.plan(3)

const fastify = buildFastify()

t.after(() => fastify.close())

await fastify.listen()

const response = await fetch(
'http://localhost:' + fastify.server.address().port
)

t.assert.strictEqual(response.status, 200)
t.assert.strictEqual(
response.headers.get('content-type'),
'application/json; charset=utf-8'
)
const jsonResult = await response.json()
t.assert.strictEqual(jsonResult.hello, 'world')
})

test-ready.js (testing with SuperTest)

const { test } = require('node:test')
const supertest = require('supertest')
const buildFastify = require('./app')

test('GET `/` route', async (t) => {
const fastify = buildFastify()

t.after(() => fastify.close())

await fastify.ready()

const response = await supertest(fastify.server)
.get('/')
.expect(200)
.expect('Content-Type', 'application/json; charset=utf-8')
t.assert.deepStrictEqual(response.body, { hello: 'world' })
})

How to inspect node tests
Isolate your test by passing the {only: true} option
test('should ...', {only: true}, t => ...)

Run node --test

> node --test --test-only --inspect-brk test/<test-file.test.js>

--test-only specifies to run tests with the only option enabled
--inspect-brk will launch the node debugger
In VS Code, create and launch a Node.js: Attach debug configuration. No modification should be necessary.
Now you should be able to step through your test file (and the rest of Fastify) in your code editor.

Plugins
Let's cd into a fresh directory called 'testing-plugin-example' and type npm init -y in our terminal.

Run npm i fastify fastify-plugin

plugin/myFirstPlugin.js:

const fP = require("fastify-plugin")

async function myPlugin(fastify, options) {
fastify.decorateRequest("helloRequest", "Hello World")
fastify.decorate("helloInstance", "Hello Fastify Instance")
}

module.exports = fP(myPlugin)

A basic example of a Plugin. See Plugin Guide

test/myFirstPlugin.test.js:

const Fastify = require("fastify");
const { test } = require("node:test");
const myPlugin = require("../plugin/myFirstPlugin");

test("Test the Plugin Route", async t => {
// Create a mock fastify application to test the plugin
const fastify = Fastify()

    fastify.register(myPlugin)

    // Add an endpoint of your choice
    fastify.get("/", async (request, reply) => {
        return ({ message: request.helloRequest })
    })

    // Use fastify.inject to fake a HTTP Request
    const fastifyResponse = await fastify.inject({
        method: "GET",
        url: "/"
    })

console.log('status code: ', fastifyResponse.statusCode)
console.log('body: ', fastifyResponse.body)
})

Learn more about fastify.inject(). Run the test file in your terminal node test/myFirstPlugin.test.js

status code: 200
body: {"message":"Hello World"}

Now we can replace our console.log calls with actual tests!

In your package.json change the "test" script to:

"test": "node --test --watch"

Create the test for the endpoint.

test/myFirstPlugin.test.js:

const Fastify = require("fastify");
const { test } = require("node:test");
const myPlugin = require("../plugin/myFirstPlugin");

test("Test the Plugin Route", async t => {
// Specifies the number of test
t.plan(2)

    const fastify = Fastify()

    fastify.register(myPlugin)

    fastify.get("/", async (request, reply) => {
        return ({ message: request.helloRequest })
    })

    const fastifyResponse = await fastify.inject({
        method: "GET",
        url: "/"
    })

    t.assert.strictEqual(fastifyResponse.statusCode, 200)
    t.assert.deepStrictEqual(JSON.parse(fastifyResponse.body), { message: "Hello World" })

})

Finally, run npm test in the terminal and see your test results!

Test the .decorate() and .decorateRequest().

test/myFirstPlugin.test.js:

const Fastify = require("fastify");
const { test }= require("node:test");
const myPlugin = require("../plugin/myFirstPlugin");

test("Test the Plugin Route", async t => {
t.plan(5)
const fastify = Fastify()

    fastify.register(myPlugin)

    fastify.get("/", async (request, reply) => {
        // Testing the fastify decorators
        t.assert.ifError(request.helloRequest)
        t.assert.ok(request.helloRequest, "Hello World")
        t.assert.ok(fastify.helloInstance, "Hello Fastify Instance")
        return ({ message: request.helloRequest })
    })

    const fastifyResponse = await fastify.inject({
        method: "GET",
        url: "/"
    })
    t.assert.strictEqual(fastifyResponse.statusCode, 200)
    t.assert.deepStrictEqual(JSON.parse(fastifyResponse.body), { message: "Hello World" })

# How to write a good plugin

First, thank you for deciding to write a plugin for Fastify. Fastify is a minimal framework and plugins are its strength, so thank you.

The core principles of Fastify are performance, low overhead, and providing a good experience to our users. When writing a plugin, it is important to keep these principles in mind. Therefore, in this document, we will analyze what characterizes a quality plugin.

Need some inspiration? You can use the label "plugin suggestion" in our issue tracker!

Code
Fastify uses different techniques to optimize its code, many of which are documented in our Guides. We highly recommend you read the hitchhiker's guide to plugins to discover all the APIs you can use to build your plugin and learn how to use them.

Do you have a question or need some advice? We are more than happy to help you! Just open an issue in our help repository.

Once you submit a plugin to our ecosystem list, we will review your code and help you improve it if necessary.

Documentation
Documentation is extremely important. If your plugin is not well documented we will not accept it to the ecosystem list. Lack of quality documentation makes it more difficult for people to use your plugin, and will likely result in it going unused.

If you want to see some good examples of how to document a plugin take a look at:

@fastify/caching
@fastify/compress
@fastify/cookie
@fastify/under-pressure
@fastify/view
License
You can license your plugin as you prefer, we do not enforce any kind of license.

We prefer the MIT license because we think it allows more people to use the code freely. For a list of alternative licenses see the OSI list or GitHub's choosealicense.com.

Examples
Always put an example file in your repository. Examples are very helpful for users and give a very fast way to test your plugin. Your users will be grateful.

Test
A plugin must be thoroughly tested to verify that is working properly.

A plugin without tests will not be accepted to the ecosystem list. A lack of tests does not inspire trust nor guarantee that the code will continue to work among different versions of its dependencies.

We do not enforce any testing library. We use node:test since it offers out-of-the-box parallel testing and code coverage, but it is up to you to choose your library of preference. We highly recommend you read the Plugin Testing to learn about how to test your plugins.

Code Linter
It is not mandatory, but we highly recommend you use a code linter in your plugin. It will ensure a consistent code style and help you to avoid many errors.

We use standard since it works without the need to configure it and is very easy to integrate into a test suite.

Continuous Integration
It is not mandatory, but if you release your code as open source, it helps to use Continuous Integration to ensure contributions do not break your plugin and to show that the plugin works as intended. Both CircleCI and GitHub Actions are free for open source projects and easy to set up.

In addition, you can enable services like Dependabot, which will help you keep your dependencies up to date and discover if a new release of Fastify has some issues with your plugin.

Let's start!
Awesome, now you know everything you need to know about how to write a good plugin for Fastify! After you have built one (or more!) let us know! We will add it to the ecosystem section of our documentation!

If you want to see some real world examples, check out:

@fastify/view Templates rendering (ejs, pug, handlebars, marko) plugin support for Fastify.
@fastify/mongodb Fastify MongoDB connection plugin, with this you can share the same MongoDB connection pool in every part of your server.
@fastify/multipart Multipart support for Fastify.
@fastify/helmet Important security headers for Fastify.

# Delay Accepting Requests

Fastify provides several hooks useful for a variety of situations. One of them is the onReady hook, which is useful for executing tasks right before the server starts accepting new requests. There isn't, though, a direct mechanism to handle scenarios in which you'd like the server to start accepting specific requests and denying all others, at least up to some point.

Say, for instance, your server needs to authenticate with an OAuth provider to start serving requests. To do that it'd need to engage in the OAuth Authorization Code Flow, which would require it to listen to two requests from the authentication provider:

the Authorization Code webhook
the tokens webhook
Until the authorization flow is done you wouldn't be able to serve customer requests. What to do then?

There are several solutions for achieving that kind of behavior. Here we'll introduce one of such techniques and, hopefully, you'll be able to get things rolling asap!

Solution
Overview
The proposed solution is one of many possible ways of dealing with this scenario and many similar to it. It relies solely on Fastify, so no fancy infrastructure tricks or third-party libraries will be necessary.

To simplify things we won't be dealing with a precise OAuth flow but, instead, simulate a scenario in which some key is needed to serve a request and that key can only be retrieved in runtime by authenticating with an external provider.

The main goal here is to deny requests that would otherwise fail as early as possible and with some meaningful context. That's both useful for the server (fewer resources allocated to a bound-to-fail task) and for the client (they get some meaningful information and don't need to wait long for it).

That will be achieved by wrapping into a custom plugin two main features:

the mechanism for authenticating with the provider decorating the fastify object with the authentication key (magicKey from here onward)
the mechanism for denying requests that would, otherwise, fail
Hands-on
For this sample solution we'll be using the following:

node.js v16.14.2
npm 8.5.0
fastify 4.0.0-rc.1
fastify-plugin 3.0.1
undici 5.0.0
Say we have the following base server set up at first:

const Fastify = require('fastify')

const provider = require('./provider')

const server = Fastify({ logger: true })
const USUAL_WAIT_TIME_MS = 5000

server.get('/ping', function (request, reply) {
reply.send({ error: false, ready: request.server.magicKey !== null })
})

server.post('/webhook', function (request, reply) {
// It's good practice to validate webhook requests come from
// who you expect. This is skipped in this sample for the sake
// of simplicity

const { magicKey } = request.body
request.server.magicKey = magicKey
request.log.info('Ready for customer requests!')

reply.send({ error: false })
})

server.get('/v1\*', async function (request, reply) {
try {
const data = await provider.fetchSensitiveData(request.server.magicKey)
return { customer: true, error: false }
} catch (error) {
request.log.error({
error,
message: 'Failed at fetching sensitive data from provider',
})

    reply.statusCode = 500
    return { customer: null, error: true }

}
})

server.decorate('magicKey')

server.listen({ port: '1234' }, () => {
provider.thirdPartyMagicKeyGenerator(USUAL_WAIT_TIME_MS)
.catch((error) => {
server.log.error({
error,
message: 'Got an error while trying to get the magic key!'
})

      // Since we won't be able to serve requests, might as well wrap
      // things up
      server.close(() => process.exit(1))
    })

})

Our code is simply setting up a Fastify server with a few routes:

a /ping route that specifies whether the service is ready or not to serve requests by checking if the magicKey has been set up
a /webhook endpoint for our provider to reach back to us when they're ready to share the magicKey. The magicKey is, then, saved into the previously set decorator on the fastify object
a catchall /v1\* route to simulate what would have been customer-initiated requests. These requests rely on us having a valid magicKey
The provider.js file, simulating actions of an external provider, is as follows:

const { fetch } = require('undici')
const { setTimeout } = require('node:timers/promises')

const MAGIC_KEY = '12345'

const delay = setTimeout

exports.thirdPartyMagicKeyGenerator = async (ms) => {
// Simulate processing delay
await delay(ms)

// Simulate webhook request to our server
const { status } = await fetch(
'http://localhost:1234/webhook',
{
body: JSON.stringify({ magicKey: MAGIC_KEY }),
method: 'POST',
headers: {
'content-type': 'application/json',
},
},
)

if (status !== 200) {
throw new Error('Failed to fetch magic key')
}
}

exports.fetchSensitiveData = async (key) => {
// Simulate processing delay
await delay(700)
const data = { sensitive: true }

if (key === MAGIC_KEY) {
return data
}

throw new Error('Invalid key')
}

The most important snippet here is the thirdPartyMagicKeyGenerator function, which will wait for 5 seconds and, then, make the POST request to our /webhook endpoint.

When our server spins up we start listening to new connections without having our magicKey set up. Until we receive the webhook request from our external provider (in this example we're simulating a 5 second delay) all our requests under the /v1\* path (customer requests) will fail. Worse than that: they'll fail after we've reached out to our provider with an invalid key and got an error from them. That wasted time and resources for us and our customers. Depending on the kind of application we're running and on the request rate we're expecting this delay is not acceptable or, at least, very annoying.

Of course, that could be simply mitigated by checking whether or not the magicKey has been set up before hitting the provider in the /v1\* handler. Sure, but that would lead to bloat in the code. And imagine we have dozens of different routes, with different controllers, that require that key. Should we repeatedly add that check to all of them? That's error-prone and there are more elegant solutions.

What we'll do to improve this setup overall is create a Plugin that'll be solely responsible for making sure we both:

do not accept requests that would otherwise fail until we're ready for them
make sure we reach out to our provider as soon as possible
This way we'll make sure all our setup regarding this specific business rule is placed on a single entity, instead of scattered all across our code base.

With the changes to improve this behavior, the code will look like this:

index.js
const Fastify = require('fastify')

const customerRoutes = require('./customer-routes')
const { setup, delay } = require('./delay-incoming-requests')

const server = new Fastify({ logger: true })

server.register(setup)

// Non-blocked URL
server.get('/ping', function (request, reply) {
reply.send({ error: false, ready: request.server.magicKey !== null })
})

// Webhook to handle the provider's response - also non-blocked
server.post('/webhook', function (request, reply) {
// It's good practice to validate webhook requests really come from
// whoever you expect. This is skipped in this sample for the sake
// of simplicity

const { magicKey } = request.body
request.server.magicKey = magicKey
request.log.info('Ready for customer requests!')

reply.send({ error: false })
})

// Blocked URLs
// Mind we're building a new plugin by calling the `delay` factory with our
// customerRoutes plugin
server.register(delay(customerRoutes), { prefix: '/v1' })

server.listen({ port: '1234' })

provider.js
const { fetch } = require('undici')
const { setTimeout } = require('node:timers/promises')

const MAGIC_KEY = '12345'

const delay = setTimeout

exports.thirdPartyMagicKeyGenerator = async (ms) => {
// Simulate processing delay
await delay(ms)

// Simulate webhook request to our server
const { status } = await fetch(
'http://localhost:1234/webhook',
{
body: JSON.stringify({ magicKey: MAGIC_KEY }),
method: 'POST',
headers: {
'content-type': 'application/json',
},
},
)

if (status !== 200) {
throw new Error('Failed to fetch magic key')
}
}

exports.fetchSensitiveData = async (key) => {
// Simulate processing delay
await delay(700)
const data = { sensitive: true }

if (key === MAGIC_KEY) {
return data
}

throw new Error('Invalid key')
}

delay-incoming-requests.js
const fp = require('fastify-plugin')

const provider = require('./provider')

const USUAL_WAIT_TIME_MS = 5000

async function setup(fastify) {
// As soon as we're listening for requests, let's work our magic
fastify.server.on('listening', doMagic)

// Set up the placeholder for the magicKey
fastify.decorate('magicKey')

// Our magic -- important to make sure errors are handled. Beware of async
// functions outside `try/catch` blocks
// If an error is thrown at this point and not captured it'll crash the
// application
function doMagic() {
fastify.log.info('Doing magic!')

    provider.thirdPartyMagicKeyGenerator(USUAL_WAIT_TIME_MS)
      .catch((error) => {
        fastify.log.error({
          error,
          message: 'Got an error while trying to get the magic key!'
        })

        // Since we won't be able to serve requests, might as well wrap
        // things up
        fastify.close(() => process.exit(1))
      })

}
}

const delay = (routes) =>
function (fastify, opts, done) {
// Make sure customer requests won't be accepted if the magicKey is not
// available
fastify.addHook('onRequest', function (request, reply, next) {
if (!request.server.magicKey) {
reply.statusCode = 503
reply.header('Retry-After', USUAL_WAIT_TIME_MS)
reply.send({ error: true, retryInMs: USUAL_WAIT_TIME_MS })
}

      next()
    })

    // Register to-be-delayed routes
    fastify.register(routes, opts)

    done()

}

module.exports = {
setup: fp(setup),
delay,
}

customer-routes.js
const fp = require('fastify-plugin')

const provider = require('./provider')

module.exports = fp(async function (fastify) {
fastify.get('\*', async function (request ,reply) {
try {
const data = await provider.fetchSensitiveData(request.server.magicKey)
return { customer: true, error: false }
} catch (error) {
request.log.error({
error,
message: 'Failed at fetching sensitive data from provider',
})

      reply.statusCode = 500
      return { customer: null, error: true }
    }

})
})

There is a very specific change on the previously existing files that is worth mentioning: Beforehand we were using the server.listen callback to start the authentication process with the external provider and we were decorating the server object right before initializing the server. That was bloating our server initialization setup with unnecessary code and didn't have much to do with starting the Fastify server. It was a business logic that didn't have its specific place in the code base.

Now we've implemented the delayIncomingRequests plugin in the delay-incoming-requests.js file. That's, in truth, a module split into two different plugins that will build up to a single use-case. That's the brains of our operation. Let's walk through what the plugins do:

setup
The setup plugin is responsible for making sure we reach out to our provider asap and store the magicKey somewhere available to all our handlers.

fastify.server.on('listening', doMagic)

As soon as the server starts listening (very similar behavior to adding a piece of code to the server.listen's callback function) a listening event is emitted (for more info refer to https://nodejs.org/api/net.html#event-listening). We use that to reach out to our provider as soon as possible, with the doMagic function.

fastify.decorate('magicKey')

The magicKey decoration is also part of the plugin now. We initialize it with a placeholder, waiting for the valid value to be retrieved.

delay
delay is not a plugin itself. It's actually a plugin factory. It expects a Fastify plugin with routes and exports the actual plugin that'll handle enveloping those routes with an onRequest hook that will make sure no requests are handled until we're ready for them.

const delay = (routes) =>
function (fastify, opts, done) {
// Make sure customer requests won't be accepted if the magicKey is not
// available
fastify.addHook('onRequest', function (request, reply, next) {
if (!request.server.magicKey) {
reply.statusCode = 503
reply.header('Retry-After', USUAL_WAIT_TIME_MS)
reply.send({ error: true, retryInMs: USUAL_WAIT_TIME_MS })
}

      next()
    })

    // Register to-be-delayed routes
    fastify.register(routes, opts)

    done()

}

Instead of updating every single controller that might use the magicKey, we simply make sure that no route that's related to customer requests will be served until we have everything ready. And there's more: we fail FAST and have the possibility of giving the customer meaningful information, like how long they should wait before retrying the request. Going even further, by issuing a 503 status code we're signaling to our infrastructure components (namely load balancers) that we're still not ready to take incoming requests and they should redirect traffic to other instances, if available. Additionally, we are providing a Retry-After header with the time in milliseconds the client should wait before retrying.

It's noteworthy that we didn't use the fastify-plugin wrapper in the delay factory. That's because we wanted the onRequest hook to only be set within that specific scope and not to the scope that called it (in our case, the main server object defined in index.js). fastify-plugin sets the skip-override hidden property, which has a practical effect of making whatever changes we make to our fastify object available to the upper scope. That's also why we used it with the customerRoutes plugin: we wanted those routes to be available to its calling scope, the delay plugin. For more info on that subject refer to Plugins.

Let's see how that behaves in action. If we fired our server up with node index.js and made a few requests to test things out. These were the logs we'd see (some bloat was removed to ease things up):

{"time":1650063793316,"msg":"Doing magic!"}
{"time":1650063793316,"msg":"Server listening at http://127.0.0.1:1234"}
{"time":1650063795030,"reqId":"req-1","req":{"method":"GET","url":"/v1","hostname":"localhost:1234","remoteAddress":"127.0.0.1","remotePort":51928},"msg":"incoming request"}
{"time":1650063795033,"reqId":"req-1","res":{"statusCode":503},"responseTime":2.5721680000424385,"msg":"request completed"}
{"time":1650063796248,"reqId":"req-2","req":{"method":"GET","url":"/ping","hostname":"localhost:1234","remoteAddress":"127.0.0.1","remotePort":51930},"msg":"incoming request"}
{"time":1650063796248,"reqId":"req-2","res":{"statusCode":200},"responseTime":0.4802369996905327,"msg":"request completed"}
{"time":1650063798377,"reqId":"req-3","req":{"method":"POST","url":"/webhook","hostname":"localhost:1234","remoteAddress":"127.0.0.1","remotePort":51932},"msg":"incoming request"}
{"time":1650063798379,"reqId":"req-3","msg":"Ready for customer requests!"}
{"time":1650063798379,"reqId":"req-3","res":{"statusCode":200},"responseTime":1.3567829988896847,"msg":"request completed"}
{"time":1650063799858,"reqId":"req-4","req":{"method":"GET","url":"/v1","hostname":"localhost:1234","remoteAddress":"127.0.0.1","remotePort":51934},"msg":"incoming request"}
{"time":1650063800561,"reqId":"req-4","res":{"statusCode":200},"responseTime":702.4662979990244,"msg":"request completed"}

Let's focus on a few parts:

{"time":1650063793316,"msg":"Doing magic!"}
{"time":1650063793316,"msg":"Server listening at http://127.0.0.1:1234"}

These are the initial logs we'd see as soon as the server started. We reach out to the external provider as early as possible within a valid time window (we couldn't do that before the server was ready to receive connections).

While the server is still not ready, a few requests are attempted:

{"time":1650063795030,"reqId":"req-1","req":{"method":"GET","url":"/v1","hostname":"localhost:1234","remoteAddress":"127.0.0.1","remotePort":51928},"msg":"incoming request"}
{"time":1650063795033,"reqId":"req-1","res":{"statusCode":503},"responseTime":2.5721680000424385,"msg":"request completed"}
{"time":1650063796248,"reqId":"req-2","req":{"method":"GET","url":"/ping","hostname":"localhost:1234","remoteAddress":"127.0.0.1","remotePort":51930},"msg":"incoming request"}
{"time":1650063796248,"reqId":"req-2","res":{"statusCode":200},"responseTime":0.4802369996905327,"msg":"request completed"}

The first one (req-1) was a GET /v1, that failed (FAST - responseTime is in ms) with our 503 status code and the meaningful information in the response. Below is the response for that request:

HTTP/1.1 503 Service Unavailable
Connection: keep-alive
Content-Length: 31
Content-Type: application/json; charset=utf-8
Date: Fri, 15 Apr 2022 23:03:15 GMT
Keep-Alive: timeout=5
Retry-After: 5000

{
"error": true,
"retryInMs": 5000
}

Then we attempted a new request (req-2), which was a GET /ping. As expected, since that was not one of the requests we asked our plugin to filter, it succeeded. That could also be used as a means of informing an interested party whether or not we were ready to serve requests (although /ping is more commonly associated with liveness checks and that would be the responsibility of a readiness check -- the curious reader can get more info on these terms) here with the ready field. Below is the response to that request:

HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 29
Content-Type: application/json; charset=utf-8
Date: Fri, 15 Apr 2022 23:03:16 GMT
Keep-Alive: timeout=5

{
"error": false,
"ready": false
}

After that, there were more interesting log messages:

{"time":1650063798377,"reqId":"req-3","req":{"method":"POST","url":"/webhook","hostname":"localhost:1234","remoteAddress":"127.0.0.1","remotePort":51932},"msg":"incoming request"}
{"time":1650063798379,"reqId":"req-3","msg":"Ready for customer requests!"}
{"time":1650063798379,"reqId":"req-3","res":{"statusCode":200},"responseTime":1.3567829988896847,"msg":"request completed"}

This time it was our simulated external provider hitting us to let us know authentication had gone well and telling us what our magicKey was. We saved that into our magicKey decorator and celebrated with a log message saying we were now ready for customers to hit us!

{"time":1650063799858,"reqId":"req-4","req":{"method":"GET","url":"/v1","hostname":"localhost:1234","remoteAddress":"127.0.0.1","remotePort":51934},"msg":"incoming request"}
{"time":1650063800561,"reqId":"req-4","res":{"statusCode":200},"responseTime":702.4662979990244,"msg":"request completed"}

Finally, a final GET /v1 request was made and, this time, it succeeded. Its response was the following:

HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 31
Content-Type: application/json; charset=utf-8
Date: Fri, 15 Apr 2022 23:03:20 GMT
Keep-Alive: timeout=5

{
"customer": true,
"error": false
}

Conclusion
Specifics of the implementation will vary from one problem to another, but the main goal of this guide was to show a very specific use case of an issue that could be solved within Fastify's ecosystem.

This guide is a tutorial on the use of plugins, decorators, and hooks to solve the problem of delaying serving specific requests on our application. It's not production-ready, as it keeps local state (the magicKey) and it's not horizontally scalable (we don't want to flood our provider, right?). One way of improving it would be storing the magicKey somewhere else (perhaps a cache database?).

The keywords here were Decorators, Hooks, and Plugins. Combining what Fastify has to offer can lead to very ingenious and creative solutions to a wide variety of problems. Let's be creative! :)

# Detecting When Clients Abort

Introduction
Fastify provides request events to trigger at certain points in a request's lifecycle. However, there isn't a built-in mechanism to detect unintentional client disconnection scenarios such as when the client's internet connection is interrupted. This guide covers methods to detect if and when a client intentionally aborts a request.

Keep in mind, Fastify's clientErrorHandler is not designed to detect when a client aborts a request. This works in the same way as the standard Node HTTP module, which triggers the clientError event when there is a bad request or exceedingly large header data. When a client aborts a request, there is no error on the socket and the clientErrorHandler will not be triggered.

Solution
Overview
The proposed solution is a possible way of detecting when a client intentionally aborts a request, such as when a browser is closed or the HTTP request is aborted from your client application. If there is an error in your application code that results in the server crashing, you may require additional logic to avoid a false abort detection.

The goal here is to detect when a client intentionally aborts a connection so your application logic can proceed accordingly. This can be useful for logging purposes or halting business logic.

Hands-on
Say we have the following base server set up:

import Fastify from 'fastify';

const sleep = async (time) => {
return await new Promise(resolve => setTimeout(resolve, time || 1000));
}

const app = Fastify({
logger: {
transport: {
target: 'pino-pretty',
options: {
translateTime: 'HH:MM:ss Z',
ignore: 'pid,hostname',
},
},
},
})

app.addHook('onRequest', async (request, reply) => {
request.raw.on('close', () => {
if (request.raw.aborted) {
app.log.info('request closed')
}
})
})

app.get('/', async (request, reply) => {
await sleep(3000)
reply.code(200).send({ ok: true })
})

const start = async () => {
try {
await app.listen({ port: 3000 })
} catch (err) {
app.log.error(err)
process.exit(1)
}
}

start()

Our code is setting up a Fastify server which includes the following functionality:

Accepting requests at http://localhost:3000, with a 3 second delayed response of { ok: true }.
An onRequest hook that triggers when every request is received.
Logic that triggers in the hook when the request is closed.
Logging that occurs when the closed request property aborted is true.
Whilst the aborted property has been deprecated, destroyed is not a suitable replacement as the Node.js documentation suggests. A request can be destroyed for various reasons, such as when the server closes the connection. The aborted property is still the most reliable way to detect when a client intentionally aborts a request.

You can also perform this logic outside of a hook, directly in a specific route.

app.get('/', async (request, reply) => {
request.raw.on('close', () => {
if (request.raw.aborted) {
app.log.info('request closed')
}
})
await sleep(3000)
reply.code(200).send({ ok: true })
})

At any point in your business logic, you can check if the request has been aborted and perform alternative actions.

app.get('/', async (request, reply) => {
await sleep(3000)
if (request.raw.aborted) {
// do something here
}
await sleep(3000)
reply.code(200).send({ ok: true })
})

A benefit to adding this in your application code is that you can log Fastify details such as the reqId, which may be unavailable in lower-level code that only has access to the raw request information.

Testing
To test this functionality you can use an app like Postman and cancel your request within 3 seconds. Alternatively, you can use Node to send an HTTP request with logic to abort the request before 3 seconds. Example:

const controller = new AbortController();
const signal = controller.signal;

(async () => {
try {
const response = await fetch('http://localhost:3000', { signal });
const body = await response.text();
console.log(body);
} catch (error) {
console.error(error);
}
})();

setTimeout(() => {
controller.abort()
}, 1000);

With either approach, you should see the Fastify log appear at the moment the request is aborted.

Conclusion
Specifics of the implementation will vary from one problem to another, but the main goal of this guide was to show a very specific use case of an issue that could be solved within Fastify's ecosystem.

You can listen to the request close event and determine if the request was aborted or if it was successfully delivered. You can implement this solution in an onRequest hook or directly in an individual route.

This approach will not trigger in the event of internet disruption, and such detection would require additional business logic. If you have flawed backend application logic that results in a server crash, then you could trigger a false detection. The clientErrorHandler, either by default or with custom logic, is not intended to handle this scenario and will not trigger when the client aborts a request.

# Ecosystem

@fastify/accepts to have accepts in your request object.
@fastify/accepts-serializer to serialize to output according to the Accept header.
@fastify/auth Run multiple auth functions in Fastify.
@fastify/autoload Require all plugins in a directory.
@fastify/awilix Dependency injection support for Fastify, based on awilix.
@fastify/aws-lambda allows you to easily build serverless web applications/services and RESTful APIs using Fastify on top of AWS Lambda and Amazon API Gateway.
@fastify/basic-auth Basic auth plugin for Fastify.
@fastify/bearer-auth Bearer auth plugin for Fastify.
@fastify/caching General server-side cache and ETag support.
@fastify/circuit-breaker A low overhead circuit breaker for your routes.
@fastify/compress Fastify compression utils.
@fastify/cookie Parse and set cookie headers.
@fastify/cors Enables the use of CORS in a Fastify application.
@fastify/csrf-protection A plugin for adding CSRF protection to Fastify.
@fastify/elasticsearch Plugin to share the same ES client.
@fastify/env Load and check configuration.
@fastify/etag Automatically generate ETags for HTTP responses.
@fastify/express Express compatibility layer for Fastify.
@fastify/flash Set and get flash messages using the session.
@fastify/formbody Plugin to parse x-www-form-urlencoded bodies.
@fastify/funky Makes functional programming in Fastify more convenient. Adds support for Fastify routes returning functional structures, such as Either, Task or plain parameterless function.
@fastify/helmet Important security headers for Fastify.
@fastify/hotwire Use the Hotwire pattern with Fastify.
@fastify/http-proxy Proxy your HTTP requests to another server, with hooks.
@fastify/jwt JWT utils for Fastify, internally uses fast-jwt.
@fastify/kafka Plugin to interact with Apache Kafka.
@fastify/leveldb Plugin to share a common LevelDB connection across Fastify.
@fastify/middie Middleware engine for Fastify.
@fastify/mongodb Fastify MongoDB connection plugin, with which you can share the same MongoDB connection pool across every part of your server.
@fastify/multipart Multipart support for Fastify.
@fastify/mysql Fastify MySQL connection plugin.
@fastify/nextjs React server-side rendering support for Fastify with Next.
@fastify/oauth2 Wrap around simple-oauth2.
@fastify/one-line-logger Formats Fastify's logs into a nice one-line message.
@fastify/otel OpenTelemetry instrumentation library.
@fastify/passport Use Passport strategies to authenticate requests and protect route.
@fastify/postgres Fastify PostgreSQL connection plugin, with this you can share the same PostgreSQL connection pool in every part of your server.
@fastify/rate-limit A low overhead rate limiter for your routes.
@fastify/redis Fastify Redis connection plugin, with which you can share the same Redis connection across every part of your server.
@fastify/reply-from Plugin to forward the current HTTP request to another server.
@fastify/request-context Request-scoped storage, based on AsyncLocalStorage (with fallback to cls-hooked), providing functionality similar to thread-local storages.
@fastify/response-validation A simple plugin that enables response validation for Fastify.
@fastify/routes Plugin that provides a Map of routes.
@fastify/routes-stats Provide stats for routes using node:perf_hooks.
@fastify/schedule Plugin for scheduling periodic jobs, based on toad-scheduler.
@fastify/secure-session Create a secure stateless cookie session for Fastify.
@fastify/sensible Defaults for Fastify that everyone can agree on. It adds some useful decorators such as HTTP errors and assertions, but also more request and reply methods.
@fastify/session a session plugin for Fastify.
@fastify/static Plugin for serving static files as fast as possible.
@fastify/swagger Plugin for serving Swagger/OpenAPI documentation for Fastify, supporting dynamic generation.
@fastify/swagger-ui Plugin for serving Swagger UI.
@fastify/throttle Plugin for throttling the download speed of a request.
@fastify/type-provider-json-schema-to-ts Fastify type provider for json-schema-to-ts.
@fastify/type-provider-typebox Fastify type provider for Typebox.
@fastify/under-pressure Measure process load with automatic handling of "Service Unavailable" plugin for Fastify.
@fastify/url-data Decorate the Request object with a method to access raw URL components.
@fastify/view Templates rendering (ejs, pug, handlebars, marko) plugin support for Fastify.
@fastify/vite Integration with Vite, allows for serving SPA/MPA/SSR Vite applications.
@fastify/websocket WebSocket support for Fastify. Built upon ws.
@fastify/zipkin Plugin for Zipkin distributed tracing system.
Community
ℹ️ Note: Fastify community plugins are part of the broader community efforts, and we are thankful for these contributions. However, they are not maintained by the Fastify team. Use them at your own discretion. If you find malicious code, please open an issue or submit a PR to remove the plugin from the list.

@aaroncadillac/crudify-mongo A simple way to add a crud in your fastify project.
@applicazza/fastify-nextjs Alternate Fastify and Next.js integration.
@blastorg/fastify-aws-dynamodb-cache A plugin to help with caching API responses using AWS DynamoDB.
@clerk/fastify Add authentication and user management to your Fastify application with Clerk.
@coobaha/typed-fastify Strongly typed routes with a runtime validation using JSON schema generated from types.
@dnlup/fastify-doc A plugin for sampling process metrics.
@dnlup/fastify-traps A plugin to close the server gracefully on SIGINT and SIGTERM signals.
@eropple/fastify-openapi3 Provides easy, developer-friendly OpenAPI 3.1 specs + doc explorer based on your routes.
@ethicdevs/fastify-custom-session A plugin lets you use session and decide only where to load/save from/to. Has great TypeScript support + built-in adapters for common ORMs/databases (Firebase, Prisma Client, Postgres (wip), InMemory) and you can easily make your own adapter!
@ethicdevs/fastify-git-server A plugin to easily create git server and make one/many Git repositories available for clone/fetch/push through the standard git (over http) commands.
@exortek/fastify-mongo-sanitize A Fastify plugin that protects against No(n)SQL injection by sanitizing data.
@exortek/remix-fastify Fastify plugin for Remix.
@fastify-userland/request-id Fastify Request ID Plugin
@fastify-userland/typeorm-query-runner Fastify typeorm QueryRunner plugin
@gquittet/graceful-server Tiny (~5k), Fast, KISS, and dependency-free Node.js library to make your Fastify API graceful.
@h4ad/serverless-adapter Run REST APIs and other web applications using your existing Node.js application framework (Express, Koa, Hapi and Fastify), on top of AWS Lambda, Huawei and many other clouds.
@immobiliarelabs/fastify-metrics Minimalistic and opinionated plugin that collects usage/process metrics and dispatches to statsd.
@inaiat/fastify-papr A plugin to integrate Papr, the MongoDB ORM for TypeScript & MongoDB, with Fastify.
@jerome1337/fastify-enforce-routes-pattern A Fastify plugin that enforces naming pattern for routes path.
@joggr/fastify-prisma A plugin for accessing an instantiated PrismaClient on your server.
@mgcrea/fastify-graceful-exit A plugin to close the server gracefully
@mgcrea/fastify-request-logger A plugin to enable compact request logging for Fastify
@mgcrea/fastify-session Session plugin for Fastify that supports both stateless and stateful sessions
@mgcrea/fastify-session-redis-store Redis store for @mgcrea/fastify-session using ioredis
@mgcrea/fastify-session-sodium-crypto Fast sodium-based crypto for @mgcrea/fastify-session
@mgcrea/pino-pretty-compact A custom compact pino-base prettifier
@pybot/fastify-autoload Plugin to generate routes automatically with valid json content
@scalar/fastify-api-reference Beautiful OpenAPI/Swagger API references for Fastify
@trubavuong/fastify-seaweedfs SeaweedFS for Fastify
apitally Fastify plugin to integrate with Apitally, an API analytics, logging and monitoring tool.
arecibo Fastify ping responder for Kubernetes Liveness and Readiness Probes.
aws-xray-sdk-fastify A Fastify plugin to log requests and subsegments through AWSXray.
cls-rtracer Fastify middleware for CLS-based request ID generation. An out-of-the-box solution for adding request IDs into your logs.
electron-server A plugin for using Fastify without the need of consuming a port on Electron apps.
fast-water A Fastify plugin for waterline. Decorates Fastify with waterline models.
fastify-204 Fastify plugin that return 204 status on empty response.
fastify-405 Fastify plugin that adds 405 HTTP status to your routes
fastify-allow Fastify plugin that automatically adds an Allow header to responses with routes. Also sends 405 responses for routes that have a handler but not for the request's method.
fastify-amqp Fastify AMQP connection plugin, to use with RabbitMQ or another connector. Just a wrapper to amqplib.
fastify-amqp-async Fastify AMQP plugin with a Promise-based API provided by amqplib-as-promised.
fastify-angular-universal Angular server-side rendering support using @angular/platform-server for Fastify
fastify-api-key Fastify plugin to authenticate HTTP requests based on API key and signature
fastify-appwrite Fastify Plugin for interacting with Appwrite server.
fastify-asyncforge Plugin to access Fastify instance, logger, request and reply from Node.js Async Local Storage.
fastify-at-mysql Fastify MySQL plugin with auto SQL injection attack prevention.
fastify-at-postgres Fastify Postgres plugin with auto SQL injection attack prevention.
fastify-auth0-verify: Auth0 verification plugin for Fastify, internally uses fastify-jwt and jsonwebtoken.
fastify-autocrud Plugin to auto-generate CRUD routes as fast as possible.
fastify-autoroutes Plugin to scan and load routes based on filesystem path from a custom directory.
fastify-aws-sns Fastify plugin for AWS Simple Notification Service (AWS SNS) that coordinates and manages the delivery or sending of messages to subscribing endpoints or clients.
fastify-aws-timestream Fastify plugin for managing databases, tables, and querying and creating scheduled queries with AWS Timestream.
fastify-axios Plugin to send HTTP requests via axios.
fastify-babel Fastify plugin for development servers that require Babel transformations of JavaScript sources.
fastify-bcrypt A Bcrypt hash generator & checker.
fastify-better-sqlite3 Plugin for better-sqlite3.
fastify-blipp Prints your routes to the console, so you definitely know which endpoints are available.
fastify-bookshelf Fastify plugin to add bookshelf.js ORM support.
fastify-boom Fastify plugin to add boom support.
fastify-bree Fastify plugin to add bree support.
fastify-bugsnag Fastify plugin to add support for Bugsnag error reporting.
fastify-cacheman Small and efficient cache provider for Node.js with In-memory, File, Redis and MongoDB engines for Fastify
fastify-casbin Casbin support for Fastify.
fastify-casbin-rest Casbin support for Fastify based on a RESTful model.
fastify-casl Fastify CASL plugin that supports ACL-like protection of endpoints via either a preSerialization & preHandler hook, sanitizing the inputs and outputs of your application based on user rights.
fastify-cloudevents Fastify plugin to generate and forward Fastify events in the Cloudevents format.
fastify-cloudflare-turnstile Fastify plugin for CloudFlare Turnstile.
fastify-cloudinary Plugin to share a common Cloudinary connection across Fastify.
fastify-cockroachdb Fastify plugin to connect to a CockroachDB PostgreSQL instance via the Sequelize ORM.
fastify-constraints Fastify plugin to add constraints to multiple routes
fastify-couchdb Fastify plugin to add CouchDB support via nano.
fastify-crud-generator A plugin to rapidly generate CRUD routes for any entity.
fastify-custom-healthcheck Fastify plugin to add health route in your server that asserts custom functions.
fastify-decorators Fastify plugin that provides the set of TypeScript decorators.
fastify-delay-request Fastify plugin that allows requests to be delayed whilst a task the response is dependent on is run, such as a resource intensive process.
fastify-disablecache Fastify plugin to disable client-side caching, inspired by nocache.
fastify-dynamodb AWS DynamoDB plugin for Fastify. It exposes AWS.DynamoDB.DocumentClient() object.
fastify-dynareg Dynamic plugin register for Fastify.
fastify-envalid Fastify plugin to integrate envalid in your Fastify project.
fastify-error-page Fastify plugin to print errors in structured HTML to the browser.
fastify-esso The easiest authentication plugin for Fastify, with built-in support for Single sign-on (and great documentation).
fastify-event-bus Event bus support for Fastify. Built upon js-event-bus.
fastify-evervault Fastify plugin for instantiating and encapsulating the Evervault client.
fastify-explorer Get control of your decorators across all the encapsulated contexts.
fastify-favicon Fastify plugin to serve default favicon.
fastify-feature-flags Fastify feature flags plugin with multiple providers support (e.g. env, config, unleash).
fastify-file-routes Get Next.js based file system routing into fastify.
fastify-file-upload Fastify plugin for uploading files.
fastify-firebase Fastify plugin for Firebase Admin SDK to Fastify so you can easily use Firebase Auth, Firestore, Cloud Storage, Cloud Messaging, and more.
fastify-firebase-auth Firebase Authentication for Fastify supporting all of the methods relating to the authentication API.
fastify-formidable Handy plugin to provide multipart support and fastify-swagger integration.
fastify-gcloud-trace Google Cloud Trace API Connector for Fastify.
fastify-get-head Small plugin to set a new HEAD route handler for each GET route previously registered in Fastify.
fastify-get-only Small plugin used to make fastify accept only GET requests
fastify-good-sessions A good Fastify sessions plugin focused on speed.
fastify-google-cloud-storage Fastify plugin that exposes a GCP Cloud Storage client instance.
fastify-graceful-shutdown Shutdown Fastify gracefully and asynchronously.
fastify-grant Authentication/Authorization plugin for Fastify that supports 200+ OAuth Providers.
fastify-guard A Fastify plugin that protects endpoints by checking authenticated user roles and/or scopes.
fastify-hana connects your application to SAP-HANA.
fastify-hashids A Fastify plugin to encode/decode IDs using hashids.
fastify-hasura A Fastify plugin to have fun with Hasura.
fastify-healthcheck Fastify plugin to serve a health check route and a probe script.
fastify-hemera Fastify Hemera plugin, for writing reliable & fault-tolerant microservices with nats.io.
fastify-hl7 A Fastify Plugin to create a server, build, and send HL7 formatted Hl7 messages. Using node-hl7-client and node-hl7-server as the underlining technology to do this.
fastify-http-client Plugin to send HTTP(s) requests. Built upon urllib.
fastify-http-context Fastify plugin for "simulating" a thread of execution to allow for true HTTP context to take place per API call within the Fastify lifecycle of calls.
fastify-http-errors-enhanced An error handling plugin for Fastify that uses enhanced HTTP errors.
fastify-http2https Redirect HTTP requests to HTTPS, both using the same port number, or different response on HTTP and HTTPS.
fastify-https-always Lightweight, proxy-aware redirect plugin from HTTP to HTTPS.
fastify-https-redirect Fastify plugin for auto-redirect from HTTP to HTTPS.
fastify-i18n Internationalization plugin for Fastify. Built upon node-polyglot.
fastify-impressions Fastify plugin to track impressions of all the routes.
fastify-influxdb Fastify InfluxDB plugin connecting to an InfluxDB instance via the Influx default package.
fastify-ip A plugin for Fastify that allows you to infer a request ID by a given set of custom Request headers.
fastify-json-to-xml Fastify plugin to serialize JSON responses into XML.
fastify-jwt-authz JWT user scope verifier.
fastify-jwt-webapp JWT authentication for Fastify-based web apps.
fastify-kafkajs Fastify plugin that adds support for KafkaJS - a modern Apache Kafka client library.
fastify-keycloak-adapter A keycloak adapter for a Fastify app.
fastify-knexjs Fastify plugin for supporting KnexJS Query Builder.
fastify-knexjs-mock Fastify Mock KnexJS for testing support.
fastify-koa Convert Koa middlewares into Fastify plugins
fastify-kubernetes Fastify Kubernetes client plugin.
fastify-kysely Fastify plugin for supporting Kysely type-safe query builder.
fastify-language-parser Fastify plugin to parse request language.
fastify-lcache Lightweight cache plugin
fastify-list-routes A simple plugin for Fastify to list all available routes.
fastify-lm Use OpenAI, Claude, Google, Deepseek, and others LMs with one Fastify plugin.
fastify-loader Load routes from a directory and inject the Fastify instance in each file.
fastify-log-controller changes the log level of your Fastify server at runtime.
fastify-lured Plugin to load lua scripts with fastify-redis and lured. A plugin to implement Lyra search engine on Fastify.
fastify-mailer Plugin to initialize and encapsulate Nodemailer's transporters instances in Fastify.
fastify-markdown Plugin to markdown support.
fastify-method-override Plugin for Fastify, which allows the use of HTTP verbs, such as DELETE, PATCH, HEAD, PUT, OPTIONS in case the client doesn't support them.
fastify-metrics Plugin for exporting Prometheus metrics.
fastify-minify Plugin for minification and transformation of responses.
fastify-mongo-memory Fastify MongoDB in Memory Plugin for testing support.
fastify-mongodb-sanitizer Fastify plugin that sanitizes client input to prevent potential MongoDB query injection attacks.
fastify-mongoose-api Fastify plugin to create REST API methods based on Mongoose MongoDB models.
fastify-mongoose-driver Fastify Mongoose plugin that connects to a MongoDB via the Mongoose plugin with support for Models.
fastify-mqtt Plugin to share mqtt client across Fastify.
fastify-msgpack Fastify and MessagePack, together at last. Uses @msgpack/msgpack by default.
fastify-msgraph-webhook to manage MS Graph Change Notifications webhooks.
fastify-multer Multer is a plugin for handling multipart/form-data, which is primarily used for uploading files.
fastify-nats Plugin to share NATS client across Fastify.
fastify-next-auth NextAuth.js plugin for Fastify.
fastify-no-additional-properties Add additionalProperties: false by default to your JSON Schemas.
fastify-no-icon Plugin to eliminate thrown errors for /favicon.ico requests.
fastify-normalize-request-reply Plugin to normalize the request and reply to the Express version 4.x request and response, which allows use of middleware, like swagger-stats, that was originally written for Express.
fastify-now Structure your endpoints in a folder and load them dynamically with Fastify.
fastify-nuxtjs Vue server-side rendering support for Fastify with Nuxt.js Framework.
fastify-oas Generates OpenAPI 3.0+ documentation from routes schemas for Fastify.
fastify-objectionjs Plugin for the Fastify framework that provides integration with objectionjs ORM.
fastify-objectionjs-classes Plugin to cherry-pick classes from objectionjs ORM.
fastify-opaque-apake A Fastify plugin to implement the OPAQUE aPAKE protocol. Uses @squirrelchat/opaque-wasm-server.
fastify-openapi-docs A Fastify plugin that generates OpenAPI spec automatically.
fastify-openapi-glue Glue for OpenAPI specifications in Fastify, autogenerates routes based on an OpenAPI Specification.
fastify-opentelemetry A Fastify plugin that uses the OpenTelemetry API to provide request tracing.
fastify-oracle Attaches an oracledb connection pool to a Fastify server instance.
fastify-orama
fastify-orientdb Fastify OrientDB connection plugin, with which you can share the OrientDB connection across every part of your server.
fastify-osm Fastify OSM plugin to run overpass queries by OpenStreetMap.
fastify-override Fastify plugin to override decorators, plugins and hooks for testing purposes
fastify-passkit-webservice A set of Fastify plugins to integrate Apple Wallet Web Service specification
fastify-peekaboo Fastify plugin for memoize responses by expressive settings.
fastify-piscina A worker thread pool plugin using Piscina.
fastify-polyglot A plugin to handle i18n using node-polyglot.
fastify-postgraphile Plugin to integrate PostGraphile in a Fastify project.
fastify-postgres-dot-js Fastify PostgreSQL connection plugin that uses Postgres.js.
fastify-prettier A Fastify plugin that uses prettier under the hood to beautify outgoing responses and/or other things in the Fastify server.
fastify-print-routes A Fastify plugin that prints all available routes.
fastify-protobufjs Fastify and protobufjs, together at last. Uses protobufjs by default.
fastify-qrcode This plugin utilizes qrcode to generate QR Code.
fastify-qs A plugin for Fastify that adds support for parsing URL query parameters with qs.
fastify-rabbitmq Fastify RabbitMQ plugin that uses node-rabbitmq-client plugin as a wrapper.
fastify-racing Fastify's plugin that adds support to handle an aborted request asynchronous.
fastify-ravendb RavenDB connection plugin. It exposes the same DocumentStore (or multiple ones) across the whole Fastify application.
fastify-raw-body Add the request.rawBody field.
fastify-rbac Fastify role-based access control plugin.
fastify-recaptcha Fastify plugin for reCAPTCHA verification.
fastify-redis-channels A plugin for fast, reliable, and scalable channels implementation based on Redis streams.
fastify-redis-session Redis Session plugin for fastify.
fastify-register-routes Plugin to automatically load routes from a specified path and optionally limit loaded file names by a regular expression.
fastify-response-caching A Fastify plugin for caching the response.
fastify-response-time Add X-Response-Time header at each request for Fastify, in milliseconds.
fastify-resty Fastify-based web framework with REST API routes auto-generation for TypeORM entities using DI and decorators.
fastify-reverse-routes Fastify reverse routes plugin, allows to defined named routes and build path using name and parameters.
fastify-rob-config Fastify Rob-Config integration.
fastify-route-group Convenient grouping and inheritance of routes.
fastify-s3-buckets Ensure the existence of defined S3 buckets on the application startup.
fastify-schema-constraint Choose the JSON schema to use based on request parameters.
fastify-schema-to-typescript Generate typescript types based on your JSON/YAML validation schemas so they are always in sync.
fastify-sentry Fastify plugin to add the Sentry SDK error handler to requests.
fastify-sequelize Fastify plugin work with Sequelize (adapter for Node.js -> Sqlite, Mysql, Mssql, Postgres).
fastify-server-session A session plugin with support for arbitrary backing caches via fastify-caching.
fastify-shared-schema Plugin for sharing schemas between different routes.
fastify-slonik Fastify Slonik plugin, with this you can use slonik in every part of your server.
fastify-slow-down A plugin to delay the response from the server.
fastify-socket.io a Socket.io plugin for Fastify.
fastify-split-validator Small plugin to allow you use multiple validators in one route based on each HTTP part of the request.
fastify-sqlite connects your application to a sqlite3 database.
fastify-sqlite-typed connects your application to a SQLite database with full Typescript support.
fastify-sse to provide Server-Sent Events with reply.sse( … ) to Fastify.
fastify-sse-v2 to provide Server-Sent Events using Async Iterators (supports newer versions of Fastify).
fastify-ssr-vite A simple plugin for setting up server side rendering with vite.
fastify-stripe Plugin to initialize and encapsulate Stripe Node.js instances in Fastify.
fastify-supabase Plugin to initialize and encapsulate Supabase instances in Fastify.
fastify-tls-keygen Automatically generate a browser-compatible, trusted, self-signed, localhost-only, TLS certificate.
fastify-tokenize Tokenize plugin for Fastify that removes the pain of managing authentication tokens, with built-in integration for fastify-auth.
fastify-totp A plugin to handle TOTP (e.g. for 2FA).
fastify-twitch-ebs-tools Useful functions for Twitch Extension Backend Services (EBS).
fastify-type-provider-effect-schema Fastify type provider for @effect/schema.
fastify-type-provider-zod Fastify type provider for zod.
fastify-typeorm-plugin Fastify plugin to work with TypeORM.
fastify-user-agent parses your request's user-agent header.
fastify-uws A Fastify plugin to use the web server uWebSockets.js.
fastify-vhost Proxy subdomain HTTP requests to another server (useful if you want to point multiple subdomains to the same IP address, while running different servers on the same machine).
fastify-vite Vite plugin for Fastify with SSR data support.
fastify-vue-plugin Nuxt.js plugin for Fastify. Control the routes nuxt should use.
fastify-wamp-router Web Application Messaging Protocol router for Fastify.
fastify-web-response Enables returning web streams objects Response and ReadableStream in routes.
fastify-webpack-hmr Webpack hot module reloading plugin for Fastify.
fastify-webpack-hot Webpack Hot Module Replacement for Fastify.
fastify-ws WebSocket integration for Fastify — with support for WebSocket lifecycle hooks instead of a single handler function. Built upon ws and uws.
fastify-xml-body-parser Parse XML payload / request body into JS / JSON object.
http-wizard Exports a typescript API client for your Fastify API and ensures fullstack type safety for your project.
i18next-http-middleware An i18next based i18n (internationalization) middleware to be used with Node.js web frameworks like Express or Fastify and also for Deno.
k-fastify-gateway API Gateway plugin for Fastify, a low footprint implementation that uses the fastify-reply-from HTTP proxy library.
mercurius A fully-featured and performant GraphQL server implementation for Fastify.
nstats A fast and compact way to get all your network and process stats for your node application. Websocket, HTTP/S, and prometheus compatible!
oas-fastify OAS 3.x to Fastify routes automation. Automatically generates route handlers with fastify configuration and validation.
openapi-validator-middleware Swagger and OpenAPI 3.0 spec-based request validation middleware that supports Fastify.
pubsub-http-handler A Fastify plugin to easily create Google Cloud PubSub endpoints.
sequelize-fastify A simple and lightweight Sequelize plugin for Fastify.
typeorm-fastify-plugin A simple and updated Typeorm plugin for use with Fastify.
Community Tools
@fastify-userland/workflows Reusable workflows for use in the Fastify plugin
fast-maker route configuration generator by directory structure.
fastify-flux Tool for building Fastify APIs using decorators and convert Typescript interface to JSON Schema.
jeasx A flexible server-rendering framework built on Fastify that leverages asynchronous JSX to simplify web development.
simple-tjscli CLI tool to generate JSON Schema from TypeScript interfaces.
vite-plugin-fastify Fastify plugin for Vite with Hot-module Replacement.
vite-plugin-fastify-routes File-based routing for Fastify applications using Vite.

# Fluent Schema

The Validation and Serialization documentation outlines all parameters accepted by Fastify to set up JSON Schema Validation to validate the input, and JSON Schema Serialization to optimize the output.

fluent-json-schema can be used to simplify this task while allowing the reuse of constants.

Basic settings
const S = require('fluent-json-schema')

// You can have an object like this, or query a DB to get the values
const MY_KEYS = {
KEY1: 'ONE',
KEY2: 'TWO'
}

const bodyJsonSchema = S.object()
.prop('someKey', S.string())
.prop('someOtherKey', S.number())
.prop('requiredKey', S.array().maxItems(3).items(S.integer()).required())
.prop('nullableKey', S.mixed([S.TYPES.NUMBER, S.TYPES.NULL]))
.prop('multipleTypesKey', S.mixed([S.TYPES.BOOLEAN, S.TYPES.NUMBER]))
.prop('multipleRestrictedTypesKey', S.oneOf([S.string().maxLength(5), S.number().minimum(10)]))
.prop('enumKey', S.enum(Object.values(MY_KEYS)))
.prop('notTypeKey', S.not(S.array()))

const queryStringJsonSchema = S.object()
.prop('name', S.string())
.prop('excitement', S.integer())

const paramsJsonSchema = S.object()
.prop('par1', S.string())
.prop('par2', S.integer())

const headersJsonSchema = S.object()
.prop('x-foo', S.string().required())

// Note that there is no need to call `.valueOf()`!
const schema = {
body: bodyJsonSchema,
querystring: queryStringJsonSchema, // (or) query: queryStringJsonSchema
params: paramsJsonSchema,
headers: headersJsonSchema
}

fastify.post('/the/url', { schema }, handler)

Reuse
With fluent-json-schema, you can manipulate your schemas more easily and programmatically and then reuse them thanks to the addSchema() method. You can refer to the schema in two different manners that are detailed in the Validation and Serialization documentation.

Here are some usage examples:

$ref-way: refer to an external schema.

const addressSchema = S.object()
.id('#address')
.prop('line1').required()
.prop('line2')
.prop('country').required()
.prop('city').required()
.prop('zipcode').required()

const commonSchemas = S.object()
.id('https://fastify/demo')
.definition('addressSchema', addressSchema)
.definition('otherSchema', otherSchema) // You can add any schemas you need

fastify.addSchema(commonSchemas)

const bodyJsonSchema = S.object()
.prop('residence', S.ref('https://fastify/demo#address')).required()
.prop('office', S.ref('https://fastify/demo#/definitions/addressSchema')).required()

const schema = { body: bodyJsonSchema }

fastify.post('/the/url', { schema }, handler)

replace-way: refer to a shared schema to replace before the validation process.

const sharedAddressSchema = {
$id: 'sharedAddress',
type: 'object',
required: ['line1', 'country', 'city', 'zipcode'],
properties: {
line1: { type: 'string' },
line2: { type: 'string' },
country: { type: 'string' },
city: { type: 'string' },
zipcode: { type: 'string' }
}
}
fastify.addSchema(sharedAddressSchema)

const bodyJsonSchema = {
type: 'object',
properties: {
vacation: 'sharedAddress#'
}
}

const schema = { body: bodyJsonSchema }

fastify.post('/the/url', { schema }, handler)

NB You can mix up the $ref-way and the replace-way when using fastify.addSchema.

# V5 Migration Guide

V5 Migration Guide
This guide is intended to help with migration from Fastify v4 to v5.

Before migrating to v5, please ensure that you have fixed all deprecation warnings from v4. All v4 deprecations have been removed and will no longer work after upgrading.

Long Term Support Cycle
Fastify v5 will only support Node.js v20+. If you are using an older version of Node.js, you will need to upgrade to a newer version to use Fastify v5.

Fastify v4 is still supported until June 30, 2025. If you are unable to upgrade, you should consider buying an end-of-life support plan from HeroDevs.

Why Node.js v20?
Fastify v5 will only support Node.js v20+ because it has significant differences compared to v18, such as better support for node:test. This allows us to provide a better developer experience and streamline maintenance.

Node.js v18 will exit Long Term Support on April 30, 2025, so you should be planning to upgrade to v20 anyway.

Breaking Changes
Full JSON Schema is now required for querystring, params and body and response schemas
Starting with v5, Fastify will require a full JSON schema for the querystring, params and body schema. Note that the jsonShortHand option has been removed as well.

If the default JSON Schema validator is used, you will need to provide a full JSON schema for the querystring, params, body, and response schemas, including the type property.

// v4
fastify.get('/route', {
schema: {
querystring: {
name: { type: 'string' }
}
}
}, (req, reply) => {
reply.send({ hello: req.query.name });
});

// v5
fastify.get('/route', {
schema: {
querystring: {
type: 'object',
properties: {
name: { type: 'string' }
},
required: ['name']
}
}
}, (req, reply) => {
reply.send({ hello: req.query.name });
});

See #5586 for more details

Note that it's still possible to override the JSON Schema validator to use a different format, such as Zod. This change simplifies that as well.

This change helps with integration of other tools, such as @fastify/swagger.

New logger constructor signature
In Fastify v4, Fastify accepted the options to build a pino logger in the logger option, as well as a custom logger instance. This was the source of significant confusion.

As a result, the logger option will not accept a custom logger anymore in v5. To use a custom logger, you should use the loggerInstance option instead:

// v4
const logger = require('pino')();
const fastify = require('fastify')({
logger
});

// v5
const loggerInstance = require('pino')();
const fastify = require('fastify')({
loggerInstance
});

useSemicolonDelimiter false by default
Starting with v5, Fastify instances will no longer default to supporting the use of semicolon delimiters in the query string as they did in v4. This is due to it being non-standard behavior and not adhering to RFC 3986.

If you still wish to use semicolons as delimiters, you can do so by setting useSemicolonDelimiter: true in the server configuration.

const fastify = require('fastify')({
useSemicolonDelimiter: true
});

The parameters object no longer has a prototype
In v4, the parameters object had a prototype. This is no longer the case in v5. This means that you can no longer access properties inherited from Object on the parameters object, such as toString or hasOwnProperty.

// v4
fastify.get('/route/:name', (req, reply) => {
console.log(req.params.hasOwnProperty('name')); // true
return { hello: req.params.name };
});

// v5
fastify.get('/route/:name', (req, reply) => {
console.log(Object.hasOwn(req.params, 'name')); // true
return { hello: req.params.name };
});

This increases the security of the application by hardening against prototype pollution attacks.

Type Providers now differentiate between validator and serializer schemas
In v4, the type providers had the same types for both validation and serialization. In v5, the type providers have been split into two separate types: ValidatorSchema and SerializerSchema.

@fastify/type-provider-json-schema-to-ts and @fastify/type-provider-typebox have already been updated: upgrade to the latest version to get the new types. If you are using a custom type provider, you will need to modify it like the following:

--- a/index.ts
+++ b/index.ts
@@ -11,7 +11,8 @@ import {
import { FromSchema, FromSchemaDefaultOptions, FromSchemaOptions, JSONSchema } from 'json-schema-to-ts'

export interface JsonSchemaToTsProvider<
Options extends FromSchemaOptions = FromSchemaDefaultOptions

> extends FastifyTypeProvider {

- output: this['input'] extends JSONSchema ? FromSchema<this['input'], Options> : unknown;

* validator: this['schema'] extends JSONSchema ? FromSchema<this['schema'], Options> : unknown;
* serializer: this['schema'] extends JSONSchema ? FromSchema<this['schema'], Options> : unknown;
  }

Changes to the .listen() method
The variadic argument signature of the .listen() method has been removed. This means that you can no longer call .listen() with a variable number of arguments.

// v4
fastify.listen(8000)

Will become:

// v5
fastify.listen({ port: 8000 })

This was already deprecated in v4 as FSTDEP011, so you should have already updated your code to use the new signature.

Direct return of trailers has been removed
In v4, you could directly return trailers from a handler. This is no longer possible in v5.

// v4
fastify.get('/route', (req, reply) => {
reply.trailer('ETag', function (reply, payload) {
return 'custom-etag'
})
reply.send('')
});

// v5
fastify.get('/route', (req, reply) => {
reply.trailer('ETag', async function (reply, payload) {
return 'custom-etag'
})
reply.send('')
});

A callback could also be used. This was already deprecated in v4 as FSTDEP013, so you should have already updated your code to use the new signature.

Streamlined access to route definition
All deprecated properties relating to accessing the route definition have been removed and are now accessed via request.routeOptions.

Code Description How to solve Discussion
FSTDEP012 You are trying to access the deprecated request.context property. Use request.routeOptions.config or request.routeOptions.schema. #4216 #5084
FSTDEP015 You are accessing the deprecated request.routeSchema property. Use request.routeOptions.schema. #4470
FSTDEP016 You are accessing the deprecated request.routeConfig property. Use request.routeOptions.config. #4470
FSTDEP017 You are accessing the deprecated request.routerPath property. Use request.routeOptions.url. #4470
FSTDEP018 You are accessing the deprecated request.routerMethod property. Use request.routeOptions.method. #4470
FSTDEP019 You are accessing the deprecated reply.context property. Use reply.routeOptions.config or reply.routeOptions.schema. #5032 #5084
See #5616 for more information.

reply.redirect() has a new signature
The reply.redirect() method has a new signature: reply.redirect(url: string, code?: number).

// v4
reply.redirect(301, '/new-route')

Change it to:

// v5
reply.redirect('/new-route', 301)

This was already deprecated in v4 as FSTDEP021, so you should have already updated your code to use the new signature.

Modifying reply.sent is now forbidden
In v4, you could modify the reply.sent property to prevent the response from being sent. This is no longer possible in v5, use reply.hijack() instead.

// v4
fastify.get('/route', (req, reply) => {
reply.sent = true;
reply.raw.end('hello');
});

Change it to:

// v5
fastify.get('/route', (req, reply) => {
reply.hijack();
reply.raw.end('hello');
});

This was already deprecated in v4 as FSTDEP010, so you should have already updated your code to use the new signature.

Constraints for route versioning signature changes
We changed the signature for route versioning constraints. The version and versioning options have been removed and you should use the constraints option instead.

Code Description How to solve Discussion
FSTDEP008 You are using route constraints via the route {version: "..."} option. Use {constraints: {version: "..."}} option. #2682
FSTDEP009 You are using a custom route versioning strategy via the server {versioning: "..."} option. Use {constraints: {version: "..."}} option. #2682
HEAD routes requires to register before GET when exposeHeadRoutes: true
We have a more strict requirement for custom HEAD route when exposeHeadRoutes: true.

When you provides a custom HEAD route, you must either explicitly set exposeHeadRoutes to false

// v4
fastify.get('/route', {

}, (req, reply) => {
reply.send({ hello: 'world' });
});

fastify.head('/route', (req, reply) => {
// ...
});

// v5
fastify.get('/route', {
exposeHeadRoutes: false
}, (req, reply) => {
reply.send({ hello: 'world' });
});

fastify.head('/route', (req, reply) => {
// ...
});

or place the HEAD route before GET.

// v5
fastify.head('/route', (req, reply) => {
// ...
});

fastify.get('/route', {

}, (req, reply) => {
reply.send({ hello: 'world' });
});

This was changed in #2700, and the old behavior was deprecated in v4 as FSTDEP007.

Removed request.connection
The request.connection property has been removed in v5. You should use request.socket instead.

// v4
fastify.get('/route', (req, reply) => {
console.log(req.connection.remoteAddress);
return { hello: 'world' };
});

// v5
fastify.get('/route', (req, reply) => {
console.log(req.socket.remoteAddress);
return { hello: 'world' };
});

This was already deprecated in v4 as FSTDEP05, so you should have already updated your code to use the new signature.

reply.getResponseTime() has been removed, use reply.elapsedTime instead
The reply.getResponseTime() method has been removed in v5. You should use reply.elapsedTime instead.

// v4
fastify.get('/route', (req, reply) => {
console.log(reply.getResponseTime());
return { hello: 'world' };
});

// v5
fastify.get('/route', (req, reply) => {
console.log(reply.elapsedTime);
return { hello: 'world' };
});

This was already deprecated in v4 as FSTDEP20, so you should have already updated your code to use the new signature.

fastify.hasRoute() now matches the behavior of find-my-way
The fastify.hasRoute() method now matches the behavior of find-my-way and requires the route definition to be passed as it is defined in the route.

// v4
fastify.get('/example/:file(^\\d+).png', function (request, reply) { })

console.log(fastify.hasRoute({
method: 'GET',
url: '/example/12345.png'
)); // true

// v5

fastify.get('/example/:file(^\\d+).png', function (request, reply) { })

console.log(fastify.hasRoute({
method: 'GET',
url: '/example/:file(^\\d+).png'
)); // true

Removal of some non-standard HTTP methods
We have removed the following HTTP methods from Fastify:

PROPFIND
PROPPATCH
MKCOL
COPY
MOVE
LOCK
UNLOCK
TRACE
SEARCH
It's now possible to add them back using the addHttpMethod method.

const fastify = Fastify()

// add a new http method on top of the default ones:
fastify.addHttpMethod('REBIND')

// add a new HTTP method that accepts a body:
fastify.addHttpMethod('REBIND', { hasBody: true })

// reads the HTTP methods list:
fastify.supportedMethods // returns a string array

See #5567 for more information.

Removed support from reference types in decorators
Decorating Request/Reply with a reference type (Array, Object) is now prohibited as this reference is shared amongst all requests.

// v4
fastify.decorateRequest('myObject', { hello: 'world' });

// v5
fastify.decorateRequest('myObject');
fastify.addHook('onRequest', async (req, reply) => {
req.myObject = { hello: 'world' };
});

or turn it into a function

// v5
fastify.decorateRequest('myObject', () => ({ hello: 'world' }));

or as a getter

// v5
fastify.decorateRequest('myObject', {
getter () {
return { hello: 'world' }
}
});

See #5462 for more information.

Remove support for DELETE with a Content-Type: application/json header and an empty body
In v4, Fastify allowed DELETE requests with a Content-Type: application/json header and an empty body was accepted. This is no longer allowed in v5.

See #5419 for more information.

Plugins cannot mix callback/promise API anymore
In v4, plugins could mix the callback and promise API, leading to unexpected behavior. This is no longer allowed in v5.

// v4
fastify.register(async function (instance, opts, done) {
done();
});

// v5
fastify.register(async function (instance, opts) {
return;
});

or

// v5
fastify.register(function (instance, opts, done) {
done();
});

Requests now have host, hostname, and port, and hostname no longer includes the port number
In Fastify v4, req.hostname would include both the hostname and the server’s port, so locally it might have the value localhost:1234. With v5, we aligned to the Node.js URL object and now include host, hostname, and port properties. req.host has the same value as req.hostname did in v4, while req.hostname includes the hostname without a port if a port is present, and req.port contains just the port number. See #4766 and #4682 for more information.

Removes getDefaultRoute and setDefaultRoute methods
The getDefaultRoute and setDefaultRoute methods have been removed in v5.

See #4485 and #4480 for more information. This was already deprecated in v4 as FSTDEP014, so you should have already updated your code.

New Features
Diagnostic Channel support
Fastify v5 now supports the Diagnostics Channel API natively and provides a way to trace the lifecycle of a request.

'use strict'

const diagnostics = require('node:diagnostics_channel')
const sget = require('simple-get').concat
const Fastify = require('fastify')

diagnostics.subscribe('tracing:fastify.request.handler:start', (msg) => {
console.log(msg.route.url) // '/:id'
console.log(msg.route.method) // 'GET'
})

diagnostics.subscribe('tracing:fastify.request.handler:end', (msg) => {
// msg is the same as the one emitted by the 'tracing:fastify.request.handler:start' channel
console.log(msg)
})

diagnostics.subscribe('tracing:fastify.request.handler:error', (msg) => {
// in case of error
})

const fastify = Fastify()
fastify.route({
method: 'GET',
url: '/:id',
handler: function (req, reply) {
return { hello: 'world' }
}
})

fastify.listen({ port: 0 }, function () {
sget({
method: 'GET',
url: fastify.listeningOrigin + '/7'
}, (err, response, body) => {
t.error(err)
t.equal(response.statusCode, 200)
t.same(JSON.parse(body), { hello: 'world' })
})
})

# The hitchhiker's guide to plugins

First of all, DON'T PANIC!

Fastify was built from the beginning to be an extremely modular system. We built a powerful API that allows you to add methods and utilities to Fastify by creating a namespace. We built a system that creates an encapsulation model, which allows you to split your application into multiple microservices at any moment, without the need to refactor the entire application.

Table of contents

The hitchhiker's guide to plugins
Register
Decorators
Hooks
How to handle encapsulation and distribution
ESM support
Handle errors
Custom errors
Emit Warnings
Let's start!
Register
As with JavaScript, where everything is an object, in Fastify everything is a plugin.

Your routes, your utilities, and so on are all plugins. To add a new plugin, whatever its functionality may be, in Fastify you have a nice and unique API: register.

fastify.register(
require('./my-plugin'),
{ options }
)

register creates a new Fastify context, which means that if you perform any changes on the Fastify instance, those changes will not be reflected in the context's ancestors. In other words, encapsulation!

Why is encapsulation important?

Well, let's say you are creating a new disruptive startup, what do you do? You create an API server with all your stuff, everything in the same place, a monolith!

Ok, you are growing very fast and you want to change your architecture and try microservices. Usually, this implies a huge amount of work, because of cross dependencies and a lack of separation of concerns in the codebase.

Fastify helps you in that regard. Thanks to the encapsulation model, it will completely avoid cross dependencies and will help you structure your code into cohesive blocks.

Let's return to how to correctly use register.

As you probably know, the required plugins must expose a single function with the following signature

module.exports = function (fastify, options, done) {}

Where fastify is the encapsulated Fastify instance, options is the options object, and done is the function you must call when your plugin is ready.

Fastify's plugin model is fully reentrant and graph-based, it handles asynchronous code without any problems and it enforces both the load and close order of plugins. How? Glad you asked, check out avvio! Fastify starts loading the plugin after .listen(), .inject() or .ready() are called.

Inside a plugin you can do whatever you want, register routes and utilities (we will see this in a moment), and do nested registers, just remember to call done when everything is set up!

module.exports = function (fastify, options, done) {
fastify.get('/plugin', (request, reply) => {
reply.send({ hello: 'world' })
})

done()
}

Well, now you know how to use the register API and how it works, but how do we add new functionality to Fastify and even better, share them with other developers?

Decorators
Okay, let's say that you wrote a utility that is so good that you decided to make it available along with all your code. How would you do it? Probably something like the following:

// your-awesome-utility.js
module.exports = function (a, b) {
return a + b
}

const util = require('./your-awesome-utility')
console.log(util('that is ', 'awesome'))

Now you will import your utility in every file you need it in. (And do not forget that you will probably also need it in your tests).

Fastify offers you a more elegant and comfortable way to do this, decorators. Creating a decorator is extremely easy, just use the decorate API:

fastify.decorate('util', (a, b) => a + b)

Now you can access your utility just by calling fastify.util whenever you need it - even inside your test.

And here starts the magic; do you remember how just now we were talking about encapsulation? Well, using register and decorate in conjunction enables exactly that, let me show you an example to clarify this:

fastify.register((instance, opts, done) => {
instance.decorate('util', (a, b) => a + b)
console.log(instance.util('that is ', 'awesome'))

done()
})

fastify.register((instance, opts, done) => {
console.log(instance.util('that is ', 'awesome')) // This will throw an error

done()
})

Inside the second register call instance.util will throw an error because util exists only inside the first register context.

Let's step back for a moment and dig deeper into this: every time you use the register API, a new context is created that avoids the negative situations mentioned above.

Do note that encapsulation applies to the ancestors and siblings, but not the children.

fastify.register((instance, opts, done) => {
instance.decorate('util', (a, b) => a + b)
console.log(instance.util('that is ', 'awesome'))

fastify.register((instance, opts, done) => {
console.log(instance.util('that is ', 'awesome')) // This will not throw an error
done()
})

done()
})

fastify.register((instance, opts, done) => {
console.log(instance.util('that is ', 'awesome')) // This will throw an error

done()
})

Take home message: if you need a utility that is available in every part of your application, take care that it is declared in the root scope of your application. If that is not an option, you can use the fastify-plugin utility as described here.

decorate is not the only API that you can use to extend the server functionality, you can also use decorateRequest and decorateReply.

decorateRequest and decorateReply? Why do we need them if we already have decorate?

Good question, we added them to make Fastify more developer-friendly. Let's see an example:

fastify.decorate('html', payload => {
return generateHtml(payload)
})

fastify.get('/html', (request, reply) => {
reply
.type('text/html')
.send(fastify.html({ hello: 'world' }))
})

It works, but it could be much better!

fastify.decorateReply('html', function (payload) {
this.type('text/html') // This is the 'Reply' object
this.send(generateHtml(payload))
})

fastify.get('/html', (request, reply) => {
reply.html({ hello: 'world' })
})

Reminder that the this keyword is not available on arrow functions, so when passing functions in decorateReply and decorateRequest as a utility that also needs access to the request and reply instance, a function that is defined using the function keyword is needed instead of an arrow function expression.

You can do the same for the request object:

fastify.decorate('getHeader', (req, header) => {
return req.headers[header]
})

fastify.addHook('preHandler', (request, reply, done) => {
request.isHappy = fastify.getHeader(request.raw, 'happy')
done()
})

fastify.get('/happiness', (request, reply) => {
reply.send({ happy: request.isHappy })
})

Again, it works, but it can be much better!

fastify.decorateRequest('setHeader', function (header) {
this.isHappy = this.headers[header]
})

fastify.decorateRequest('isHappy', false) // This will be added to the Request object prototype, yay speed!

fastify.addHook('preHandler', (request, reply, done) => {
request.setHeader('happy')
done()
})

fastify.get('/happiness', (request, reply) => {
reply.send({ happy: request.isHappy })
})

We have seen how to extend server functionality and how to handle the encapsulation system, but what if you need to add a function that must be executed whenever the server "emits" an event?

Hooks
You just built an amazing utility, but now you need to execute that for every request, this is what you will likely do:

fastify.decorate('util', (request, key, value) => { request[key] = value })

fastify.get('/plugin1', (request, reply) => {
fastify.util(request, 'timestamp', new Date())
reply.send(request)
})

fastify.get('/plugin2', (request, reply) => {
fastify.util(request, 'timestamp', new Date())
reply.send(request)
})

I think we all agree that this is terrible. Repeated code, awful readability and it cannot scale.

So what can you do to avoid this annoying issue? Yes, you are right, use a hook!

fastify.decorate('util', (request, key, value) => { request[key] = value })

fastify.addHook('preHandler', (request, reply, done) => {
fastify.util(request, 'timestamp', new Date())
done()
})

fastify.get('/plugin1', (request, reply) => {
reply.send(request)
})

fastify.get('/plugin2', (request, reply) => {
reply.send(request)
})

Now for every request, you will run your utility. You can register as many hooks as you need.

Sometimes you want a hook that should be executed for just a subset of routes, how can you do that? Yep, encapsulation!

fastify.register((instance, opts, done) => {
instance.decorate('util', (request, key, value) => { request[key] = value })

instance.addHook('preHandler', (request, reply, done) => {
instance.util(request, 'timestamp', new Date())
done()
})

instance.get('/plugin1', (request, reply) => {
reply.send(request)
})

done()
})

fastify.get('/plugin2', (request, reply) => {
reply.send(request)
})

Now your hook will run just for the first route!

An alternative approach is to make use of the onRoute hook to customize application routes dynamically from inside the plugin. Every time a new route is registered, you can read and modify the route options. For example, based on a route config option:

fastify.register((instance, opts, done) => {
instance.decorate('util', (request, key, value) => { request[key] = value })

function handler(request, reply, done) {
instance.util(request, 'timestamp', new Date())
done()
}

instance.addHook('onRoute', (routeOptions) => {
if (routeOptions.config && routeOptions.config.useUtil === true) {
// set or add our handler to the route preHandler hook
if (!routeOptions.preHandler) {
routeOptions.preHandler = [handler]
return
}
if (Array.isArray(routeOptions.preHandler)) {
routeOptions.preHandler.push(handler)
return
}
routeOptions.preHandler = [routeOptions.preHandler, handler]
}
})

fastify.get('/plugin1', {config: {useUtil: true}}, (request, reply) => {
reply.send(request)
})

fastify.get('/plugin2', (request, reply) => {
reply.send(request)
})

done()
})

This variant becomes extremely useful if you plan to distribute your plugin, as described in the next section.

As you probably noticed by now, request and reply are not the standard Node.js request and response objects, but Fastify's objects.

How to handle encapsulation and distribution
Perfect, now you know (almost) all of the tools that you can use to extend Fastify. Nevertheless, chances are that you came across one big issue: how is distribution handled?

The preferred way to distribute a utility is to wrap all your code inside a register. Using this, your plugin can support asynchronous bootstrapping (since decorate is a synchronous API), in the case of a database connection for example.

Wait, what? Didn't you tell me that register creates an encapsulation and that the stuff I create inside will not be available outside?

Yes, I said that. However, what I didn't tell you is that you can tell Fastify to avoid this behavior with the fastify-plugin module.

const fp = require('fastify-plugin')
const dbClient = require('db-client')

function dbPlugin (fastify, opts, done) {
dbClient.connect(opts.url, (err, conn) => {
fastify.decorate('db', conn)
done()
})
}

module.exports = fp(dbPlugin)

You can also tell fastify-plugin to check the installed version of Fastify, in case you need a specific API.

As we mentioned earlier, Fastify starts loading its plugins after .listen(), .inject() or .ready() are called and as such, after they have been declared. This means that, even though the plugin may inject variables to the external Fastify instance via decorate, the decorated variables will not be accessible before calling .listen(), .inject(), or .ready().

In case you rely on a variable injected by a preceding plugin and want to pass that in the options argument of register, you can do so by using a function instead of an object:

const fastify = require('fastify')()
const fp = require('fastify-plugin')
const dbClient = require('db-client')

function dbPlugin (fastify, opts, done) {
dbClient.connect(opts.url, (err, conn) => {
fastify.decorate('db', conn)
done()
})
}

fastify.register(fp(dbPlugin), { url: 'https://example.com' })
fastify.register(require('your-plugin'), parent => {
return { connection: parent.db, otherOption: 'foo-bar' }
})

In the above example, the parent variable of the function passed in as the second argument of register is a copy of the external Fastify instance that the plugin was registered at. This means that we can access any variables that were injected by preceding plugins in the order of declaration.

ESM support
ESM is supported as well from Node.js v13.3.0 and above! Just export your plugin as an ESM module and you are good to go!

// plugin.mjs
async function plugin (fastify, opts) {
fastify.get('/', async (req, reply) => {
return { hello: 'world' }
})
}

export default plugin

Handle errors
One of your plugins may fail during startup. Maybe you expect it and you have a custom logic that will be triggered in that case. How can you implement this? The after API is what you need. after simply registers a callback that will be executed just after a register, and it can take up to three parameters.

The callback changes based on the parameters you are giving:

If no parameter is given to the callback and there is an error, that error will be passed to the next error handler.
If one parameter is given to the callback, that parameter will be the error object.
If two parameters are given to the callback, the first will be the error object; the second will be the done callback.
If three parameters are given to the callback, the first will be the error object, the second will be the top-level context unless you have specified both server and override, in that case, the context will be what the override returns, and the third the done callback.
Let's see how to use it:

fastify
.register(require('./database-connector'))
.after(err => {
if (err) throw err
})

Custom errors
If your plugin needs to expose custom errors, you can easily generate consistent error objects across your codebase and plugins with the @fastify/error module.

const createError = require('@fastify/error')
const CustomError = createError('ERROR_CODE', 'message')
console.log(new CustomError())

Emit Warnings
If you want to deprecate an API, or you want to warn the user about a specific use case, you can use the process-warning module.

const warning = require('process-warning')()
warning.create('MyPluginWarning', 'MP_ERROR_CODE', 'message')
warning.emit('MP_ERROR_CODE')

Let's start!
Awesome, now you know everything you need to know about Fastify and its plugin system to start building your first plugin, and please if you do, tell us! We will add it to the ecosystem section of our documentation!

If you want to see some real-world examples, check out:

@fastify/view Templates rendering (ejs, pug, handlebars, marko) plugin support for Fastify.
@fastify/mongodb Fastify MongoDB connection plugin, with this you can share the same MongoDB connection pool in every part of your server.
@fastify/multipart Multipart support for Fastify
@fastify/helmet Important security headers for Fastify
Do you feel like something is missing here? Let us know! :)

# Prototype-Poisoning

Prototype-Poisoning
The following is an article written by Eran Hammer. It is reproduced here for posterity with permission. It has been reformatted from the original HTML source to Markdown source, but otherwise remains the same. The original HTML can be retrieved from the above permission link.

History behind prototype poisoning
Based on the article by Eran Hammer,the issue is created by a web security bug. It is also a perfect illustration of the efforts required to maintain open-source software and the limitations of existing communication channels.

But first, if we use a JavaScript framework to process incoming JSON data, take a moment to read up on Prototype Poisoning in general, and the specific technical details of this issue. This could be a critical issue so, we might need to verify your own code first. It focuses on specific framework however, any solution that uses JSON.parse() to process external data is potentially at risk.

BOOM
The engineering team at Lob (long time generous supporters of my work!) reported a critical security vulnerability they identified in our data validation module — joi. They provided some technical details and a proposed solution.

The main purpose of a data validation library is to ensure the output fully complies with the rules defined. If it doesn't, validation fails. If it passes, we can blindly trust that the data you are working with is safe. In fact, most developers treat validated input as completely safe from a system integrity perspective which is crucial!

In our case, the Lob team provided an example where some data was able to escape by the validation logic and pass through undetected. This is the worst possible defect a validation library can have.

Prototype in a nutshell
To understand this, we need to understand how JavaScript works a bit. Every object in JavaScript can have a prototype. It is a set of methods and properties it "inherits" from another object. I have put inherits in quotes because JavaScript isn't really an object-oriented language. It is a prototype- based object-oriented language.

A long time ago, for a bunch of irrelevant reasons, someone decided that it would be a good idea to use the special property name **proto** to access (and set) an object's prototype. This has since been deprecated but nevertheless, fully supported.

To demonstrate:

> const a = { b: 5 };
> a.b;
> 5
> a.**proto** = { c: 6 };
> a.c;
> 6
> a;
> { b: 5 }

The object doesn't have a c property, but its prototype does. When validating the object, the validation library ignores the prototype and only validates the object's own properties. This allows c to sneak in via the prototype.

Another important part is the way JSON.parse() — a utility provided by the language to convert JSON formatted text into objects  —  handles this magic **proto** property name.

> const text = '{"b": 5, "**proto**": { "c": 6 }}';
> const a = JSON.parse(text);
> a;
> {b: 5, **proto**: { c: 6 }}

Notice how a has a **proto** property. This is not a prototype reference. It is a simple object property key, just like b. As we've seen from the first example, we can't actually create this key through assignment as that invokes the prototype magic and sets an actual prototype. JSON.parse() however, sets a simple property with that poisonous name.

By itself, the object created by JSON.parse() is perfectly safe. It doesn't have a prototype of its own. It has a seemingly harmless property that just happens to overlap with a built-in JavaScript magic name.

However, other methods are not as lucky:

> const x = Object.assign({}, a);
> x;
> { b: 5}
> x.c;
> 6;

If we take the a object created earlier by JSON.parse() and pass it to the helpful Object.assign() method (used to perform a shallow copy of all the top level properties of a into the provided empty {} object), the magic **proto** property "leaks" and becomes x 's actual prototype.

Surprise!

If you get some external text input and parse it with JSON.parse() then perform some simple manipulation of that object (e.g shallow clone and add an id ), and pass it to our validation library, it would sneak in undetected via **proto**.

Oh joi!
The first question is, of course, why does the validation module joi ignore the prototype and let potentially harmful data through? We asked ourselves the same question and our instant thought was "it was an oversight". A bug - a really big mistake. The joi module should not have allowed this to happen. But…

While joi is used primarily for validating web input data, it also has a significant user base using it to validate internal objects, some of which have prototypes. The fact that joi ignores the prototype is a helpful "feature". It allows validating the object's own properties while ignoring what could be a very complicated prototype structure (with many methods and literal properties).

Any solution at the joi level would mean breaking some currently working code.

The right thing
At this point, we were looking at a devastatingly bad security vulnerability. Right up there in the upper echelons of epic security failures. All we knew is that our extremely popular data validation library fails to block harmful data, and that this data is trivial to sneak through. All you need to do is add **proto** and some crap to a JSON input and send it on its way to an application built using our tools.

(Dramatic pause)

We knew we had to fix joi to prevent this but given the scale of this issue, we had to do it in a way that will put a fix out without drawing too much attention to it — without making it too easy to exploit — at least for a few days until most systems received the update.

Sneaking a fix isn't the hardest thing to accomplish. If you combine it with an otherwise purposeless refactor of the code, and throw in a few unrelated bug fixes and maybe a cool new feature, you can publish a new version without drawing attention to the real issue being fixed.

The problem was, the right fix was going to break valid use cases. You see, joi has no way of knowing if you want it to ignore the prototype you set, or block the prototype set by an attacker. A solution that fixes the exploit will break code and breaking code tends to get a lot of attention.

On the other hand, if we released a proper (semantically versioned) fix, mark it as a breaking change, and add a new API to explicitly tell joi what you want it to do with the prototype, we will share with the world how to exploit this vulnerability while also making it more time consuming for systems to upgrade (breaking changes never get applied automatically by build tools).

A detour
While the issue at hand was about incoming request payloads, we had to pause and check if it could also impact data coming via the query string, cookies, and headers. Basically, anything that gets serialized into objects from text.

We quickly confirmed node default query string parser was fine as well as its header parser. I identified one potential issue with base64-encoded JSON cookies as well as the usage of custom query string parsers. We also wrote some tests to confirm that the most popular third-party query string parser  — qs —  was not vulnerable (it is not!).

A development
Throughout this triage, we just assumed that the offending input with its poisoned prototype was coming into joi from hapi, the web framework connecting the hapi.js ecosystem. Further investigation by the Lob team found that the problem was a bit more nuanced.

hapi used JSON.parse() to process incoming data. It first set the result object as a payload property of the incoming request, and then passed that same object for validation by joi before being passed to the application business logic for processing. Since JSON.parse() doesn't actually leak the **proto** property, it would arrive to joi with an invalid key and fail validation.

However, hapi provides two extension points where the payload data can be inspected (and processed) prior to validation. It is all properly documented and well understood by most developers. The extension points are there to allow you to interact with the raw inputs prior to validation for legitimate (and often security related) reasons.

If during one of these two extension points, a developer used Object.assign() or a similar method on the payload, the **proto** property would leak and become an actual prototype.

Sigh of relief
We were now dealing with a much different level of awfulness. Manipulating the payload object prior to validation is not common which meant this was no longer a doomsday scenario. It was still potentially catastrophic but the exposure dropped from every joi user to some very specific implementations.

We were no longer looking at a secretive joi release. The issue in joi is still there, but we can now address it properly with a new API and breaking release over the next few weeks.

We also knew that we can easily mitigate this vulnerability at the framework level since it knows which data is coming from the outside and which is internally generated. The framework is really the only piece that can protect developers against making such unexpected mistakes.

Good news, bad news, no news?
The good news was that this wasn't our fault. It wasn't a bug in hapi or joi. It was only possible through a complex combination of actions that was not unique to hapi or joi. This can happen with every other JavaScript framework. If hapi is broken, then the world is broken.

Great — we solved the blame game.

The bad news is that when there is nothing to blame (other than JavaScript itself), it is much harder getting it fixed.

The first question people ask once a security issue is found is if there is going to be a CVE published. A CVE — Common Vulnerabilities and Exposures — is a database of known security issues. It is a critical component of web security. The benefit of publishing a CVE is that it immediately triggers alarms and informs and often breaks automated builds until the issue is resolved.

But what do we pin this to?

Probably, nothing. We are still debating whether we should tag some versions of hapi with a warning. The "we" is the node security process. Since we now have a new version of hapi that mitigate the problem by default, it can be considered a fix. But because the fix isn't to a problem in hapi itself, it is not exactly kosher to declare older versions harmful.

Publishing an advisory on previous versions of hapi for the sole purpose of nudging people into awareness and upgrade is an abuse of the advisory process. I'm personally fine with abusing it for the purpose of improving security but that's not my call. As of this writing, it is still being debated.

The solution business
Mitigating the issue wasn't hard. Making it scale and safe was a bit more involved. Since we knew where harmful data can enter the system, and we knew where we used the problematic JSON.parse() we could replace it with a safe implementation.

One problem. Validating data can be costly and we are now planning on validating every incoming JSON text. The built-in JSON.parse() implementation is fast. Really really fast. It is unlikely we can build a replacement that will be more secure and anywhere as fast. Especially not overnight and without introducing new bugs.

It was obvious we were going to wrap the existing JSON.parse() method with some additional logic. We just had to make sure it was not adding too much overhead. This isn't just a performance consideration but also a security one. If we make it easy to slow down a system by simply sending specific data, we make it easy to execute a DoS attack at very low cost.

I came up with a stupidly simple solution: first parse the text using the existing tools. If this didn't fail, scan the original raw text for the offending string "proto". Only if we find it, perform an actual scan of the object. We can't block every reference to "proto" — sometimes it is perfectly valid value (like when writing about it here and sending this text over to Medium for publication).

This made the "happy path" practically as fast as before. It just added one function call, a quick text scan (again, very fast built-in implementation), and a conditional return. The solution had negligible impact on the vast majority of data expected to pass through it.

Next problem. The prototype property doesn't have to be at the top level of the incoming object. It can be nested deep inside. This means we cannot just check for the presence of it at the top level. We need to recursively iterate through the object.

While recursive functions are a favorite tool, they could be disastrous when writing security-conscious code. You see, recursive function increase the size of the runtime call stack. The more times you loop, the longer the call stack gets. At some point — KABOOM— you reach the maximum length and the process dies.

If you cannot guarantee the shape of the incoming data, recursive iteration becomes an open threat. An attacker only needs to craft a deep enough object to crash your servers.

I used a flat loop implementation that is both more memory efficient (less function calls, less passing of temporary arguments) and more secure. I am not pointing this out to brag, but to highlight how basic engineering practices can create (or avoid) security pitfalls.

Putting it to the test
I sent the code to two people. First to Nathan LaFreniere to double check the security properties of the solution, and then to Matteo Collina to review the performance. They are among the very best at what they do and often my go-to people.

The performance benchmarks confirmed that the "happy path" was practically unaffected. The interesting findings was that removing the offending values was faster then throwing an exception. This raised the question of what should be the default behavior of the new module — which I called bourne —  error or sanitize.

The concern, again, was exposing the application to a DoS attack. If sending a request with **proto** makes things 500% slower, that could be an easy vector to exploit. But after a bit more testing we confirmed that sending any invalid JSON text was creating a very similar cost.

In other words, if you parse JSON, invalid values are going to cost you more, regardless of what makes them invalid. It is also important to remember that while the benchmark showed the significant % cost of scanning suspected objects, the actual cost in CPU time was still in the fraction of milliseconds. Important to note and measure but not actually harmful.

hapi ever-after
There are a bunch of things to be grateful for.

The initial disclosure by the Lob team was perfect. It was reported privately, to the right people, with the right information. They followed up with additional findings, and gave us the time and space to resolve it the right way. Lob also was a major sponsor of my work on hapi over the years and that financial support is critical to allow everything else to happen. More on that in a bit.

Triage was stressful but staffed with the right people. Having folks like Nicolas Morel, Nathan, and Matteo, available and eager to help is critical. This isn't easy to deal with without the pressure, but with it, mistakes are likely without proper team collaboration.

We got lucky with the actual vulnerability. What started up looking like a catastrophic problem, ended up being a delicate but straight-forward problem to address.

We also got lucky by having full access to mitigate it at the source — didn't need to send emails to some unknown framework maintainer and hope for a quick answer. hapi's total control over all of its dependencies proved its usefulness and security again. Not using hapi? Maybe you should.

The after in happy ever-after
This is where I have to take advantage of this incident to reiterate the cost and need for sustainable and secure open source.

My time alone on this one issue exceeded 20 hours. That's half a working week. It came at the end of a month were I already spent over 30 hours publishing a new major release of hapi (most of the work was done in December). This puts me at a personal financial loss of over $5000 this month (I had to cut back on paid client work to make time for it).

If you rely on code I maintain, this is exactly the level of support, quality, and commitment you want (and lets be honest — expect). Most of you take it for granted — not just my work but the work of hundreds of other dedicated open source maintainers.

Because this work is important, I decided to try and make it not just financially sustainable but to grow and expand it. There is so much to improve. This is exactly what motivates me to implement the new commercial licensing plan coming in March. You can read more about it here.

# Serverless

Run serverless applications and REST APIs using your existing Fastify application. You may need to make code changes to work on your serverless platform of choice. This document contains a small guide for the most popular serverless providers and how to use Fastify with them.

Should you use Fastify in a serverless platform?
That is up to you! Keep in mind, functions as a service should always use small and focused functions, but you can also run an entire web application with them. It is important to remember that the bigger the application the slower the initial boot will be. The best way to run Fastify applications in serverless environments is to use platforms like Google Cloud Run, AWS Fargate, Azure Container Instances, and Vercel where the server can handle multiple requests at the same time and make full use of Fastify's features.

One of the best features of using Fastify in serverless applications is the ease of development. In your local environment, you will always run the Fastify application directly without the need for any additional tools, while the same code will be executed in your serverless platform of choice with an additional snippet of code.

Contents
AWS
Genezio
Google Cloud Functions
Google Firebase Functions
Google Cloud Run
Netlify Lambda
Vercel
AWS
To integrate with AWS, you have two choices of library:

Using @fastify/aws-lambda which only adds API Gateway support but has heavy optimizations for fastify.
Using @h4ad/serverless-adapter which is a little slower as it creates an HTTP request for each AWS event but has support for more AWS services such as: AWS SQS, AWS SNS and others.
So you can decide which option is best for you, but you can test both libraries.

Using @fastify/aws-lambda
The sample provided allows you to easily build serverless web applications/services and RESTful APIs using Fastify on top of AWS Lambda and Amazon API Gateway.

app.js
const fastify = require('fastify');

function init() {
const app = fastify();
app.get('/', (request, reply) => reply.send({ hello: 'world' }));
return app;
}

if (require.main === module) {
// called directly i.e. "node app"
init().listen({ port: 3000 }, (err) => {
if (err) console.error(err);
console.log('server listening on 3000');
});
} else {
// required as a module => executed on aws lambda
module.exports = init;
}

When executed in your lambda function we do not need to listen to a specific port, so we just export the wrapper function init in this case. The lambda.js file will use this export.

When you execute your Fastify application like always, i.e. node app.js (the detection for this could be require.main === module), you can normally listen to your port, so you can still run your Fastify function locally.

lambda.js
const awsLambdaFastify = require('@fastify/aws-lambda')
const init = require('./app');

const proxy = awsLambdaFastify(init())
// or
// const proxy = awsLambdaFastify(init(), { binaryMimeTypes: ['application/octet-stream'] })

exports.handler = proxy;
// or
// exports.handler = (event, context, callback) => proxy(event, context, callback);
// or
// exports.handler = (event, context) => proxy(event, context);
// or
// exports.handler = async (event, context) => proxy(event, context);

We just require @fastify/aws-lambda (make sure you install the dependency npm i @fastify/aws-lambda) and our app.js file and call the exported awsLambdaFastify function with the app as the only parameter. The resulting proxy function has the correct signature to be used as a lambda handler function. This way all the incoming events (API Gateway requests) are passed to the proxy function of @fastify/aws-lambda.

Example
An example deployable with claudia.js can be found here.

Considerations
API Gateway does not support streams yet, so you are not able to handle streams.
API Gateway has a timeout of 29 seconds, so it is important to provide a reply during this time.
Beyond API Gateway
If you need to integrate with more AWS services, take a look at @h4ad/serverless-adapter on Fastify to find out how to integrate.

Genezio
Genezio is a platform designed to simplify the deployment of serverless applications to the cloud.

Genezio has a dedicated guide for deploying a Fastify application.

Google Cloud Functions
Creation of Fastify instance
const fastify = require("fastify")({
logger: true // you can also define the level passing an object configuration to logger: {level: 'debug'}
});

Add Custom contentTypeParser to Fastify instance
As explained in issue #946, since the Google Cloud Functions platform parses the body of the request before it arrives at the Fastify instance, troubling the body request in case of POST and PATCH methods, you need to add a custom Content-Type Parser to mitigate this behavior.

fastify.addContentTypeParser('application/json', {}, (req, body, done) => {
done(null, body.body);
});

Define your endpoint (examples)
A simple GET endpoint:

fastify.get('/', async (request, reply) => {
reply.send({message: 'Hello World!'})
})

Or a more complete POST endpoint with schema validation:

fastify.route({
method: 'POST',
url: '/hello',
schema: {
body: {
type: 'object',
properties: {
name: { type: 'string'}
},
required: ['name']
},
response: {
200: {
type: 'object',
properties: {
message: {type: 'string'}
}
}
},
},
handler: async (request, reply) => {
const { name } = request.body;
reply.code(200).send({
message: `Hello ${name}!`
})
}
})

Implement and export the function
Final step, implement the function to handle the request and pass it to Fastify by emitting request event to fastify.server:

const fastifyFunction = async (request, reply) => {
await fastify.ready();
fastify.server.emit('request', request, reply)
}

exports.fastifyFunction = fastifyFunction;

Local test
Install Google Functions Framework for Node.js.

You can install it globally:

npm i -g @google-cloud/functions-framework

Or as a development library:

npm i -D @google-cloud/functions-framework

Then you can run your function locally with Functions Framework:

npx @google-cloud/functions-framework --target=fastifyFunction

Or add this command to your package.json scripts:

"scripts": {
...
"dev": "npx @google-cloud/functions-framework --target=fastifyFunction"
...
}

and run it with npm run dev.

Deploy
gcloud functions deploy fastifyFunction \
--runtime nodejs14 --trigger-http --region $GOOGLE_REGION --allow-unauthenticated

Read logs
gcloud functions logs read

Example request to /hello endpoint
curl -X POST https://$GOOGLE_REGION-$GOOGLE_PROJECT.cloudfunctions.net/me \
 -H "Content-Type: application/json" \
 -d '{ "name": "Fastify" }'
{"message":"Hello Fastify!"}

References
Google Cloud Functions - Node.js Quickstart
Google Firebase Functions
Follow this guide if you want to use Fastify as the HTTP framework for Firebase Functions instead of the vanilla JavaScript router provided with onRequest(async (req, res) => {}.

The onRequest() handler
We use the onRequest function to wrap our Fastify application instance.

As such, we'll begin with importing it to the code:

const { onRequest } = require("firebase-functions/v2/https")

Creation of Fastify instance
Create the Fastify instance and encapsulate the returned application instance in a function that will register routes, await the server's processing of plugins, hooks, and other settings. As follows:

const fastify = require("fastify")({
logger: true,
})

const fastifyApp = async (request, reply) => {
await registerRoutes(fastify)
await fastify.ready()
fastify.server.emit("request", request, reply)
}

Add Custom contentTypeParser to Fastify instance and define endpoints
Firebase Function's HTTP layer already parses the request and makes a JSON payload available. It also provides access to the raw body, unparsed, which is useful for calculating request signatures to validate HTTP webhooks.

Add as follows to the registerRoutes() function:

async function registerRoutes (fastify) {
fastify.addContentTypeParser("application/json", {}, (req, payload, done) => {
// useful to include the request's raw body on the `req` object that will
// later be available in your other routes so you can calculate the HMAC
// if needed
req.rawBody = payload.rawBody

    // payload.body is already the parsed JSON so we just fire the done callback
    // with it
    done(null, payload.body)

})

// define your endpoints here...
fastify.post("/some-route-here", async (request, reply) => {})

fastify.get('/', async (request, reply) => {
reply.send({message: 'Hello World!'})
})
}

Export the function using Firebase onRequest
Final step is to export the Fastify app instance to Firebase's own onRequest() function so it can pass the request and reply objects to it:

exports.app = onRequest(fastifyApp)

Local test
Install the Firebase tools functions so you can use the CLI:

npm i -g firebase-tools

Then you can run your function locally with:

firebase emulators:start --only functions

Deploy
Deploy your Firebase Functions with:

firebase deploy --only functions

Read logs
Use the Firebase tools CLI:

firebase functions:log

References
Fastify on Firebase Functions
An article about HTTP webhooks on Firebase Functions and Fastify: A Practical Case Study with Lemon Squeezy
Google Cloud Run
Unlike AWS Lambda or Google Cloud Functions, Google Cloud Run is a serverless container environment. Its primary purpose is to provide an infrastructure-abstracted environment to run arbitrary containers. As a result, Fastify can be deployed to Google Cloud Run with little-to-no code changes from the way you would write your Fastify app normally.

Follow the steps below to deploy to Google Cloud Run if you are already familiar with gcloud or just follow their quickstart.

Adjust Fastify server
For Fastify to properly listen for requests within the container, be sure to set the correct port and address:

function build() {
const fastify = Fastify({ trustProxy: true })
return fastify
}

async function start() {
// Google Cloud Run will set this environment variable for you, so
// you can also use it to detect if you are running in Cloud Run
const IS_GOOGLE_CLOUD_RUN = process.env.K_SERVICE !== undefined

// You must listen on the port Cloud Run provides
const port = process.env.PORT || 3000

// You must listen on all IPV4 addresses in Cloud Run
const host = IS_GOOGLE_CLOUD_RUN ? "0.0.0.0" : undefined

try {
const server = build()
const address = await server.listen({ port, host })
console.log(`Listening on ${address}`)
} catch (err) {
console.error(err)
process.exit(1)
}
}

module.exports = build

if (require.main === module) {
start()
}

Add a Dockerfile
You can add any valid Dockerfile that packages and runs a Node app. A basic Dockerfile can be found in the official gcloud docs.

# Use the official Node.js 10 image.

# https://hub.docker.com/_/node

FROM node:10

# Create and change to the app directory.

WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.

# A wildcard is used to ensure both package.json AND package-lock.json are copied.

# Copying this separately prevents re-running npm install on every code change.

COPY package\*.json ./

# Install production dependencies.

RUN npm i --production

# Copy local code to the container image.

COPY . .

# Run the web service on container startup.

CMD [ "npm", "start" ]

Add a .dockerignore
To keep build artifacts out of your container (which keeps it small and improves build times) add a .dockerignore file like the one below:

Dockerfile
README.md
node_modules
npm-debug.log

Submit build
Next, submit your app to be built into a Docker image by running the following command (replacing PROJECT-ID and APP-NAME with your GCP project id and an app name):

gcloud builds submit --tag gcr.io/PROJECT-ID/APP-NAME

Deploy Image
After your image has built, you can deploy it with the following command:

gcloud beta run deploy --image gcr.io/PROJECT-ID/APP-NAME --platform managed

Your app will be accessible from the URL GCP provides.

netlify-lambda
First, please perform all preparation steps related to AWS Lambda.

Create a folder called functions, then create server.js (and your endpoint path will be server.js) inside the functions folder.

functions/server.js
export { handler } from '../lambda.js'; // Change `lambda.js` path to your `lambda.js` path

netlify.toml
[build]

# This will be run the site build

command = "npm run build:functions"

# This is the directory is publishing to netlify's CDN

# and this is directory of your front of your app

# publish = "build"

# functions build directory

functions = "functions-build" # always appends `-build` folder to your `functions` folder for builds

webpack.config.netlify.js
Do not forget to add this Webpack config, or else problems may occur

const nodeExternals = require('webpack-node-externals');
const dotenv = require('dotenv-safe');
const webpack = require('webpack');

const env = process.env.NODE_ENV || 'production';
const dev = env === 'development';

if (dev) {
dotenv.config({ allowEmptyValues: true });
}

module.exports = {
mode: env,
devtool: dev ? 'eval-source-map' : 'none',
externals: [nodeExternals()],
devServer: {
proxy: {
'/.netlify': {
target: 'http://localhost:9000',
pathRewrite: { '^/.netlify/functions': '' }
}
}
},
module: {
rules: []
},
plugins: [
new webpack.DefinePlugin({
'process.env.APP_ROOT_PATH': JSON.stringify('/'),
'process.env.NETLIFY_ENV': true,
'process.env.CONTEXT': env
})
]
};

Scripts
Add this command to your package.json scripts

"scripts": {
...
"build:functions": "netlify-lambda build functions --config ./webpack.config.netlify.js"
...
}

Then it should work fine.

Vercel
Vercel fully supports deploying Fastify applications. Additionally, with Vercel's Fluid compute, you can combine server-like concurrency with the autoscaling properties of traditional serverless functions.

Get started with the Fastify Node.js template on Vercel.

Fluid compute currently requires an explicit opt-in. Learn more about enabling Fluid compute here.

# Fastify Style Guide

Welcome
Welcome to Fastify Style Guide. This guide is here to provide you with a conventional writing style for users writing developer documentation on our Open Source framework. Each topic is precise and well explained to help you write documentation users can easily understand and implement.

Who is this guide for?
This guide is for anyone who loves to build with Fastify or wants to contribute to our documentation. You do not need to be an expert in writing technical documentation. This guide is here to help you.

Visit the contribute page on our website or read the CONTRIBUTING.md file on GitHub to join our Open Source folks.

Before you write
You need to know the following:

JavaScript
Node.js
Git
GitHub
Markdown
HTTP
NPM
Consider your Audience
Before you start writing, think about your audience. In this case, your audience should already know HTTP, JavaScript, NPM, and Node.js. It is necessary to keep your readers in mind because they are the ones consuming your content. You want to give as much useful information as possible. Consider the vital things they need to know and how they can understand them. Use words and references that readers can relate to easily. Ask for feedback from the community, it can help you write better documentation that focuses on the user and what you want to achieve.

Get straight to the point
Give your readers a clear and precise action to take. Start with what is most important. This way, you can help them find what they need faster. Mostly, readers tend to read the first content on a page, and many will not scroll further.

Example

Less like this: Colons are very important to register a parametric path. It lets the framework know there is a new parameter created. You can place the colon before the parameter name so the parametric path can be created.

More Like this: To register a parametric path, put a colon before the parameter name. Using a colon lets the framework know it is a parametric path and not a static path.

Avoid adding video or image content
Do not add videos or screenshots to the documentation. It is easier to keep under version control. Videos and images will eventually end up becoming outdated as new updates keep developing. Instead, make a referral link or a YouTube video. You can add links by using [Title](www.websitename.com) in the markdown.

Example

To learn more about hooks, see [Fastify hooks](https://fastify.dev/docs/latest/Reference/Hooks/).

Result:

To learn more about hooks, see Fastify hooks.

Avoid plagiarism
Make sure you avoid copying other people's work. Keep it as original as possible. You can learn from what they have done and reference where it is from if you use a particular quote from their work.

Word Choice
There are a few things you need to use and avoid when writing your documentation to improve readability for readers and make documentation neat, direct, and clean.

When to use the second person "you" as the pronoun
When writing articles or guides, your content should communicate directly to readers in the second person ("you") addressed form. It is easier to give them direct instruction on what to do on a particular topic. To see an example, visit the Plugins Guide.

Example

Less like this: we can use the following plugins.

More like this: You can use the following plugins.

According to Wikipedia, You is usually a second person pronoun. Also, used to refer to an indeterminate person, as a more common alternative to a very formal indefinite pronoun.

When to avoid the second person "you" as the pronoun
One of the main rules of formal writing such as reference documentation, or API documentation, is to avoid the second person ("you") or directly addressing the reader.

Example

Less like this: You can use the following recommendation as an example.

More like this: As an example, the following recommendations should be referenced.

To view a live example, refer to the Decorators reference document.

Avoid using contractions
Contractions are the shortened version of written and spoken forms of a word, i.e. using "don't" instead of "do not". Avoid contractions to provide a more formal tone.

Avoid using condescending terms
Condescending terms are words that include:

Just
Easy
Simply
Basically
Obviously
The reader may not find it easy to use Fastify's framework and plugins; avoid words that make it sound simple, easy, offensive, or insensitive. Not everyone who reads the documentation has the same level of understanding.

Starting with a verb
Mostly start your description with a verb, which makes it simple and precise for the reader to follow. Prefer using present tense because it is easier to read and understand than the past or future tense.

Example

Less like this: There is a need for Node.js to be installed before you can be able to use Fastify.

More like this: Install Node.js to make use of Fastify.

Grammatical moods
Grammatical moods are a great way to express your writing. Avoid sounding too bossy while making a direct statement. Know when to switch between indicative, imperative, and subjunctive moods.

Indicative - Use when making a factual statement or question.

Example: Since there is no testing framework available, "Fastify recommends ways to write tests".

Imperative - Use when giving instructions, actions, commands, or when you write your headings.

Example: Install dependencies before starting development.

Subjunctive - Use when making suggestions, hypotheses, or non-factual statements.

Example: Reading the documentation on our website is recommended to get comprehensive knowledge of the framework.

Use active voice instead of passive
Using active voice is a more compact and direct way of conveying your documentation.

Example

Passive: The node dependencies and packages are installed by npm.

Active: npm installs packages and node dependencies.

Writing Style
Documentation titles
When creating a new guide, API, or reference in the /docs/ directory, use short titles that best describe the topic of your documentation. Name your files in kebab-cases and avoid Raw or camelCase. To learn more about kebab-case you can visit this medium article on Case Styles.

Examples:

hook-and-plugins.md,

adding-test-plugins.md,

removing-requests.md.

Hyperlinks
Hyperlinks should have a clear title of what they reference. Here is how your hyperlink should look:

<!-- More like this -->

// Add clear & brief description
[Fastify Plugins] (https://fastify.dev/docs/latest/Plugins/)

<!--Less like this -->

// incomplete description
[Fastify] (https://fastify.dev/docs/latest/Plugins/)

// Adding title in link brackets
[](https://fastify.dev/docs/latest/Plugins/ 'fastify plugin')

// Empty title
[](https://fastify.dev/docs/latest/Plugins/)

// Adding links localhost URLs instead of using code strings (``)
[http://localhost:3000/](http://localhost:3000/)

Include in your documentation as many essential references as possible, but avoid having numerous links when writing for beginners to avoid distractions.

# Write-Type-Provider

How to write your own type provider
Things to keep in mind when implementing a custom type provider:

Type Contravariance
Whereas exhaustive type narrowing checks normally rely on never to represent an unreachable state, reduction in type provider interfaces should only be done up to unknown.

The reasoning is that certain methods of FastifyInstance are contravariant on TypeProvider, which can lead to TypeScript surfacing assignability issues unless the custom type provider interface is substitutable with FastifyTypeProviderDefault.

For example, FastifyTypeProviderDefault will not be assignable to the following:

export interface NotSubstitutableTypeProvider extends FastifyTypeProvider {
// bad, nothing is assignable to `never` (except for itself)
validator: this['schema'] extends /** custom check here**/ ? /** narrowed type here **/ : never;
serializer: this['schema'] extends /** custom check here**/ ? /** narrowed type here **/ : never;
}

Unless changed to:

export interface SubstitutableTypeProvider extends FastifyTypeProvider {
// good, anything can be assigned to `unknown`
validator: this['schema'] extends /** custom check here**/ ? /** narrowed type here **/ : unknown;
serializer: this['schema'] extends /** custom check here**/ ? /** narrowed type here **/ : unknown;
}

Edit this page
Previous
Fastify Style Guide
Next
Index
How to write your own type provider
Type Contravariance
