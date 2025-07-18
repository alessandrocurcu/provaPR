## `Content-Type` Parser

Fastify natively supports `'application/json'` and `'text/plain'` content types
with a default charset of `utf-8`. These default parsers can be changed or
removed.

Unsupported content types will throw an `FST_ERR_CTP_INVALID_MEDIA_TYPE` error.

To support other content types, use the `addContentTypeParser` API or an
existing [plugin](https://fastify.dev/ecosystem/).

As with other APIs, `addContentTypeParser` is encapsulated in the scope in which
it is declared. If declared in the root scope, it is available everywhere; if
declared in a plugin, it is available only in that scope and its children.

Fastify automatically adds the parsed request payload to the [Fastify
request](./Request.md) object, accessible via `request.body`.

Note that for `GET` and `HEAD` requests, the payload is never parsed. For
`OPTIONS` and `DELETE` requests, the payload is parsed only if a valid
`content-type` header is provided. Unlike `POST`, `PUT`, and `PATCH`, the
[catch-all](#catch-all) parser is not executed, and the payload is simply not
parsed.

> ⚠ Warning:
> When using regular expressions to detect `Content-Type`, it is important to
> ensure proper detection. For example, to match `application/*`, use
> `/^application\/([\w-]+);?/` to match the
> [essence MIME type](https://mimesniff.spec.whatwg.org/#mime-type-miscellaneous)
> only.

### Usage

```js
fastify.addContentTypeParser(
  'application/jsoff',
  function (request, payload, done) {
    jsoffParser(payload, function (err, body) {
      done(err, body);
    });
  }
);

// Handle multiple content types with the same function
fastify.addContentTypeParser(
  ['text/xml', 'application/xml'],
  function (request, payload, done) {
    xmlParser(payload, function (err, body) {
      done(err, body);
    });
  }
);

// Async is also supported in Node versions >= 8.0.0
fastify.addContentTypeParser(
  'application/jsoff',
  async function (request, payload) {
    const res = await jsoffParserAsync(payload);

    return res;
  }
);

// Handle all content types that matches RegExp
fastify.addContentTypeParser(
  /^image\/([\w-]+);?/,
  function (request, payload, done) {
    imageParser(payload, function (err, body) {
      done(err, body);
    });
  }
);

// Can use default JSON/Text parser for different content Types
fastify.addContentTypeParser(
  'text/json',
  { parseAs: 'string' },
  fastify.getDefaultJsonParser('ignore', 'ignore')
);
```

Fastify first tries to match a content-type parser with a `string` value before
trying to find a matching `RegExp`. For overlapping content types, it starts
with the last one configured and ends with the first (last in, first out).
To specify a general content type more precisely, first specify the general
type, then the specific one, as shown below.

```js
// Here only the second content type parser is called because its value also matches the first one
fastify.addContentTypeParser(
  'application/vnd.custom+xml',
  (request, body, done) => {}
);
fastify.addContentTypeParser(
  'application/vnd.custom',
  (request, body, done) => {}
);

// Here the desired behavior is achieved because fastify first tries to match the
// `application/vnd.custom+xml` content type parser
fastify.addContentTypeParser(
  'application/vnd.custom',
  (request, body, done) => {}
);
fastify.addContentTypeParser(
  'application/vnd.custom+xml',
  (request, body, done) => {}
);
```

### Using addContentTypeParser with fastify.register

When using `addContentTypeParser` with `fastify.register`, avoid `await`
when registering routes. Using `await` makes route registration asynchronous,
potentially registering routes before `addContentTypeParser` is set.

#### Correct Usage

```js
const fastify = require('fastify')();

fastify.register((fastify, opts) => {
  fastify.addContentTypeParser(
    'application/json',
    function (request, payload, done) {
      jsonParser(payload, function (err, body) {
        done(err, body);
      });
    }
  );

  fastify.get('/hello', async (req, res) => {});
});
```

In addition to `addContentTypeParser`, the `hasContentTypeParser`,
`removeContentTypeParser`, and `removeAllContentTypeParsers` APIs are available.

#### hasContentTypeParser

Use the `hasContentTypeParser` API to check if a specific content type parser
exists.

```js
if (!fastify.hasContentTypeParser('application/jsoff')) {
  fastify.addContentTypeParser(
    'application/jsoff',
    function (request, payload, done) {
      jsoffParser(payload, function (err, body) {
        done(err, body);
      });
    }
  );
}
```

#### removeContentTypeParser

`removeContentTypeParser` can remove a single content type or an array of
content types, supporting both `string` and `RegExp`.

```js
fastify.addContentTypeParser('text/xml', function (request, payload, done) {
  xmlParser(payload, function (err, body) {
    done(err, body);
  });
});

// Removes the both built-in content type parsers so that only the content type parser for text/html is available
fastify.removeContentTypeParser(['application/json', 'text/plain']);
```

#### removeAllContentTypeParsers

The `removeAllContentTypeParsers` API removes all existing content type parsers
eliminating the need to specify each one individually. This API supports
encapsulation and is useful for registering a
[catch-all content type parser](#catch-all) that should be executed for every
content type, ignoring built-in parsers.

```js
fastify.removeAllContentTypeParsers();

fastify.addContentTypeParser('text/xml', function (request, payload, done) {
  xmlParser(payload, function (err, body) {
    done(err, body);
  });
});
```

> ℹ️ Note: `function(req, done)` and `async function(req)` are
> still supported but deprecated.

#### Body Parser

The request body can be parsed in two ways. First, add a custom content type
parser and handle the request stream. Or second, use the `parseAs` option in the
`addContentTypeParser` API, specifying `'string'` or `'buffer'`. Fastify will
handle the stream, check the [maximum size](./Server.md#factory-body-limit) of
the body, and the content length. If the limit is exceeded, the custom parser
will not be invoked.

```js
fastify.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  function (req, body, done) {
    try {
      const json = JSON.parse(body);
      done(null, json);
    } catch (err) {
      err.statusCode = 400;
      done(err, undefined);
    }
  }
);
```

See
[`example/parser.js`](https://github.com/fastify/fastify/blob/main/examples/parser.js)
for an example.

##### Custom Parser Options

- `parseAs` (string): `'string'` or `'buffer'` to designate how the incoming
  data should be collected. Default: `'buffer'`.
- `bodyLimit` (number): The maximum payload size, in bytes, that the custom
  parser will accept. Defaults to the global body limit passed to the [`Fastify
factory function`](./Server.md#bodylimit).

#### Catch-All

To catch all requests regardless of content type, use the `'*'` content type:

```js
fastify.addContentTypeParser('*', function (request, payload, done) {
  let data = '';
  payload.on('data', (chunk) => {
    data += chunk;
  });
  payload.on('end', () => {
    done(null, data);
  });
});
```

All requests without a corresponding content type parser will be handled by
this function.

This is also useful for piping the request stream. Define a content parser like:

```js
fastify.addContentTypeParser('*', function (request, payload, done) {
  done();
});
```

And then access the core HTTP request directly for piping:

```js
app.post('/hello', (request, reply) => {
  reply.send(request.raw);
});
```

Here is a complete example that logs incoming [json
line](https://jsonlines.org/) objects:

```js
const split2 = require('split2');
const pump = require('pump');

fastify.addContentTypeParser('*', (request, payload, done) => {
  done(null, pump(payload, split2(JSON.parse)));
});

fastify.route({
  method: 'POST',
  url: '/api/log/jsons',
  handler: (req, res) => {
    req.body.on('data', (d) => console.log(d)); // log every incoming object
  },
});
```

For piping file uploads, check out
[`@fastify/multipart`](https://github.com/fastify/fastify-multipart).

To execute the content type parser on all content types, call
`removeAllContentTypeParsers` first.

```js
// Without this call, the request body with the content type application/json would be processed by the built-in JSON parser
fastify.removeAllContentTypeParsers();

fastify.addContentTypeParser('*', function (request, payload, done) {
  const data = '';
  payload.on('data', (chunk) => {
    data += chunk;
  });
  payload.on('end', () => {
    done(null, data);
  });
});
```

## Decorators

The decorators API customizes core Fastify objects, such as the server instance
and any request and reply objects used during the HTTP request lifecycle. It
can attach any type of property to core objects, e.g., functions, plain
objects, or native types.

This API is _synchronous_. Defining a decoration asynchronously could result in
the Fastify instance booting before the decoration completes. To register an
asynchronous decoration, use the `register` API with `fastify-plugin`. See the
[Plugins](./Plugins.md) documentation for more details.

Decorating core objects with this API allows the underlying JavaScript engine to
optimize the handling of server, request, and reply objects. This is
accomplished by defining the shape of all such object instances before they are
instantiated and used. As an example, the following is not recommended because
it will change the shape of objects during their lifecycle:

```js
// Bad example! Continue reading.

// Attach a user property to the incoming request before the request
// handler is invoked.
fastify.addHook('preHandler', function (req, reply, done) {
  req.user = 'Bob Dylan';
  done();
});

// Use the attached user property in the request handler.
fastify.get('/', function (req, reply) {
  reply.send(`Hello, ${req.user}`);
});
```

The above example mutates the request object after instantiation, causing the
JavaScript engine to deoptimize access. Using the decoration API avoids this
deoptimization:

```js
// Decorate request with a 'user' property
fastify.decorateRequest('user', '');

// Update our property
fastify.addHook('preHandler', (req, reply, done) => {
  req.user = 'Bob Dylan';
  done();
});
// And finally access it
fastify.get('/', (req, reply) => {
  reply.send(`Hello, ${req.user}!`);
});
```

Keep the initial shape of a decorated field close to its future dynamic value.
Initialize a decorator as `''` for strings and `null` for objects or functions.
This works only with value types; reference types will throw an error during
Fastify startup. See [decorateRequest](#decorate-request) and
[JavaScript engine fundamentals: Shapes
and Inline Caches](https://mathiasbynens.be/notes/shapes-ics)
for more information.

### Usage

<a id="usage"></a>

#### `decorate(name, value, [dependencies])`

<a id="decorate"></a>

This method customizes the Fastify [server](./Server.md) instance.

For example, to attach a new method to the server instance:

```js
fastify.decorate('utility', function () {
  // Something very useful
});
```

Non-function values can also be attached to the server instance:

```js
fastify.decorate('conf', {
  db: 'some.db',
  port: 3000,
});
```

To access decorated properties, use the name provided to the decoration API:

```js
fastify.utility();

console.log(fastify.conf.db);
```

The decorated [Fastify server](./Server.md) is bound to `this` in
[route](./Routes.md) handlers:

```js
fastify.decorate('db', new DbConnection());

fastify.get('/', async function (request, reply) {
  // using return
  return { hello: await this.db.query('world') };

  // or
  // using reply.send()
  reply.send({ hello: await this.db.query('world') });
  await reply;
});
```

The `dependencies` parameter is an optional list of decorators that the
decorator being defined relies upon. This list contains the names of other
decorators. In the following example, the "utility" decorator depends on the
"greet" and "hi" decorators:

```js
async function greetDecorator(fastify, opts) {
  fastify.decorate('greet', () => {
    return 'greet message';
  });
}

async function hiDecorator(fastify, opts) {
  fastify.decorate('hi', () => {
    return 'hi message';
  });
}

async function utilityDecorator(fastify, opts) {
  fastify.decorate('utility', () => {
    return `${fastify.greet()} | ${fastify.hi()}`;
  });
}

fastify.register(fastifyPlugin(greetDecorator, { name: 'greet' }));
fastify.register(fastifyPlugin(hiDecorator, { name: 'hi' }));
fastify.register(
  fastifyPlugin(utilityDecorator, { dependencies: ['greet', 'hi'] })
);

fastify.get('/', function (req, reply) {
  // Response: {"hello":"greet message | hi message"}
  reply.send({ hello: fastify.utility() });
});

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) throw err;
});
```

Using an arrow function breaks the binding of `this` to
the `FastifyInstance`.

If a dependency is not satisfied, the `decorate` method throws an exception.
The dependency check occurs before the server instance boots, not during
runtime.

#### `decorateReply(name, value, [dependencies])`

<a id="decorate-reply"></a>

This API adds new methods/properties to the core `Reply` object:

```js
fastify.decorateReply('utility', function () {
  // Something very useful
});
```

Using an arrow function will break the binding of `this` to the Fastify
`Reply` instance.

Using `decorateReply` will throw and error if used with a reference type:

```js
// Don't do this
fastify.decorateReply('foo', { bar: 'fizz' });
```

In this example, the object reference would be shared with all requests, and
**any mutation will impact all requests, potentially creating security
vulnerabilities or memory leaks**. Fastify blocks this.

To achieve proper encapsulation across requests configure a new value for each
incoming request in the [`'onRequest'` hook](./Hooks.md#onrequest).

```js
const fp = require('fastify-plugin');

async function myPlugin(app) {
  app.decorateReply('foo');
  app.addHook('onRequest', async (req, reply) => {
    reply.foo = { bar: 42 };
  });
}

module.exports = fp(myPlugin);
```

See [`decorate`](#decorate) for information about the `dependencies` parameter.

#### `decorateRequest(name, value, [dependencies])`

<a id="decorate-request"></a>

As with [`decorateReply`](#decorate-reply), this API adds new methods/properties
to the core `Request` object:

```js
fastify.decorateRequest('utility', function () {
  // something very useful
});
```

Using an arrow function will break the binding of `this` to the Fastify
`Request` instance.

Using `decorateRequest` will emit an error if used with a reference type:

```js
// Don't do this
fastify.decorateRequest('foo', { bar: 'fizz' });
```

In this example, the object reference would be shared with all requests, and
**any mutation will impact all requests, potentially creating security
vulnerabilities or memory leaks**. Fastify blocks this.

To achieve proper encapsulation across requests configure a new value for each
incoming request in the [`'onRequest'` hook](./Hooks.md#onrequest).

Example:

```js
const fp = require('fastify-plugin');

async function myPlugin(app) {
  app.decorateRequest('foo');
  app.addHook('onRequest', async (req, reply) => {
    req.foo = { bar: 42 };
  });
}

module.exports = fp(myPlugin);
```

The hook solution is more flexible and allows for more complex initialization
because more logic can be added to the `onRequest` hook.

Another approach is to use the getter/setter pattern, but it requires 2 decorators:

```js
fastify.decorateRequest('my_decorator_holder'); // define the holder
fastify.decorateRequest('user', {
  getter() {
    this.my_decorator_holder ??= {}; // initialize the holder
    return this.my_decorator_holder;
  },
});

fastify.get('/', async function (req, reply) {
  req.user.access = 'granted';
  // other code
});
```

This ensures that the `user` property is always unique for each request.

See [`decorate`](#decorate) for information about the `dependencies` parameter.

#### `hasDecorator(name)`

<a id="has-decorator"></a>

Used to check for the existence of a server instance decoration:

```js
fastify.hasDecorator('utility');
```

#### hasRequestDecorator

<a id="has-request-decorator"></a>

Used to check for the existence of a Request decoration:

```js
fastify.hasRequestDecorator('utility');
```

#### hasReplyDecorator

<a id="has-reply-decorator"></a>

Used to check for the existence of a Reply decoration:

```js
fastify.hasReplyDecorator('utility');
```

### Decorators and Encapsulation

<a id="decorators-encapsulation"></a>

Defining a decorator (using `decorate`, `decorateRequest`, or `decorateReply`)
with the same name more than once in the same **encapsulated** context will
throw an exception. For example, the following will throw:

```js
const server = require('fastify')();

server.decorateReply('view', function (template, args) {
  // Amazing view rendering engine
});

server.get('/', (req, reply) => {
  reply.view('/index.html', { hello: 'world' });
});

// Somewhere else in our codebase, we define another
// view decorator. This throws.
server.decorateReply('view', function (template, args) {
  // Another rendering engine
});

server.listen({ port: 3000 });
```

But this will not:

```js
const server = require('fastify')();

server.decorateReply('view', function (template, args) {
  // Amazing view rendering engine.
});

server.register(
  async function (server, opts) {
    // We add a view decorator to the current encapsulated
    // plugin. This will not throw as outside of this encapsulated
    // plugin view is the old one, while inside it is the new one.
    server.decorateReply('view', function (template, args) {
      // Another rendering engine
    });

    server.get('/', (req, reply) => {
      reply.view('/index.page', { hello: 'world' });
    });
  },
  { prefix: '/bar' }
);

server.listen({ port: 3000 });
```

### Getters and Setters

<a id="getters-setters"></a>

Decorators accept special "getter/setter" objects with `getter` and optional
`setter` functions. This allows defining properties via decorators,
for example:

```js
fastify.decorate('foo', {
  getter() {
    return 'a getter';
  },
});
```

Will define the `foo` property on the Fastify instance:

```js
console.log(fastify.foo); // 'a getter'
```

### `getDecorator<T>` API

Fastify's `getDecorator<T>` API retrieves an existing decorator from the
Fastify instance, `Request`, or `Reply`. If the decorator is not defined, an
`FST_ERR_DEC_UNDECLARED` error is thrown.

#### Use cases

**Early Plugin Dependency Validation**

`getDecorator<T>` on Fastify instance verifies that required decorators are
available at registration time.

For example:

```js
fastify.register(async function (fastify) {
  const usersRepository = fastify.getDecorator('usersRepository');

  fastify.get('/users', async function (request, reply) {
    // We are sure `usersRepository` exists at runtime
    return usersRepository.findAll();
  });
});
```

**Handling Missing Decorators**

Directly accessing a decorator may lead to unexpected behavior if it is not declared:

```ts
const user = request.user;
if (user && user.isAdmin) {
  // Execute admin tasks.
}
```

If `request.user` doesn't exist, then `user` will be set to `undefined`.
This makes it unclear whether the user is unauthenticated or the decorator is missing.

Using `getDecorator` enforces runtime safety:

```ts
// If the decorator is missing, an explicit `FST_ERR_DEC_UNDECLARED`
// error is thrown immediately.
const user = request.getDecorator('user');
if (user && user.isAdmin) {
  // Execute admin tasks.
}
```

**Alternative to Module Augmentation**

Decorators are typically typed via module augmentation:

```ts
declare module 'fastify' {
  interface FastifyInstance {
    usersRepository: IUsersRepository;
  }
  interface FastifyRequest {
    session: ISession;
  }
  interface FastifyReply {
    sendSuccess: SendSuccessFn;
  }
}
```

This approach modifies the Fastify instance globally, which may lead to
conflicts and inconsistent behavior in multi-server setups or with plugin
encapsulation.

Using `getDecorator<T>` allows to limit types scope:

```ts
serverOne.register(async function (fastify) {
  const usersRepository =
    fastify.getDecorator<PostgreUsersRepository>('usersRepository');

  fastify.decorateRequest('session', null);
  fastify.addHook('onRequest', async (req, reply) => {
    // Yes, the request object has a setDecorator method.
    // More information will be provided soon.
    req.setDecorator('session', { user: 'Jean' });
  });

  fastify.get('/me', (request, reply) => {
    const session = request.getDecorator<ISession>('session');
    reply.send(session);
  });
});

serverTwo.register(async function (fastify) {
  const usersRepository =
    fastify.getDecorator<SqlLiteUsersRepository>('usersRepository');

  fastify.decorateReply('sendSuccess', function (data) {
    return this.send({ success: true });
  });

  fastify.get('/success', async (request, reply) => {
    const sendSuccess = reply.getDecorator<SendSuccessFn>('sendSuccess');
    await sendSuccess();
  });
});
```

#### Bound functions inference

To save time, it's common to infer function types instead of
writing them manually:

```ts
function sendSuccess(this: FastifyReply) {
  return this.send({ success: true });
}

export type SendSuccess = typeof sendSuccess;
```

However, `getDecorator` returns functions with the `this`
context already **bound**, meaning the `this` parameter disappears
from the function signature.

To correctly type it, you should use `OmitThisParameter` utility:

```ts
function sendSuccess(this: FastifyReply) {
  return this.send({ success: true });
}

type BoundSendSuccess = OmitThisParameter<typeof sendSuccess>;

fastify.decorateReply('sendSuccess', sendSuccess);
fastify.get('/success', async (request, reply) => {
  const sendSuccess = reply.getDecorator<BoundSendSuccess>('sendSuccess');
  await sendSuccess();
});
```

### `Request.setDecorator<T>` Method

The `setDecorator<T>` method provides a safe and convenient way to
update the value of a `Request` decorator.  
If the decorator does not exist, a `FST_ERR_DEC_UNDECLARED` error
is thrown.

#### Use Cases

**Runtime Safety**

A typical way to set a `Request` decorator looks like this:

```ts
fastify.decorateRequest('user', '');
fastify.addHook('preHandler', async (req, reply) => {
  req.user = 'Bob Dylan';
});
```

However, there is no guarantee that the decorator actually exists
unless you manually check beforehand.  
Additionally, typos are common, e.g. `account`, `acount`, or `accout`.

By using `setDecorator`, you are always sure that the decorator exists:

```ts
fastify.decorateRequest('user', '');
fastify.addHook('preHandler', async (req, reply) => {
  // Throws FST_ERR_DEC_UNDECLARED if the decorator does not exist
  req.setDecorator('user-with-typo', 'Bob Dylan');
});
```

---

**Type Safety**

If the `FastifyRequest` interface does not declare the decorator, you
would typically need to use type assertions:

```ts
fastify.addHook('preHandler', async (req, reply) => {
  (req as typeof req & { user: string }).user = 'Bob Dylan';
});
```

The `setDecorator<T>` method eliminates the need for explicit type
assertions while allowing type safety:

```ts
fastify.addHook('preHandler', async (req, reply) => {
  req.setDecorator<string>('user', 'Bob Dylan');
});
```

## Encapsulation

<a id="encapsulation"></a>

A fundamental feature of Fastify is the "encapsulation context." It governs
which [decorators](./Decorators.md), registered [hooks](./Hooks.md), and
[plugins](./Plugins.md) are available to [routes](./Routes.md). A visual
representation of the encapsulation context is shown in the following figure:

![Figure 1](../resources/encapsulation_context.svg)

In the figure above, there are several entities:

1. The _root context_
2. Three _root plugins_
3. Two _child contexts_, each with:
   - Two _child plugins_
   - One _grandchild context_, each with:
     - Three _child plugins_

Every _child context_ and _grandchild context_ has access to the _root plugins_.
Within each _child context_, the _grandchild contexts_ have access to the
_child plugins_ registered within the containing _child context_, but the
containing _child context_ **does not** have access to the _child plugins_
registered within its _grandchild context_.

Given that everything in Fastify is a [plugin](./Plugins.md) except for the
_root context_, every "context" and "plugin" in this example is a plugin
that can consist of decorators, hooks, plugins, and routes. To put this
example into concrete terms, consider a basic scenario of a REST API server
with three routes: the first route (`/one`) requires authentication, the
second route (`/two`) does not, and the third route (`/three`) has access to
the same context as the second route. Using [@fastify/bearer-auth][bearer] to
provide authentication, the code for this example is as follows:

```js
'use strict';

const fastify = require('fastify')();

fastify.decorateRequest('answer', 42);

fastify.register(async function authenticatedContext(childServer) {
  childServer.register(require('@fastify/bearer-auth'), { keys: ['abc123'] });

  childServer.route({
    path: '/one',
    method: 'GET',
    handler(request, response) {
      response.send({
        answer: request.answer,
        // request.foo will be undefined as it is only defined in publicContext
        foo: request.foo,
        // request.bar will be undefined as it is only defined in grandchildContext
        bar: request.bar,
      });
    },
  });
});

fastify.register(async function publicContext(childServer) {
  childServer.decorateRequest('foo', 'foo');

  childServer.route({
    path: '/two',
    method: 'GET',
    handler(request, response) {
      response.send({
        answer: request.answer,
        foo: request.foo,
        // request.bar will be undefined as it is only defined in grandchildContext
        bar: request.bar,
      });
    },
  });

  childServer.register(async function grandchildContext(grandchildServer) {
    grandchildServer.decorateRequest('bar', 'bar');

    grandchildServer.route({
      path: '/three',
      method: 'GET',
      handler(request, response) {
        response.send({
          answer: request.answer,
          foo: request.foo,
          bar: request.bar,
        });
      },
    });
  });
});

fastify.listen({ port: 8000 });
```

The server example above demonstrates the encapsulation concepts from the
original diagram:

1. Each _child context_ (`authenticatedContext`, `publicContext`, and
   `grandchildContext`) has access to the `answer` request decorator defined in
   the _root context_.
2. Only the `authenticatedContext` has access to the `@fastify/bearer-auth`
   plugin.
3. Both the `publicContext` and `grandchildContext` have access to the `foo`
   request decorator.
4. Only the `grandchildContext` has access to the `bar` request decorator.

To see this, start the server and issue requests:

```sh
# curl -H 'authorization: Bearer abc123' http://127.0.0.1:8000/one
{"answer":42}
# curl http://127.0.0.1:8000/two
{"answer":42,"foo":"foo"}
# curl http://127.0.0.1:8000/three
{"answer":42,"foo":"foo","bar":"bar"}
```

[bearer]: https://github.com/fastify/fastify-bearer-auth

## Sharing Between Contexts

<a id="shared-context"></a>

Each context in the prior example inherits _only_ from its parent contexts. Parent
contexts cannot access entities within their descendant contexts. If needed,
encapsulation can be broken using [fastify-plugin][fastify-plugin], making
anything registered in a descendant context available to the parent context.

To allow `publicContext` access to the `bar` decorator in `grandchildContext`,
rewrite the code as follows:

```js
'use strict';

const fastify = require('fastify')();
const fastifyPlugin = require('fastify-plugin');

fastify.decorateRequest('answer', 42);

// `authenticatedContext` omitted for clarity

fastify.register(async function publicContext(childServer) {
  childServer.decorateRequest('foo', 'foo');

  childServer.route({
    path: '/two',
    method: 'GET',
    handler(request, response) {
      response.send({
        answer: request.answer,
        foo: request.foo,
        bar: request.bar,
      });
    },
  });

  childServer.register(fastifyPlugin(grandchildContext));

  async function grandchildContext(grandchildServer) {
    grandchildServer.decorateRequest('bar', 'bar');

    grandchildServer.route({
      path: '/three',
      method: 'GET',
      handler(request, response) {
        response.send({
          answer: request.answer,
          foo: request.foo,
          bar: request.bar,
        });
      },
    });
  }
});

fastify.listen({ port: 8000 });
```

Restarting the server and re-issuing the requests for `/two` and `/three`:

```sh
# curl http://127.0.0.1:8000/two
{"answer":42,"foo":"foo","bar":"bar"}
# curl http://127.0.0.1:8000/three
{"answer":42,"foo":"foo","bar":"bar"}
```

[fastify-plugin]: https://github.com/fastify/fastify-plugin

## Errors

<a id="errors"></a>

**Table of contents**

- [Errors](#errors)
  - [Error Handling In Node.js](#error-handling-in-nodejs)
    - [Uncaught Errors](#uncaught-errors)
    - [Catching Errors In Promises](#catching-errors-in-promises)
  - [Errors In Fastify](#errors-in-fastify)
    - [Errors In Input Data](#errors-in-input-data)
    - [Catching Uncaught Errors In Fastify](#catching-uncaught-errors-in-fastify)
  - [Errors In Fastify Lifecycle Hooks And A Custom Error Handler](#errors-in-fastify-lifecycle-hooks-and-a-custom-error-handler)
  - [Fastify Error Codes](#fastify-error-codes)
    - [FST_ERR_NOT_FOUND](#fst_err_not_found)
    - [FST_ERR_OPTIONS_NOT_OBJ](#fst_err_options_not_obj)
    - [FST_ERR_QSP_NOT_FN](#fst_err_qsp_not_fn)
    - [FST_ERR_SCHEMA_CONTROLLER_BUCKET_OPT_NOT_FN](#fst_err_schema_controller_bucket_opt_not_fn)
    - [FST_ERR_SCHEMA_ERROR_FORMATTER_NOT_FN](#fst_err_schema_error_formatter_not_fn)
    - [FST_ERR_AJV_CUSTOM_OPTIONS_OPT_NOT_OBJ](#fst_err_ajv_custom_options_opt_not_obj)
    - [FST_ERR_AJV_CUSTOM_OPTIONS_OPT_NOT_ARR](#fst_err_ajv_custom_options_opt_not_arr)
    - [FST_ERR_CTP_ALREADY_PRESENT](#fst_err_ctp_already_present)
    - [FST_ERR_CTP_INVALID_TYPE](#fst_err_ctp_invalid_type)
    - [FST_ERR_CTP_EMPTY_TYPE](#fst_err_ctp_empty_type)
    - [FST_ERR_CTP_INVALID_HANDLER](#fst_err_ctp_invalid_handler)
    - [FST_ERR_CTP_INVALID_PARSE_TYPE](#fst_err_ctp_invalid_parse_type)
    - [FST_ERR_CTP_BODY_TOO_LARGE](#fst_err_ctp_body_too_large)
    - [FST_ERR_CTP_INVALID_MEDIA_TYPE](#fst_err_ctp_invalid_media_type)
    - [FST_ERR_CTP_INVALID_CONTENT_LENGTH](#fst_err_ctp_invalid_content_length)
    - [FST_ERR_CTP_EMPTY_JSON_BODY](#fst_err_ctp_empty_json_body)
    - [FST_ERR_CTP_INSTANCE_ALREADY_STARTED](#fst_err_ctp_instance_already_started)
    - [FST_ERR_INSTANCE_ALREADY_LISTENING](#fst_err_instance_already_listening)
    - [FST_ERR_DEC_ALREADY_PRESENT](#fst_err_dec_already_present)
    - [FST_ERR_DEC_DEPENDENCY_INVALID_TYPE](#fst_err_dec_dependency_invalid_type)
    - [FST_ERR_DEC_MISSING_DEPENDENCY](#fst_err_dec_missing_dependency)
    - [FST_ERR_DEC_AFTER_START](#fst_err_dec_after_start)
    - [FST_ERR_DEC_REFERENCE_TYPE](#fst_err_dec_reference_type)
    - [FST_ERR_DEC_UNDECLARED](#fst_err_dec_undeclared)
    - [FST_ERR_HOOK_INVALID_TYPE](#fst_err_hook_invalid_type)
    - [FST_ERR_HOOK_INVALID_HANDLER](#fst_err_hook_invalid_handler)
    - [FST_ERR_HOOK_INVALID_ASYNC_HANDLER](#fst_err_hook_invalid_async_handler)
    - [FST_ERR_HOOK_NOT_SUPPORTED](#fst_err_hook_not_supported)
    - [FST_ERR_MISSING_MIDDLEWARE](#fst_err_missing_middleware)
    - [FST_ERR_HOOK_TIMEOUT](#fst_err_hook_timeout)
    - [FST_ERR_LOG_INVALID_DESTINATION](#fst_err_log_invalid_destination)
    - [FST_ERR_LOG_INVALID_LOGGER](#fst_err_log_invalid_logger)
    - [FST_ERR_LOG_INVALID_LOGGER_INSTANCE](#fst_err_log_invalid_logger_instance)
    - [FST_ERR_LOG_INVALID_LOGGER_CONFIG](#fst_err_log_invalid_logger_config)
    - [FST_ERR_LOG_LOGGER_AND_LOGGER_INSTANCE_PROVIDED](#fst_err_log_logger_and_logger_instance_provided)
    - [FST_ERR_REP_INVALID_PAYLOAD_TYPE](#fst_err_rep_invalid_payload_type)
    - [FST_ERR_REP_RESPONSE_BODY_CONSUMED](#fst_err_rep_response_body_consumed)
    - [FST_ERR_REP_READABLE_STREAM_LOCKED](#fst_err_rep_readable_stream_locked)
    - [FST_ERR_REP_ALREADY_SENT](#fst_err_rep_already_sent)
    - [FST_ERR_REP_SENT_VALUE](#fst_err_rep_sent_value)
    - [FST_ERR_SEND_INSIDE_ONERR](#fst_err_send_inside_onerr)
    - [FST_ERR_SEND_UNDEFINED_ERR](#fst_err_send_undefined_err)
    - [FST_ERR_BAD_STATUS_CODE](#fst_err_bad_status_code)
    - [FST_ERR_BAD_TRAILER_NAME](#fst_err_bad_trailer_name)
    - [FST_ERR_BAD_TRAILER_VALUE](#fst_err_bad_trailer_value)
    - [FST_ERR_FAILED_ERROR_SERIALIZATION](#fst_err_failed_error_serialization)
    - [FST_ERR_MISSING_SERIALIZATION_FN](#fst_err_missing_serialization_fn)
    - [FST_ERR_MISSING_CONTENTTYPE_SERIALIZATION_FN](#fst_err_missing_contenttype_serialization_fn)
    - [FST_ERR_REQ_INVALID_VALIDATION_INVOCATION](#fst_err_req_invalid_validation_invocation)
    - [FST_ERR_SCH_MISSING_ID](#fst_err_sch_missing_id)
    - [FST_ERR_SCH_ALREADY_PRESENT](#fst_err_sch_already_present)
    - [FST_ERR_SCH_CONTENT_MISSING_SCHEMA](#fst_err_sch_content_missing_schema)
    - [FST_ERR_SCH_DUPLICATE](#fst_err_sch_duplicate)
    - [FST_ERR_SCH_VALIDATION_BUILD](#fst_err_sch_validation_build)
    - [FST_ERR_SCH_SERIALIZATION_BUILD](#fst_err_sch_serialization_build)
    - [FST_ERR_SCH_RESPONSE_SCHEMA_NOT_NESTED_2XX](#fst_err_sch_response_schema_not_nested_2xx)
    - [FST_ERR_INIT_OPTS_INVALID](#fst_err_init_opts_invalid)
    - [FST_ERR_FORCE_CLOSE_CONNECTIONS_IDLE_NOT_AVAILABLE](#fst_err_force_close_connections_idle_not_available)
    - [FST_ERR_DUPLICATED_ROUTE](#fst_err_duplicated_route)
    - [FST_ERR_BAD_URL](#fst_err_bad_url)
    - [FST_ERR_ASYNC_CONSTRAINT](#fst_err_async_constraint)
    - [FST_ERR_INVALID_URL](#fst_err_invalid_url)
    - [FST_ERR_ROUTE_OPTIONS_NOT_OBJ](#fst_err_route_options_not_obj)
    - [FST_ERR_ROUTE_DUPLICATED_HANDLER](#fst_err_route_duplicated_handler)
    - [FST_ERR_ROUTE_HANDLER_NOT_FN](#fst_err_route_handler_not_fn)
    - [FST_ERR_ROUTE_MISSING_HANDLER](#fst_err_route_missing_handler)
    - [FST_ERR_ROUTE_METHOD_INVALID](#fst_err_route_method_invalid)
    - [FST_ERR_ROUTE_METHOD_NOT_SUPPORTED](#fst_err_route_method_not_supported)
    - [FST_ERR_ROUTE_BODY_VALIDATION_SCHEMA_NOT_SUPPORTED](#fst_err_route_body_validation_schema_not_supported)
    - [FST_ERR_ROUTE_BODY_LIMIT_OPTION_NOT_INT](#fst_err_route_body_limit_option_not_int)
    - [FST_ERR_ROUTE_REWRITE_NOT_STR](#fst_err_route_rewrite_not_str)
    - [FST_ERR_REOPENED_CLOSE_SERVER](#fst_err_reopened_close_server)
    - [FST_ERR_REOPENED_SERVER](#fst_err_reopened_server)
    - [FST_ERR_PLUGIN_VERSION_MISMATCH](#fst_err_plugin_version_mismatch)
    - [FST_ERR_PLUGIN_CALLBACK_NOT_FN](#fst_err_plugin_callback_not_fn)
    - [FST_ERR_PLUGIN_NOT_VALID](#fst_err_plugin_not_valid)
    - [FST_ERR_ROOT_PLG_BOOTED](#fst_err_root_plg_booted)
    - [FST_ERR_PARENT_PLUGIN_BOOTED](#fst_err_parent_plugin_booted)
    - [FST_ERR_PLUGIN_TIMEOUT](#fst_err_plugin_timeout)
    - [FST_ERR_PLUGIN_NOT_PRESENT_IN_INSTANCE](#fst_err_plugin_not_present_in_instance)
    - [FST_ERR_PLUGIN_INVALID_ASYNC_HANDLER](#fst_err_plugin_invalid_async_handler)
    - [FST_ERR_VALIDATION](#fst_err_validation)
    - [FST_ERR_LISTEN_OPTIONS_INVALID](#fst_err_listen_options_invalid)
    - [FST_ERR_ERROR_HANDLER_NOT_FN](#fst_err_error_handler_not_fn)
    - [FST_ERR_ERROR_HANDLER_ALREADY_SET](#fst_err_error_handler_already_set)

### Error Handling In Node.js

<a id="error-handling"></a>

#### Uncaught Errors

In Node.js, uncaught errors can cause memory leaks, file descriptor leaks, and
other major production issues.
[Domains](https://nodejs.org/en/docs/guides/domain-postmortem/) were a failed
attempt to fix this.

Given that it is not possible to process all uncaught errors sensibly, the best
way to deal with them is to
[crash](https://nodejs.org/api/process.html#process_warning_using_uncaughtexception_correctly).

#### Catching Errors In Promises

When using promises, attach a `.catch()` handler synchronously.

### Errors In Fastify

Fastify follows an all-or-nothing approach and aims to be lean and optimal. The
developer is responsible for ensuring errors are handled properly.

#### Errors In Input Data

Most errors result from unexpected input data, so it is recommended to
[validate input data against a JSON schema](./Validation-and-Serialization.md).

#### Catching Uncaught Errors In Fastify

Fastify tries to catch as many uncaught errors as possible without hindering
performance. This includes:

1. synchronous routes, e.g. `app.get('/', () => { throw new Error('kaboom') })`
2. `async` routes, e.g. `app.get('/', async () => { throw new Error('kaboom')
})`

In both cases, the error will be caught safely and routed to Fastify's default
error handler, resulting in a generic `500 Internal Server Error` response.

To customize this behavior, use
[`setErrorHandler`](./Server.md#seterrorhandler).

### Errors In Fastify Lifecycle Hooks And A Custom Error Handler

From the [Hooks documentation](./Hooks.md#manage-errors-from-a-hook):

> If you get an error during the execution of your hook, just pass it to
> `done()` and Fastify will automatically close the request and send the
> appropriate error code to the user.

When a custom error handler is defined through
[`setErrorHandler`](./Server.md#seterrorhandler), it will receive the error
passed to the `done()` callback or through other supported automatic error
handling mechanisms. If `setErrorHandler` is used multiple times, the error will
be routed to the most precedent handler within the error
[encapsulation context](./Encapsulation.md). Error handlers are fully
encapsulated, so a `setErrorHandler` call within a plugin will limit the error
handler to that plugin's context.

The root error handler is Fastify's generic error handler. This error handler
will use the headers and status code in the `Error` object, if they exist. The
headers and status code will not be automatically set if a custom error handler
is provided.

The following should be considered when using a custom error handler:

- `reply.send(data)` behaves as in [regular route handlers](./Reply.md#senddata)

  - objects are serialized, triggering the `preSerialization` lifecycle hook if
    defined
  - strings, buffers, and streams are sent to the client with appropriate headers
    (no serialization)

- Throwing a new error in a custom error handler will call the parent
  `errorHandler`.
  - The `onError` hook will be triggered once for the first error thrown
  - An error will not be triggered twice from a lifecycle hook. Fastify
    internally monitors error invocation to avoid infinite loops for errors
    thrown in the reply phases of the lifecycle (those after the route handler)

When using Fastify's custom error handling through
[`setErrorHandler`](./Server.md#seterrorhandler), be aware of how errors are
propagated between custom and default error handlers.

If a plugin's error handler re-throws an error that is not an instance of
[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error),
it will not propagate to the parent context error handler. Instead, it will be
caught by the default error handler. This can be seen in the `/bad` route of the
example below.

To ensure consistent error handling, throw instances of `Error`. For example,
replace `throw 'foo'` with `throw new Error('foo')` in the `/bad` route to
ensure errors propagate through the custom error handling chain as intended.
This practice helps avoid potential pitfalls when working with custom error
handling in Fastify.

For example:

```js
const Fastify = require('fastify');

// Instantiate the framework
const fastify = Fastify({
  logger: true,
});

// Register parent error handler
fastify.setErrorHandler((error, request, reply) => {
  reply.status(500).send({ ok: false });
});

fastify.register((app, options, next) => {
  // Register child error handler
  fastify.setErrorHandler((error, request, reply) => {
    throw error;
  });

  fastify.get('/bad', async () => {
    // Throws a non-Error type, 'bar'
    throw 'foo';
  });

  fastify.get('/good', async () => {
    // Throws an Error instance, 'bar'
    throw new Error('bar');
  });

  next();
});

// Run the server
fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  // Server is listening at ${address}
});
```

### Fastify Error Codes

<a id="fastify-error-codes"></a>

You can access `errorCodes` for mapping:

```js
// ESM
import { errorCodes } from 'fastify';

// CommonJS
const errorCodes = require('fastify').errorCodes;
```

For example:

```js
const Fastify = require('fastify');

// Instantiate the framework
const fastify = Fastify({
  logger: true,
});

// Declare a route
fastify.get('/', function (request, reply) {
  reply.code('bad status code').send({ hello: 'world' });
});

fastify.setErrorHandler(function (error, request, reply) {
  if (error instanceof Fastify.errorCodes.FST_ERR_BAD_STATUS_CODE) {
    // Log error
    this.log.error(error);
    // Send error response
    reply.status(500).send({ ok: false });
  } else {
    // Fastify will use parent error handler to handle this
    reply.send(error);
  }
});

// Run the server!
fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  // Server is now listening on ${address}
});
```

Below is a table with all the error codes used by Fastify.

| Code                                                                                                              | Description                                                                                                          | How to solve                                                                                                                 | Discussion                                            |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| <a id="fst_err_not_found">FST_ERR_NOT_FOUND</a>                                                                   | 404 Not Found                                                                                                        | -                                                                                                                            | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_options_not_obj">FST_ERR_OPTIONS_NOT_OBJ</a>                                                       | Fastify options wrongly specified.                                                                                   | Fastify options should be an object.                                                                                         | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_qsp_not_fn">FST_ERR_QSP_NOT_FN</a>                                                                 | QueryStringParser wrongly specified.                                                                                 | QueryStringParser option should be a function.                                                                               | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_schema_controller_bucket_opt_not_fn">FST_ERR_SCHEMA_CONTROLLER_BUCKET_OPT_NOT_FN</a>               | SchemaController.bucket wrongly specified.                                                                           | SchemaController.bucket option should be a function.                                                                         | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_schema_error_formatter_not_fn">FST_ERR_SCHEMA_ERROR_FORMATTER_NOT_FN</a>                           | SchemaErrorFormatter option wrongly specified.                                                                       | SchemaErrorFormatter option should be a non async function.                                                                  | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_ajv_custom_options_opt_not_obj">FST_ERR_AJV_CUSTOM_OPTIONS_OPT_NOT_OBJ</a>                         | ajv.customOptions wrongly specified.                                                                                 | ajv.customOptions option should be an object.                                                                                | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_ajv_custom_options_opt_not_arr">FST_ERR_AJV_CUSTOM_OPTIONS_OPT_NOT_ARR</a>                         | ajv.plugins option wrongly specified.                                                                                | ajv.plugins option should be an array.                                                                                       | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_ctp_already_present">FST_ERR_CTP_ALREADY_PRESENT</a>                                               | The parser for this content type was already registered.                                                             | Use a different content type or delete the already registered parser.                                                        | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_ctp_invalid_type">FST_ERR_CTP_INVALID_TYPE</a>                                                     | `Content-Type` wrongly specified                                                                                     | The `Content-Type` should be a string.                                                                                       | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_ctp_empty_type">FST_ERR_CTP_EMPTY_TYPE</a>                                                         | `Content-Type` is an empty string.                                                                                   | `Content-Type` cannot be an empty string.                                                                                    | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_ctp_invalid_handler">FST_ERR_CTP_INVALID_HANDLER</a>                                               | Invalid handler for the content type.                                                                                | Use a different handler.                                                                                                     | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_ctp_invalid_parse_type">FST_ERR_CTP_INVALID_PARSE_TYPE</a>                                         | The provided parse type is not supported.                                                                            | Accepted values are <code>string</code> or <code>buffer</code>.                                                              | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_ctp_body_too_large">FST_ERR_CTP_BODY_TOO_LARGE</a>                                                 | The request body is larger than the provided limit.                                                                  | Increase the limit in the Fastify server instance setting: [bodyLimit](./Server.md#bodylimit)                                | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_ctp_invalid_media_type">FST_ERR_CTP_INVALID_MEDIA_TYPE</a>                                         | The received media type is not supported (i.e. there is no suitable `Content-Type` parser for it).                   | Use a different content type.                                                                                                | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_ctp_invalid_content_length">FST_ERR_CTP_INVALID_CONTENT_LENGTH</a>                                 | Request body size did not match <code>Content-Length</code>.                                                         | Check the request body size and the <code>Content-Length</code> header.                                                      | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_ctp_empty_json_body">FST_ERR_CTP_EMPTY_JSON_BODY</a>                                               | Body cannot be empty when content-type is set to <code>application/json</code>.                                      | Check the request body.                                                                                                      | [#1253](https://github.com/fastify/fastify/pull/1253) |
| <a id="fst_err_ctp_instance_already_started">FST_ERR_CTP_INSTANCE_ALREADY_STARTED</a>                             | Fastify is already started.                                                                                          | -                                                                                                                            | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_instance_already_listening">FST_ERR_INSTANCE_ALREADY_LISTENING</a>                                 | Fastify instance is already listening.                                                                               | -                                                                                                                            | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_dec_already_present">FST_ERR_DEC_ALREADY_PRESENT</a>                                               | A decorator with the same name is already registered.                                                                | Use a different decorator name.                                                                                              | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_dec_dependency_invalid_type">FST_ERR_DEC_DEPENDENCY_INVALID_TYPE</a>                               | The dependencies of decorator must be of type `Array`.                                                               | Use an array for the dependencies.                                                                                           | [#3090](https://github.com/fastify/fastify/pull/3090) |
| <a id="fst_err_dec_missing_dependency">FST_ERR_DEC_MISSING_DEPENDENCY</a>                                         | The decorator cannot be registered due to a missing dependency.                                                      | Register the missing dependency.                                                                                             | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_dec_after_start">FST_ERR_DEC_AFTER_START</a>                                                       | The decorator cannot be added after start.                                                                           | Add the decorator before starting the server.                                                                                | [#2128](https://github.com/fastify/fastify/pull/2128) |
| <a id="fst_err_dec_reference_type">FST_ERR_DEC_REFERENCE_TYPE</a>                                                 | The decorator cannot be a reference type.                                                                            | Define the decorator with a getter/setter interface or an empty decorator with a hook.                                       | [#5462](https://github.com/fastify/fastify/pull/5462) |
| <a id="fst_err_dec_undeclared">FST_ERR_DEC_UNDECLARED</a>                                                         | An attempt was made to access a decorator that has not been declared.                                                | Declare the decorator before using it.                                                                                       | [#](https://github.com/fastify/fastify/pull/)         |
| <a id="fst_err_hook_invalid_type">FST_ERR_HOOK_INVALID_TYPE</a>                                                   | The hook name must be a string.                                                                                      | Use a string for the hook name.                                                                                              | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_hook_invalid_handler">FST_ERR_HOOK_INVALID_HANDLER</a>                                             | The hook callback must be a function.                                                                                | Use a function for the hook callback.                                                                                        | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_hook_invalid_async_handler">FST_ERR_HOOK_INVALID_ASYNC_HANDLER</a>                                 | Async function has too many arguments. Async hooks should not use the `done` argument.                               | Remove the `done` argument from the async hook.                                                                              | [#4367](https://github.com/fastify/fastify/pull/4367) |
| <a id="fst_err_hook_not_supported">FST_ERR_HOOK_NOT_SUPPORTED</a>                                                 | The hook is not supported.                                                                                           | Use a supported hook.                                                                                                        | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_missing_middleware">FST_ERR_MISSING_MIDDLEWARE</a>                                                 | You must register a plugin for handling middlewares, visit [`Middleware`](./Middleware.md) for more info.            | Register a plugin for handling middlewares.                                                                                  | [#2014](https://github.com/fastify/fastify/pull/2014) |
| <a id="fst_err_hook_timeout">FST_ERR_HOOK_TIMEOUT</a>                                                             | A callback for a hook timed out.                                                                                     | Increase the timeout for the hook.                                                                                           | [#3106](https://github.com/fastify/fastify/pull/3106) |
| <a id="fst_err_log_invalid_destination">FST_ERR_LOG_INVALID_DESTINATION</a>                                       | The logger does not accept the specified destination.                                                                | Use a `'stream'` or a `'file'` as the destination.                                                                           | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_log_invalid_logger">FST_ERR_LOG_INVALID_LOGGER</a>                                                 | The logger should have all these methods: `'info'`, `'error'`, `'debug'`, `'fatal'`, `'warn'`, `'trace'`, `'child'`. | Use a logger with all the required methods.                                                                                  | [#4520](https://github.com/fastify/fastify/pull/4520) |
| <a id="fst_err_log_invalid_logger_instance">FST_ERR_LOG_INVALID_LOGGER_INSTANCE</a>                               | The `loggerInstance` only accepts a logger instance, not a configuration object.                                     | To pass a configuration object, use `'logger'` instead.                                                                      | [#5020](https://github.com/fastify/fastify/pull/5020) |
| <a id="fst_err_log_invalid_logger_config">FST_ERR_LOG_INVALID_LOGGER_CONFIG</a>                                   | The logger option only accepts a configuration object, not a logger instance.                                        | To pass an instance, use `'loggerInstance'` instead.                                                                         | [#5020](https://github.com/fastify/fastify/pull/5020) |
| <a id="fst_err_log_logger_and_logger_instance_provided">FST_ERR_LOG_LOGGER_AND_LOGGER_INSTANCE_PROVIDED</a>       | You cannot provide both `'logger'` and `'loggerInstance'`.                                                           | Please provide only one option.                                                                                              | [#5020](https://github.com/fastify/fastify/pull/5020) |
| <a id="fst_err_rep_invalid_payload_type">FST_ERR_REP_INVALID_PAYLOAD_TYPE</a>                                     | Reply payload can be either a `string` or a `Buffer`.                                                                | Use a `string` or a `Buffer` for the payload.                                                                                | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_rep_response_body_consumed">FST_ERR_REP_RESPONSE_BODY_CONSUMED</a>                                 | Using `Response` as reply payload, but the body is being consumed.                                                   | Make sure you don't consume the `Response.body`                                                                              | [#5286](https://github.com/fastify/fastify/pull/5286) |
| <a id="fst_err_rep_readable_stream_locked">FST_ERR_REP_READABLE_STREAM_LOCKED</a>                                 | Using `ReadableStream` as reply payload, but locked with another reader.                                             | Make sure you don't call the `Readable.getReader` before sending or release lock with `reader.releaseLock()` before sending. | [#5920](https://github.com/fastify/fastify/pull/5920) |
| <a id="fst_err_rep_already_sent">FST_ERR_REP_ALREADY_SENT</a>                                                     | A response was already sent.                                                                                         | -                                                                                                                            | [#1336](https://github.com/fastify/fastify/pull/1336) |
| <a id="fst_err_rep_sent_value">FST_ERR_REP_SENT_VALUE</a>                                                         | The only possible value for `reply.sent` is `true`.                                                                  | -                                                                                                                            | [#1336](https://github.com/fastify/fastify/pull/1336) |
| <a id="fst_err_send_inside_onerr">FST_ERR_SEND_INSIDE_ONERR</a>                                                   | You cannot use `send` inside the `onError` hook.                                                                     | -                                                                                                                            | [#1348](https://github.com/fastify/fastify/pull/1348) |
| <a id="fst_err_send_undefined_err">FST_ERR_SEND_UNDEFINED_ERR</a>                                                 | Undefined error has occurred.                                                                                        | -                                                                                                                            | [#2074](https://github.com/fastify/fastify/pull/2074) |
| <a id="fst_err_bad_status_code">FST_ERR_BAD_STATUS_CODE</a>                                                       | The status code is not valid.                                                                                        | Use a valid status code.                                                                                                     | [#2082](https://github.com/fastify/fastify/pull/2082) |
| <a id="fst_err_bad_trailer_name">FST_ERR_BAD_TRAILER_NAME</a>                                                     | Called `reply.trailer` with an invalid header name.                                                                  | Use a valid header name.                                                                                                     | [#3794](https://github.com/fastify/fastify/pull/3794) |
| <a id="fst_err_bad_trailer_value">FST_ERR_BAD_TRAILER_VALUE</a>                                                   | Called `reply.trailer` with an invalid type. Expected a function.                                                    | Use a function.                                                                                                              | [#3794](https://github.com/fastify/fastify/pull/3794) |
| <a id="fst_err_failed_error_serialization">FST_ERR_FAILED_ERROR_SERIALIZATION</a>                                 | Failed to serialize an error.                                                                                        | -                                                                                                                            | [#4601](https://github.com/fastify/fastify/pull/4601) |
| <a id="fst_err_missing_serialization_fn">FST_ERR_MISSING_SERIALIZATION_FN</a>                                     | Missing serialization function.                                                                                      | Add a serialization function.                                                                                                | [#3970](https://github.com/fastify/fastify/pull/3970) |
| <a id="fst_err_missing_contenttype_serialization_fn">FST_ERR_MISSING_CONTENTTYPE_SERIALIZATION_FN</a>             | Missing `Content-Type` serialization function.                                                                       | Add a serialization function.                                                                                                | [#4264](https://github.com/fastify/fastify/pull/4264) |
| <a id="fst_err_req_invalid_validation_invocation">FST_ERR_REQ_INVALID_VALIDATION_INVOCATION</a>                   | Invalid validation invocation. Missing validation function for HTTP part nor schema provided.                        | Add a validation function.                                                                                                   | [#3970](https://github.com/fastify/fastify/pull/3970) |
| <a id="fst_err_sch_missing_id">FST_ERR_SCH_MISSING_ID</a>                                                         | The schema provided does not have `$id` property.                                                                    | Add a `$id` property.                                                                                                        | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_sch_already_present">FST_ERR_SCH_ALREADY_PRESENT</a>                                               | A schema with the same `$id` already exists.                                                                         | Use a different `$id`.                                                                                                       | [#1168](https://github.com/fastify/fastify/pull/1168) |
| <a id="fst_err_sch_content_missing_schema">FST_ERR_SCH_CONTENT_MISSING_SCHEMA</a>                                 | A schema is missing for the corresponding content type.                                                              | Add a schema.                                                                                                                | [#4264](https://github.com/fastify/fastify/pull/4264) |
| <a id="fst_err_sch_duplicate">FST_ERR_SCH_DUPLICATE</a>                                                           | Schema with the same attribute already present!                                                                      | Use a different attribute.                                                                                                   | [#1954](https://github.com/fastify/fastify/pull/1954) |
| <a id="fst_err_sch_validation_build">FST_ERR_SCH_VALIDATION_BUILD</a>                                             | The JSON schema provided for validation to a route is not valid.                                                     | Fix the JSON schema.                                                                                                         | [#2023](https://github.com/fastify/fastify/pull/2023) |
| <a id="fst_err_sch_serialization_build">FST_ERR_SCH_SERIALIZATION_BUILD</a>                                       | The JSON schema provided for serialization of a route response is not valid.                                         | Fix the JSON schema.                                                                                                         | [#2023](https://github.com/fastify/fastify/pull/2023) |
| <a id="fst_err_sch_response_schema_not_nested_2xx">FST_ERR_SCH_RESPONSE_SCHEMA_NOT_NESTED_2XX</a>                 | Response schemas should be nested under a valid status code (2XX).                                                   | Use a valid status code.                                                                                                     | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_init_opts_invalid">FST_ERR_INIT_OPTS_INVALID</a>                                                   | Invalid initialization options.                                                                                      | Use valid initialization options.                                                                                            | [#1471](https://github.com/fastify/fastify/pull/1471) |
| <a id="fst_err_force_close_connections_idle_not_available">FST_ERR_FORCE_CLOSE_CONNECTIONS_IDLE_NOT_AVAILABLE</a> | Cannot set forceCloseConnections to `idle` as your HTTP server does not support `closeIdleConnections` method.       | Use a different value for `forceCloseConnections`.                                                                           | [#3925](https://github.com/fastify/fastify/pull/3925) |
| <a id="fst_err_duplicated_route">FST_ERR_DUPLICATED_ROUTE</a>                                                     | The HTTP method already has a registered controller for that URL.                                                    | Use a different URL or register the controller for another HTTP method.                                                      | [#2954](https://github.com/fastify/fastify/pull/2954) |
| <a id="fst_err_bad_url">FST_ERR_BAD_URL</a>                                                                       | The router received an invalid URL.                                                                                  | Use a valid URL.                                                                                                             | [#2106](https://github.com/fastify/fastify/pull/2106) |
| <a id="fst_err_async_constraint">FST_ERR_ASYNC_CONSTRAINT</a>                                                     | The router received an error when using asynchronous constraints.                                                    | -                                                                                                                            | [#4323](https://github.com/fastify/fastify/pull/4323) |
| <a id="fst_err_invalid_url">FST_ERR_INVALID_URL</a>                                                               | URL must be a string.                                                                                                | Use a string for the URL.                                                                                                    | [#3653](https://github.com/fastify/fastify/pull/3653) |
| <a id="fst_err_route_options_not_obj">FST_ERR_ROUTE_OPTIONS_NOT_OBJ</a>                                           | Options for the route must be an object.                                                                             | Use an object for the route options.                                                                                         | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_route_duplicated_handler">FST_ERR_ROUTE_DUPLICATED_HANDLER</a>                                     | Duplicate handler for the route is not allowed.                                                                      | Use a different handler.                                                                                                     | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_route_handler_not_fn">FST_ERR_ROUTE_HANDLER_NOT_FN</a>                                             | Handler for the route must be a function.                                                                            | Use a function for the handler.                                                                                              | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_route_missing_handler">FST_ERR_ROUTE_MISSING_HANDLER</a>                                           | Missing handler function for the route.                                                                              | Add a handler function.                                                                                                      | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_route_method_invalid">FST_ERR_ROUTE_METHOD_INVALID</a>                                             | Method is not a valid value.                                                                                         | Use a valid value for the method.                                                                                            | [#4750](https://github.com/fastify/fastify/pull/4750) |
| <a id="fst_err_route_method_not_supported">FST_ERR_ROUTE_METHOD_NOT_SUPPORTED</a>                                 | Method is not supported for the route.                                                                               | Use a supported method.                                                                                                      | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_route_body_validation_schema_not_supported">FST_ERR_ROUTE_BODY_VALIDATION_SCHEMA_NOT_SUPPORTED</a> | Body validation schema route is not supported.                                                                       | Use a different different method for the route.                                                                              | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_route_body_limit_option_not_int">FST_ERR_ROUTE_BODY_LIMIT_OPTION_NOT_INT</a>                       | `bodyLimit` option must be an integer.                                                                               | Use an integer for the `bodyLimit` option.                                                                                   | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_route_rewrite_not_str">FST_ERR_ROUTE_REWRITE_NOT_STR</a>                                           | `rewriteUrl` needs to be of type `string`.                                                                           | Use a string for the `rewriteUrl`.                                                                                           | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_reopened_close_server">FST_ERR_REOPENED_CLOSE_SERVER</a>                                           | Fastify has already been closed and cannot be reopened.                                                              | -                                                                                                                            | [#2415](https://github.com/fastify/fastify/pull/2415) |
| <a id="fst_err_reopened_server">FST_ERR_REOPENED_SERVER</a>                                                       | Fastify is already listening.                                                                                        | -                                                                                                                            | [#2415](https://github.com/fastify/fastify/pull/2415) |
| <a id="fst_err_plugin_version_mismatch">FST_ERR_PLUGIN_VERSION_MISMATCH</a>                                       | Installed Fastify plugin mismatched expected version.                                                                | Use a compatible version of the plugin.                                                                                      | [#2549](https://github.com/fastify/fastify/pull/2549) |
| <a id="fst_err_plugin_callback_not_fn">FST_ERR_PLUGIN_CALLBACK_NOT_FN</a>                                         | Callback for a hook is not a function.                                                                               | Use a function for the callback.                                                                                             | [#3106](https://github.com/fastify/fastify/pull/3106) |
| <a id="fst_err_plugin_not_valid">FST_ERR_PLUGIN_NOT_VALID</a>                                                     | Plugin must be a function or a promise.                                                                              | Use a function or a promise for the plugin.                                                                                  | [#3106](https://github.com/fastify/fastify/pull/3106) |
| <a id="fst_err_root_plg_booted">FST_ERR_ROOT_PLG_BOOTED</a>                                                       | Root plugin has already booted.                                                                                      | -                                                                                                                            | [#3106](https://github.com/fastify/fastify/pull/3106) |
| <a id="fst_err_parent_plugin_booted">FST_ERR_PARENT_PLUGIN_BOOTED</a>                                             | Impossible to load plugin because the parent (mapped directly from `avvio`)                                          | -                                                                                                                            | [#3106](https://github.com/fastify/fastify/pull/3106) |
| <a id="fst_err_plugin_timeout">FST_ERR_PLUGIN_TIMEOUT</a>                                                         | Plugin did not start in time.                                                                                        | Increase the timeout for the plugin.                                                                                         | [#3106](https://github.com/fastify/fastify/pull/3106) |
| <a id="fst_err_plugin_not_present_in_instance">FST_ERR_PLUGIN_NOT_PRESENT_IN_INSTANCE</a>                         | The decorator is not present in the instance.                                                                        | -                                                                                                                            | [#4554](https://github.com/fastify/fastify/pull/4554) |
| <a id="fst_err_plugin_invalid_async_handler">FST_ERR_PLUGIN_INVALID_ASYNC_HANDLER</a>                             | The plugin being registered mixes async and callback styles.                                                         | -                                                                                                                            | [#5141](https://github.com/fastify/fastify/pull/5141) |
| <a id="fst_err_validation">FST_ERR_VALIDATION</a>                                                                 | The Request failed the payload validation.                                                                           | Check the request payload.                                                                                                   | [#4824](https://github.com/fastify/fastify/pull/4824) |
| <a id="fst_err_listen_options_invalid">FST_ERR_LISTEN_OPTIONS_INVALID</a>                                         | Invalid listen options.                                                                                              | Check the listen options.                                                                                                    | [#4886](https://github.com/fastify/fastify/pull/4886) |
| <a id="fst_err_error_handler_not_fn">FST_ERR_ERROR_HANDLER_NOT_FN</a>                                             | Error Handler must be a function                                                                                     | Provide a function to `setErrorHandler`.                                                                                     | [#5317](https://github.com/fastify/fastify/pull/5317) | <a id="fst_err_error_handler_already_set">FST_ERR_ERROR_HANDLER_ALREADY_SET</a> | Error Handler already set in this scope. Set `allowErrorHandlerOverride: true` to allow overriding. | By default, `setErrorHandler` can only be called once per encapsulation context. | [#6097](https://github.com/fastify/fastify/pull/6098) |

## HTTP2

_Fastify_ supports HTTP2 over HTTPS (h2) or plaintext (h2c).

Currently, none of the HTTP2-specific APIs are available through _Fastify_, but
Node's `req` and `res` can be accessed through the `Request` and `Reply`
interfaces. PRs are welcome.

### Secure (HTTPS)

HTTP2 is supported in all modern browsers **only over a secure connection**:

```js
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const fastify = require('fastify')({
  http2: true,
  https: {
    key: fs.readFileSync(path.join(__dirname, '..', 'https', 'fastify.key')),
    cert: fs.readFileSync(path.join(__dirname, '..', 'https', 'fastify.cert')),
  },
});

fastify.get('/', function (request, reply) {
  reply.code(200).send({ hello: 'world' });
});

fastify.listen({ port: 3000 });
```

[ALPN negotiation](https://datatracker.ietf.org/doc/html/rfc7301) allows
support for both HTTPS and HTTP/2 over the same socket.
Node core `req` and `res` objects can be either
[HTTP/1](https://nodejs.org/api/http.html) or
[HTTP/2](https://nodejs.org/api/http2.html). _Fastify_ supports this out of the
box:

```js
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const fastify = require('fastify')({
  http2: true,
  https: {
    allowHTTP1: true, // fallback support for HTTP1
    key: fs.readFileSync(path.join(__dirname, '..', 'https', 'fastify.key')),
    cert: fs.readFileSync(path.join(__dirname, '..', 'https', 'fastify.cert')),
  },
});

// this route can be accessed through both protocols
fastify.get('/', function (request, reply) {
  reply.code(200).send({ hello: 'world' });
});

fastify.listen({ port: 3000 });
```

Test the new server with:

```
$ npx h2url https://localhost:3000
```

### Plain or insecure

For microservices, HTTP2 can connect in plain text, but this is not
supported by browsers.

```js
'use strict';

const fastify = require('fastify')({
  http2: true,
});

fastify.get('/', function (request, reply) {
  reply.code(200).send({ hello: 'world' });
});

fastify.listen({ port: 3000 });
```

Test the new server with:

```
$ npx h2url http://localhost:3000
```

## Hooks

Hooks are registered with the `fastify.addHook` method and allow you to listen
to specific events in the application or request/response lifecycle. You have to
register a hook before the event is triggered, otherwise, the event is lost.

By using hooks you can interact directly with the lifecycle of Fastify. There
are Request/Reply hooks and application hooks:

- [Request/Reply Hooks](#requestreply-hooks)
  - [onRequest](#onrequest)
  - [preParsing](#preparsing)
  - [preValidation](#prevalidation)
  - [preHandler](#prehandler)
  - [preSerialization](#preserialization)
  - [onError](#onerror)
  - [onSend](#onsend)
  - [onResponse](#onresponse)
  - [onTimeout](#ontimeout)
  - [onRequestAbort](#onrequestabort)
  - [Manage Errors from a hook](#manage-errors-from-a-hook)
  - [Respond to a request from a hook](#respond-to-a-request-from-a-hook)
- [Application Hooks](#application-hooks)
  - [onReady](#onready)
  - [onListen](#onlisten)
  - [onClose](#onclose)
  - [preClose](#preclose)
  - [onRoute](#onroute)
  - [onRegister](#onregister)
- [Scope](#scope)
- [Route level hooks](#route-level-hooks)
- [Using Hooks to Inject Custom Properties](#using-hooks-to-inject-custom-properties)
- [Diagnostics Channel Hooks](#diagnostics-channel-hooks)

> ℹ️ Note: The `done` callback is not available when using `async`/`await` or
> returning a `Promise`. If you do invoke a `done` callback in this situation
> unexpected behavior may occur, e.g. duplicate invocation of handlers.

## Request/Reply Hooks

[Request](./Request.md) and [Reply](./Reply.md) are the core Fastify objects.

`done` is the function to continue with the [lifecycle](./Lifecycle.md).

It is easy to understand where each hook is executed by looking at the
[lifecycle page](./Lifecycle.md).

Hooks are affected by Fastify's encapsulation, and can thus be applied to
selected routes. See the [Scopes](#scope) section for more information.

There are eight different hooks that you can use in Request/Reply _(in order of
execution)_:

### onRequest

```js
fastify.addHook('onRequest', (request, reply, done) => {
  // Some code
  done();
});
```

Or `async/await`:

```js
fastify.addHook('onRequest', async (request, reply) => {
  // Some code
  await asyncMethod();
});
```

> ℹ️ Note: In the [onRequest](#onrequest) hook, `request.body` will always be
> `undefined`, because the body parsing happens before the
> [preValidation](#prevalidation) hook.

### preParsing

If you are using the `preParsing` hook, you can transform the request payload
stream before it is parsed. It receives the request and reply objects as other
hooks, and a stream with the current request payload.

If it returns a value (via `return` or via the callback function), it must
return a stream.

For instance, you can decompress the request body:

```js
fastify.addHook('preParsing', (request, reply, payload, done) => {
  // Some code
  done(null, newPayload);
});
```

Or `async/await`:

```js
fastify.addHook('preParsing', async (request, reply, payload) => {
  // Some code
  await asyncMethod();
  return newPayload;
});
```

> ℹ️ Note: In the [preParsing](#preparsing) hook, `request.body` will always be
> `undefined`, because the body parsing happens before the
> [preValidation](#prevalidation) hook.

> ℹ️ Note: You should also add a `receivedEncodedLength` property to the
> returned stream. This property is used to correctly match the request payload
> with the `Content-Length` header value. Ideally, this property should be updated
> on each received chunk.

> ℹ️ Note: The size of the returned stream is checked to not exceed the limit
> set in [`bodyLimit`](./Server.md#bodylimit) option.

### preValidation

If you are using the `preValidation` hook, you can change the payload before it
is validated. For example:

```js
fastify.addHook('preValidation', (request, reply, done) => {
  request.body = { ...request.body, importantKey: 'randomString' };
  done();
});
```

Or `async/await`:

```js
fastify.addHook('preValidation', async (request, reply) => {
  const importantKey = await generateRandomString();
  request.body = { ...request.body, importantKey };
});
```

### preHandler

The `preHandler` hook allows you to specify a function that is executed before
a routes's handler.

```js
fastify.addHook('preHandler', (request, reply, done) => {
  // some code
  done();
});
```

Or `async/await`:

```js
fastify.addHook('preHandler', async (request, reply) => {
  // Some code
  await asyncMethod();
});
```

### preSerialization

If you are using the `preSerialization` hook, you can change (or replace) the
payload before it is serialized. For example:

```js
fastify.addHook('preSerialization', (request, reply, payload, done) => {
  const err = null;
  const newPayload = { wrapped: payload };
  done(err, newPayload);
});
```

Or `async/await`:

```js
fastify.addHook('preSerialization', async (request, reply, payload) => {
  return { wrapped: payload };
});
```

> ℹ️ Note: The hook is NOT called if the payload is a `string`, a `Buffer`, a
> `stream`, or `null`.

### onError

```js
fastify.addHook('onError', (request, reply, error, done) => {
  // Some code
  done();
});
```

Or `async/await`:

```js
fastify.addHook('onError', async (request, reply, error) => {
  // Useful for custom error logging
  // You should not use this hook to update the error
});
```

This hook is useful if you need to do some custom error logging or add some
specific header in case of error.

It is not intended for changing the error, and calling `reply.send` will throw
an exception.

This hook will be executed before
the [Custom Error Handler set by `setErrorHandler`](./Server.md#seterrorhandler).

> ℹ️ Note: Unlike the other hooks, passing an error to the `done` function is not
> supported.

### onSend

If you are using the `onSend` hook, you can change the payload. For example:

```js
fastify.addHook('onSend', (request, reply, payload, done) => {
  const err = null;
  const newPayload = payload.replace('some-text', 'some-new-text');
  done(err, newPayload);
});
```

Or `async/await`:

```js
fastify.addHook('onSend', async (request, reply, payload) => {
  const newPayload = payload.replace('some-text', 'some-new-text');
  return newPayload;
});
```

You can also clear the payload to send a response with an empty body by
replacing the payload with `null`:

```js
fastify.addHook('onSend', (request, reply, payload, done) => {
  reply.code(304);
  const newPayload = null;
  done(null, newPayload);
});
```

> You can also send an empty body by replacing the payload with the empty string
> `''`, but be aware that this will cause the `Content-Length` header to be set
> to `0`, whereas the `Content-Length` header will not be set if the payload is
> `null`.

> ℹ️ Note: If you change the payload, you may only change it to a `string`, a
> `Buffer`, a `stream`, a `ReadableStream`, a `Response`, or `null`.

### onResponse

```js
fastify.addHook('onResponse', (request, reply, done) => {
  // Some code
  done();
});
```

Or `async/await`:

```js
fastify.addHook('onResponse', async (request, reply) => {
  // Some code
  await asyncMethod();
});
```

The `onResponse` hook is executed when a response has been sent, so you will not
be able to send more data to the client. It can however be useful for sending
data to external services, for example, to gather statistics.

> ℹ️ Note: Setting `disableRequestLogging` to `true` will disable any error log
> inside the `onResponse` hook. In this case use `try - catch` to log errors.

### onTimeout

```js
fastify.addHook('onTimeout', (request, reply, done) => {
  // Some code
  done();
});
```

Or `async/await`:

```js
fastify.addHook('onTimeout', async (request, reply) => {
  // Some code
  await asyncMethod();
});
```

`onTimeout` is useful if you need to monitor the request timed out in your
service (if the `connectionTimeout` property is set on the Fastify instance).
The `onTimeout` hook is executed when a request is timed out and the HTTP socket
has been hung up. Therefore, you will not be able to send data to the client.

### onRequestAbort

```js
fastify.addHook('onRequestAbort', (request, done) => {
  // Some code
  done();
});
```

Or `async/await`:

```js
fastify.addHook('onRequestAbort', async (request) => {
  // Some code
  await asyncMethod();
});
```

The `onRequestAbort` hook is executed when a client closes the connection before
the entire request has been processed. Therefore, you will not be able to send
data to the client.

> ℹ️ Note: Client abort detection is not completely reliable.
> See: [`Detecting-When-Clients-Abort.md`](../Guides/Detecting-When-Clients-Abort.md)

### Manage Errors from a hook

If you get an error during the execution of your hook, just pass it to `done()`
and Fastify will automatically close the request and send the appropriate error
code to the user.

```js
fastify.addHook('onRequest', (request, reply, done) => {
  done(new Error('Some error'));
});
```

If you want to pass a custom error code to the user, just use `reply.code()`:

```js
fastify.addHook('preHandler', (request, reply, done) => {
  reply.code(400);
  done(new Error('Some error'));
});
```

_The error will be handled by [`Reply`](./Reply.md#errors)._

Or if you're using `async/await` you can just throw an error:

```js
fastify.addHook('onRequest', async (request, reply) => {
  throw new Error('Some error');
});
```

### Respond to a request from a hook

If needed, you can respond to a request before you reach the route handler, for
example when implementing an authentication hook. Replying from a hook implies
that the hook chain is **stopped** and the rest of the hooks and handlers are
not executed. If the hook is using the callback approach, i.e. it is not an
`async` function or it returns a `Promise`, it is as simple as calling
`reply.send()` and avoiding calling the callback. If the hook is `async`,
`reply.send()` **must** be called _before_ the function returns or the promise
resolves, otherwise, the request will proceed. When `reply.send()` is called
outside of the promise chain, it is important to `return reply` otherwise the
request will be executed twice.

It is important to **not mix callbacks and `async`/`Promise`**, otherwise the
hook chain will be executed twice.

If you are using `onRequest` or `preHandler` use `reply.send`.

```js
fastify.addHook('onRequest', (request, reply, done) => {
  reply.send('Early response');
});

// Works with async functions too
fastify.addHook('preHandler', async (request, reply) => {
  setTimeout(() => {
    reply.send({ hello: 'from prehandler' });
  });
  return reply; // mandatory, so the request is not executed further
  // Commenting the line above will allow the hooks to continue and fail with FST_ERR_REP_ALREADY_SENT
});
```

If you want to respond with a stream, you should avoid using an `async` function
for the hook. If you must use an `async` function, your code will need to follow
the pattern in
[test/hooks-async.js](https://github.com/fastify/fastify/blob/94ea67ef2d8dce8a955d510cd9081aabd036fa85/test/hooks-async.js#L269-L275).

```js
fastify.addHook('onRequest', (request, reply, done) => {
  const stream = fs.createReadStream('some-file', 'utf8');
  reply.send(stream);
});
```

If you are sending a response without `await` on it, make sure to always `return
reply`:

```js
fastify.addHook('preHandler', async (request, reply) => {
  setImmediate(() => {
    reply.send('hello');
  });

  // This is needed to signal the handler to wait for a response
  // to be sent outside of the promise chain
  return reply;
});

fastify.addHook('preHandler', async (request, reply) => {
  // the @fastify/static plugin will send a file asynchronously,
  // so we should return reply
  reply.sendFile('myfile');
  return reply;
});
```

## Application Hooks

You can hook into the application-lifecycle as well.

- [onReady](#onready)
- [onListen](#onlisten)
- [onClose](#onclose)
- [preClose](#preclose)
- [onRoute](#onroute)
- [onRegister](#onregister)

### onReady

Triggered before the server starts listening for requests and when `.ready()` is
invoked. It cannot change the routes or add new hooks. Registered hook functions
are executed serially. Only after all `onReady` hook functions have completed
will the server start listening for requests. Hook functions accept one
argument: a callback, `done`, to be invoked after the hook function is complete.
Hook functions are invoked with `this` bound to the associated Fastify instance.

```js
// callback style
fastify.addHook('onReady', function (done) {
  // Some code
  const err = null;
  done(err);
});

// or async/await style
fastify.addHook('onReady', async function () {
  // Some async code
  await loadCacheFromDatabase();
});
```

### onListen

Triggered when the server starts listening for requests. The hooks run one
after another. If a hook function causes an error, it is logged and
ignored, allowing the queue of hooks to continue. Hook functions accept one
argument: a callback, `done`, to be invoked after the hook function is
complete. Hook functions are invoked with `this` bound to the associated
Fastify instance.

This is an alternative to `fastify.server.on('listening', () => {})`.

```js
// callback style
fastify.addHook('onListen', function (done) {
  // Some code
  const err = null;
  done(err);
});

// or async/await style
fastify.addHook('onListen', async function () {
  // Some async code
});
```

> ℹ️ Note: This hook will not run when the server is started using
> fastify.inject()`or`fastify.ready()`.

### onClose

<a id="on-close"></a>

Triggered when `fastify.close()` is invoked to stop the server, after all in-flight
HTTP requests have been completed.
It is useful when [plugins](./Plugins.md) need a "shutdown" event, for example,
to close an open connection to a database.

The hook function takes the Fastify instance as a first argument,
and a `done` callback for synchronous hook functions.

```js
// callback style
fastify.addHook('onClose', (instance, done) => {
  // Some code
  done();
});

// or async/await style
fastify.addHook('onClose', async (instance) => {
  // Some async code
  await closeDatabaseConnections();
});
```

### preClose

<a id="pre-close"></a>

Triggered when `fastify.close()` is invoked to stop the server, before all in-flight
HTTP requests have been completed.
It is useful when [plugins](./Plugins.md) have set up some state attached
to the HTTP server that would prevent the server to close.
_It is unlikely you will need to use this hook_,
use the [`onClose`](#onclose) for the most common case.

```js
// callback style
fastify.addHook('preClose', (done) => {
  // Some code
  done();
});

// or async/await style
fastify.addHook('preClose', async () => {
  // Some async code
  await removeSomeServerState();
});
```

### onRoute

<a id="on-route"></a>

Triggered when a new route is registered. Listeners are passed a [`routeOptions`](./Routes.md#routes-options)
object as the sole parameter. The interface is synchronous, and, as such, the
listeners are not passed a callback. This hook is encapsulated.

```js
fastify.addHook('onRoute', (routeOptions) => {
  //Some code
  routeOptions.method;
  routeOptions.schema;
  routeOptions.url; // the complete URL of the route, it will include the prefix if any
  routeOptions.path; // `url` alias
  routeOptions.routePath; // the URL of the route without the prefix
  routeOptions.bodyLimit;
  routeOptions.logLevel;
  routeOptions.logSerializers;
  routeOptions.prefix;
});
```

If you are authoring a plugin and you need to customize application routes, like
modifying the options or adding new route hooks, this is the right place.

```js
fastify.addHook('onRoute', (routeOptions) => {
  function onPreSerialization(request, reply, payload, done) {
    // Your code
    done(null, payload);
  }
  // preSerialization can be an array or undefined
  routeOptions.preSerialization = [
    ...(routeOptions.preSerialization || []),
    onPreSerialization,
  ];
});
```

To add more routes within an onRoute hook, the routes must
be tagged correctly. The hook will run into an infinite loop if
not tagged. The recommended approach is shown below.

```js
const kRouteAlreadyProcessed = Symbol('route-already-processed');

fastify.addHook('onRoute', function (routeOptions) {
  const { url, method } = routeOptions;

  const isAlreadyProcessed =
    (routeOptions.custom && routeOptions.custom[kRouteAlreadyProcessed]) ||
    false;

  if (!isAlreadyProcessed) {
    this.route({
      url,
      method,
      custom: {
        [kRouteAlreadyProcessed]: true,
      },
      handler: () => {},
    });
  }
});
```

For more details, see this [issue](https://github.com/fastify/fastify/issues/4319).

### onRegister

<a id="on-register"></a>

Triggered when a new plugin is registered and a new encapsulation context is
created. The hook will be executed **before** the registered code.

This hook can be useful if you are developing a plugin that needs to know when a
plugin context is formed, and you want to operate in that specific context, thus
this hook is encapsulated.

> ℹ️ Note: This hook will not be called if a plugin is wrapped inside
> [`fastify-plugin`](https://github.com/fastify/fastify-plugin).

```js
fastify.decorate('data', []);

fastify.register(
  async (instance, opts) => {
    instance.data.push('hello');
    console.log(instance.data); // ['hello']

    instance.register(
      async (instance, opts) => {
        instance.data.push('world');
        console.log(instance.data); // ['hello', 'world']
      },
      { prefix: '/hola' }
    );
  },
  { prefix: '/ciao' }
);

fastify.register(
  async (instance, opts) => {
    console.log(instance.data); // []
  },
  { prefix: '/hello' }
);

fastify.addHook('onRegister', (instance, opts) => {
  // Create a new array from the old one
  // but without keeping the reference
  // allowing the user to have encapsulated
  // instances of the `data` property
  instance.data = instance.data.slice();

  // the options of the new registered instance
  console.log(opts.prefix);
});
```

## Scope

<a id="scope"></a>

Except for [onClose](#onclose), all hooks are encapsulated. This means that you
can decide where your hooks should run by using `register` as explained in the
[plugins guide](../Guides/Plugins-Guide.md). If you pass a function, that
function is bound to the right Fastify context and from there you have full
access to the Fastify API.

```js
fastify.addHook('onRequest', function (request, reply, done) {
  const self = this; // Fastify context
  done();
});
```

Note that the Fastify context in each hook is the same as the plugin where the
route was registered, for example:

```js
fastify.addHook('onRequest', async function (req, reply) {
  if (req.raw.url === '/nested') {
    assert.strictEqual(this.foo, 'bar');
  } else {
    assert.strictEqual(this.foo, undefined);
  }
});

fastify.get('/', async function (req, reply) {
  assert.strictEqual(this.foo, undefined);
  return { hello: 'world' };
});

fastify.register(async function plugin(fastify, opts) {
  fastify.decorate('foo', 'bar');

  fastify.get('/nested', async function (req, reply) {
    assert.strictEqual(this.foo, 'bar');
    return { hello: 'world' };
  });
});
```

Warn: if you declare the function with an [arrow
function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions),
the `this` will not be Fastify, but the one of the current scope.

## Route level hooks

<a id="route-hooks"></a>

You can declare one or more custom lifecycle hooks ([onRequest](#onrequest),
[onResponse](#onresponse), [preParsing](#preparsing),
[preValidation](#prevalidation), [preHandler](#prehandler),
[preSerialization](#preserialization), [onSend](#onsend),
[onTimeout](#ontimeout), and [onError](#onerror)) hook(s) that will be
**unique** for the route. If you do so, those hooks are always executed as the
last hook in their category.

This can be useful if you need to implement authentication, where the
[preParsing](#preparsing) or [preValidation](#prevalidation) hooks are exactly
what you need. Multiple route-level hooks can also be specified as an array.

```js
fastify.addHook('onRequest', (request, reply, done) => {
  // Your code
  done()
})

fastify.addHook('onResponse', (request, reply, done) => {
  // your code
  done()
})

fastify.addHook('preParsing', (request, reply, done) => {
  // Your code
  done()
})

fastify.addHook('preValidation', (request, reply, done) => {
  // Your code
  done()
})

fastify.addHook('preHandler', (request, reply, done) => {
  // Your code
  done()
})

fastify.addHook('preSerialization', (request, reply, payload, done) => {
  // Your code
  done(null, payload)
})

fastify.addHook('onSend', (request, reply, payload, done) => {
  // Your code
  done(null, payload)
})

fastify.addHook('onTimeout', (request, reply, done) => {
  // Your code
  done()
})

fastify.addHook('onError', (request, reply, error, done) => {
  // Your code
  done()
})

fastify.route({
  method: 'GET',
  url: '/',
  schema: { ... },
  onRequest: function (request, reply, done) {
    // This hook will always be executed after the shared `onRequest` hooks
    done()
  },
  // // Example with an async hook. All hooks support this syntax
  //
  // onRequest: async function (request, reply) {
  //  // This hook will always be executed after the shared `onRequest` hooks
  //  await ...
  // }
  onResponse: function (request, reply, done) {
    // this hook will always be executed after the shared `onResponse` hooks
    done()
  },
  preParsing: function (request, reply, done) {
    // This hook will always be executed after the shared `preParsing` hooks
    done()
  },
  preValidation: function (request, reply, done) {
    // This hook will always be executed after the shared `preValidation` hooks
    done()
  },
  preHandler: function (request, reply, done) {
    // This hook will always be executed after the shared `preHandler` hooks
    done()
  },
  // // Example with an array. All hooks support this syntax.
  //
  // preHandler: [function (request, reply, done) {
  //   // This hook will always be executed after the shared `preHandler` hooks
  //   done()
  // }],
  preSerialization: (request, reply, payload, done) => {
    // This hook will always be executed after the shared `preSerialization` hooks
    done(null, payload)
  },
  onSend: (request, reply, payload, done) => {
    // This hook will always be executed after the shared `onSend` hooks
    done(null, payload)
  },
  onTimeout: (request, reply, done) => {
    // This hook will always be executed after the shared `onTimeout` hooks
    done()
  },
  onError: (request, reply, error, done) => {
    // This hook will always be executed after the shared `onError` hooks
    done()
  },
  handler: function (request, reply) {
    reply.send({ hello: 'world' })
  }
})
```

> ℹ️ Note: Both options also accept an array of functions.

## Using Hooks to Inject Custom Properties

<a id="using-hooks-to-inject-custom-properties"></a>

You can use a hook to inject custom properties into incoming requests.
This is useful for reusing processed data from hooks in controllers.

A very common use case is, for example, checking user authentication based
on their token and then storing their recovered data into
the [Request](./Request.md) instance. This way, your controllers can read it
easily with `request.authenticatedUser` or whatever you want to call it.
That's how it might look like:

```js
fastify.addHook('preParsing', async (request) => {
  request.authenticatedUser = {
    id: 42,
    name: 'Jane Doe',
    role: 'admin',
  };
});

fastify.get('/me/is-admin', async function (req, reply) {
  return { isAdmin: req.authenticatedUser?.role === 'admin' || false };
});
```

Note that `.authenticatedUser` could actually be any property name
chosen by yourself. Using your own custom property prevents you
from mutating existing properties, which
would be a dangerous and destructive operation. So be careful and
make sure your property is entirely new, also using this approach
only for very specific and small cases like this example.

Regarding TypeScript in this example, you'd need to update the
`FastifyRequest` core interface to include your new property typing
(for more about it, see [TypeScript](./TypeScript.md) page), like:

```ts
interface AuthenticatedUser {
  /* ... */
}

declare module 'fastify' {
  export interface FastifyRequest {
    authenticatedUser?: AuthenticatedUser;
  }
}
```

Although this is a very pragmatic approach, if you're trying to do
something more complex that changes these core objects, then
consider creating a custom [Plugin](./Plugins.md) instead.

## Diagnostics Channel Hooks

One [`diagnostics_channel`](https://nodejs.org/api/diagnostics_channel.html)
publish event, `'fastify.initialization'`, happens at initialization time. The
Fastify instance is passed into the hook as a property of the object passed in.
At this point, the instance can be interacted with to add hooks, plugins,
routes, or any other sort of modification.

For example, a tracing package might do something like the following (which is,
of course, a simplification). This would be in a file loaded in the
initialization of the tracking package, in the typical "require instrumentation
tools first" fashion.

```js
const tracer = /* retrieved from elsewhere in the package */
const dc = require('node:diagnostics_channel')
const channel = dc.channel('fastify.initialization')
const spans = new WeakMap()

channel.subscribe(function ({ fastify }) {
  fastify.addHook('onRequest', (request, reply, done) => {
    const span = tracer.startSpan('fastify.request.handler')
    spans.set(request, span)
    done()
  })

  fastify.addHook('onResponse', (request, reply, done) => {
    const span = spans.get(request)
    span.finish()
    done()
  })
})
```

> ℹ️ Note: The TracingChannel class API is currently experimental and may undergo
> breaking changes even in semver-patch releases of Node.js.

Five other events are published on a per-request basis following the
[Tracing Channel](https://nodejs.org/api/diagnostics_channel.html#class-tracingchannel)
nomenclature. The list of the channel names and the event they receive is:

- `tracing:fastify.request.handler:start`: Always fires
  - `{ request: Request, reply: Reply, route: { url, method } }`
- `tracing:fastify.request.handler:end`: Always fires
  - `{ request: Request, reply: Reply, route: { url, method }, async: Bool }`
- `tracing:fastify.request.handler:asyncStart`: Fires for promise/async handlers
  - `{ request: Request, reply: Reply, route: { url, method } }`
- `tracing:fastify.request.handler:asyncEnd`: Fires for promise/async handlers
  - `{ request: Request, reply: Reply, route: { url, method } }`
- `tracing:fastify.request.handler:error`: Fires when an error occurs
  - `{ request: Request, reply: Reply, route: { url, method }, error: Error }`

The object instance remains the same for all events associated with a given
request. All payloads include a `request` and `reply` property which are an
instance of Fastify's `Request` and `Reply` instances. They also include a
`route` property which is an object with the matched `url` pattern (e.g.
`/collection/:id`) and the `method` HTTP method (e.g. `GET`). The `:start` and
`:end` events always fire for requests. If a request handler is an `async`
function or one that returns a `Promise` then the `:asyncStart` and `:asyncEnd`
events also fire. Finally, the `:error` event contains an `error` property
associated with the request's failure.

These events can be received like so:

```js
const dc = require('node:diagnostics_channel');
const channel = dc.channel('tracing:fastify.request.handler:start');
channel.subscribe((msg) => {
  console.log(msg.request, msg.reply);
});
```

## Lifecycle

<a id="lifecycle"></a>

This schema shows the internal lifecycle of Fastify.

The right branch of each section shows the next phase of the lifecycle. The left
branch shows the corresponding error code generated if the parent throws an
error. All errors are automatically handled by Fastify.

```
Incoming Request
  │
  └─▶ Routing
        │
        └─▶ Instance Logger
             │
   4**/5** ◀─┴─▶ onRequest Hook
                  │
        4**/5** ◀─┴─▶ preParsing Hook
                        │
              4**/5** ◀─┴─▶ Parsing
                             │
                   4**/5** ◀─┴─▶ preValidation Hook
                                  │
                            400 ◀─┴─▶ Validation
                                        │
                              4**/5** ◀─┴─▶ preHandler Hook
                                              │
                                    4**/5** ◀─┴─▶ User Handler
                                                    │
                                                    └─▶ Reply
                                                          │
                                                4**/5** ◀─┴─▶ preSerialization Hook
                                                                │
                                                                └─▶ onSend Hook
                                                                      │
                                                            4**/5** ◀─┴─▶ Outgoing Response
                                                                            │
                                                                            └─▶ onResponse Hook
```

Before or during the `User Handler`, `reply.hijack()` can be called to:

- Prevent Fastify from running subsequent hooks and the user handler
- Prevent Fastify from sending the response automatically

If `reply.raw` is used to send a response, `onResponse` hooks will still
be executed.

## Reply Lifecycle

<a id="reply-lifecycle"></a>

When the user handles the request, the result may be:

- In an async handler: it returns a payload or throws an `Error`
- In a sync handler: it sends a payload or an `Error` instance

If the reply was hijacked, all subsequent steps are skipped. Otherwise, when
submitted, the data flow is as follows:

```
                        ★ schema validation Error
                                    │
                                    └─▶ schemaErrorFormatter
                                               │
                          reply sent ◀── JSON ─┴─ Error instance
                                                      │
                                                      │         ★ throw an Error
                     ★ send or return                 │                 │
                            │                         │                 │
                            │                         ▼                 │
       reply sent ◀── JSON ─┴─ Error instance ──▶ onError Hook ◀───────┘
                                                      │
                                 reply sent ◀── JSON ─┴─ Error instance ──▶ setErrorHandler
                                                                                │
                                                                                └─▶ reply sent
```

`reply sent` means the JSON payload will be serialized by one of the following:

- The [reply serializer](./Server.md#setreplyserializer) if set
- The [serializer compiler](./Server.md#setserializercompiler) if a JSON schema
  is set for the HTTP status code
- The default `JSON.stringify` function

## Logging

### Enable Logging

Logging is disabled by default. Enable it by passing `{ logger: true }` or
`{ logger: { level: 'info' } }` when creating a Fastify instance. Note that if
the logger is disabled, it cannot be enabled at runtime.
[abstract-logging](https://www.npmjs.com/package/abstract-logging) is used for
this purpose.

As Fastify is focused on performance, it uses
[pino](https://github.com/pinojs/pino) as its logger, with the default log
level set to `'info'` when enabled.

#### Basic logging setup

Enabling the production JSON logger:

```js
const fastify = require('fastify')({
  logger: true,
});
```

#### Environment-Specific Configuration

Enabling the logger with appropriate configuration for local development,
production, and test environments requires more configuration:

```js
const envToLogger = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
  production: true,
  test: false,
};
const fastify = require('fastify')({
  logger: envToLogger[environment] ?? true, // defaults to true if no entry matches in the map
});
```

⚠️ `pino-pretty` needs to be installed as a dev dependency. It is not included
by default for performance reasons.

### Usage

The logger can be used in route handlers as follows:

```js
fastify.get('/', options, function (request, reply) {
  request.log.info('Some info about the current request');
  reply.send({ hello: 'world' });
});
```

Trigger new logs outside route handlers using the Pino instance from the Fastify
instance:

```js
fastify.log.info('Something important happened!');
```

#### Passing Logger Options

To pass options to the logger, provide them to Fastify. See the
[Pino documentation](https://github.com/pinojs/pino/blob/master/docs/api.md#options)
for available options. To specify a file destination, use:

```js
const fastify = require('fastify')({
  logger: {
    level: 'info',
    file: '/path/to/file', // Will use pino.destination()
  },
});

fastify.get('/', options, function (request, reply) {
  request.log.info('Some info about the current request');
  reply.send({ hello: 'world' });
});
```

To pass a custom stream to the Pino instance, add a `stream` field to the logger
object:

```js
const split = require('split2');
const stream = split(JSON.parse);

const fastify = require('fastify')({
  logger: {
    level: 'info',
    stream: stream,
  },
});
```

### Advanced Logger Configuration

<a id="logging-request-id"></a>

#### Request ID Tracking

By default, Fastify adds an ID to every request for easier tracking. If the
`requestIdHeader` option is set and the corresponding header is present, its
value is used; otherwise, a new incremental ID is generated. See Fastify Factory
[`requestIdHeader`](./Server.md#factory-request-id-header) and Fastify Factory
[`genReqId`](./Server.md#genreqid) for customization options.

#### Serializers

The default logger uses standard serializers for objects with `req`, `res`, and
`err` properties. The `req` object is the Fastify [`Request`](./Request.md)
object, and the `res` object is the Fastify [`Reply`](./Reply.md) object. This
behavior can be customized with custom serializers.

```js
const fastify = require('fastify')({
  logger: {
    serializers: {
      req(request) {
        return { url: request.url };
      },
    },
  },
});
```

For example, the response payload and headers could be logged using the approach
below (not recommended):

```js
const fastify = require('fastify')({
  logger: {
    transport: {
      target: 'pino-pretty',
    },
    serializers: {
      res(reply) {
        // The default
        return {
          statusCode: reply.statusCode,
        };
      },
      req(request) {
        return {
          method: request.method,
          url: request.url,
          path: request.routeOptions.url,
          parameters: request.params,
          // Including headers in the log could violate privacy laws,
          // e.g., GDPR. Use the "redact" option to remove sensitive
          // fields. It could also leak authentication data in the logs.
          headers: request.headers,
        };
      },
    },
  },
});
```

> ℹ️ Note: In some cases, the [`Reply`](./Reply.md) object passed to the `res`
> serializer cannot be fully constructed. When writing a custom `res`
> serializer, check for the existence of any properties on `reply` aside from
> `statusCode`, which is always present. For example, verify the existence of
> `getHeaders` before calling it:

```js
const fastify = require('fastify')({
  logger: {
    transport: {
      target: 'pino-pretty',
    },
    serializers: {
      res(reply) {
        // The default
        return {
          statusCode: reply.statusCode,
          headers:
            typeof reply.getHeaders === 'function' ? reply.getHeaders() : {},
        };
      },
    },
  },
});
```

> ℹ️ Note: The body cannot be serialized inside a `req` method because the
> request is serialized when the child logger is created. At that time, the body
> is not yet parsed.

See the following approach to log `req.body`:

```js
app.addHook('preHandler', function (req, reply, done) {
  if (req.body) {
    req.log.info({ body: req.body }, 'parsed body');
  }
  done();
});
```

> ℹ️ Note: Ensure serializers never throw errors, as this can cause the Node
> process to exit. See the
> [Pino documentation](https://getpino.io/#/docs/api?id=opt-serializers) for more
> information.

_Any logger other than Pino will ignore this option._

### Using Custom Loggers

A custom logger instance can be supplied by passing it as `loggerInstance`. The
logger must conform to the Pino interface, with methods: `info`, `error`,
`debug`, `fatal`, `warn`, `trace`, `silent`, `child`, and a string property
`level`.

Example:

```js
const log = require('pino')({ level: 'info' });
const fastify = require('fastify')({ loggerInstance: log });

log.info('does not have request information');

fastify.get('/', function (request, reply) {
  request.log.info(
    'includes request information, but is the same logger instance as `log`'
  );
  reply.send({ hello: 'world' });
});
```

_The logger instance for the current request is available in every part of the
[lifecycle](./Lifecycle.md)._

### Log Redaction

[Pino](https://getpino.io) supports low-overhead log redaction for obscuring
values of specific properties in recorded logs. For example, log all HTTP
headers except the `Authorization` header for security:

```js
const fastify = Fastify({
  logger: {
    stream: stream,
    redact: ['req.headers.authorization'],
    level: 'info',
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          headers: request.headers,
          host: request.host,
          remoteAddress: request.ip,
          remotePort: request.socket.remotePort,
        };
      },
    },
  },
});
```

See https://getpino.io/#/docs/redaction for more details.

## Middleware

Starting with Fastify v3.0.0, middleware is not supported out of the box and
requires an external plugin such as
[`@fastify/express`](https://github.com/fastify/fastify-express) or
[`@fastify/middie`](https://github.com/fastify/middie).

An example of registering the
[`@fastify/express`](https://github.com/fastify/fastify-express) plugin to `use`
Express middleware:

```js
await fastify.register(require('@fastify/express'));
fastify.use(require('cors')());
fastify.use(require('dns-prefetch-control')());
fastify.use(require('frameguard')());
fastify.use(require('hsts')());
fastify.use(require('ienoopen')());
fastify.use(require('x-xss-protection')());
```

[`@fastify/middie`](https://github.com/fastify/middie) can also be used,
which provides support for simple Express-style middleware with improved
performance:

```js
await fastify.register(require('@fastify/middie'));
fastify.use(require('cors')());
```

Middleware can be encapsulated, allowing control over where it runs using
`register` as explained in the [plugins guide](../Guides/Plugins-Guide.md).

Fastify middleware does not expose the `send` method or other methods specific
to the Fastify [Reply](./Reply.md#reply) instance. This is because Fastify wraps
the incoming `req` and `res` Node instances using the
[Request](./Request.md#request) and [Reply](./Reply.md#reply) objects
internally, but this is done after the middleware phase. To create middleware,
use the Node `req` and `res` instances. Alternatively, use the `preHandler` hook
that already has the Fastify [Request](./Request.md#request) and
[Reply](./Reply.md#reply) instances. For more information, see
[Hooks](./Hooks.md#hooks).

#### Restrict middleware execution to certain paths

<a id="restrict-usage"></a>

To run middleware under certain paths, pass the path as the first parameter to
`use`.

> ℹ️ Note: This does not support routes with parameters
> (e.g. `/user/:id/comments`) and wildcards are not supported in multiple paths.

```js
const path = require('node:path');
const serveStatic = require('serve-static');

// Single path
fastify.use('/css', serveStatic(path.join(__dirname, '/assets')));

// Wildcard path
fastify.use('/css/(.*)', serveStatic(path.join(__dirname, '/assets')));

// Multiple paths
fastify.use(['/css', '/js'], serveStatic(path.join(__dirname, '/assets')));
```

### Alternatives

Fastify offers alternatives to commonly used middleware, such as
[`@fastify/helmet`](https://github.com/fastify/fastify-helmet) for
[`helmet`](https://github.com/helmetjs/helmet),
[`@fastify/cors`](https://github.com/fastify/fastify-cors) for
[`cors`](https://github.com/expressjs/cors), and
[`@fastify/static`](https://github.com/fastify/fastify-static) for
[`serve-static`](https://github.com/expressjs/serve-static).

## Plugins

Fastify can be extended with plugins, which can be a set of routes, a server
[decorator](./Decorators.md), or other functionality. Use the `register` API to
add one or more plugins.

By default, `register` creates a _new scope_, meaning changes to the Fastify
instance (via `decorate`) will not affect the current context ancestors, only
its descendants. This feature enables plugin _encapsulation_ and _inheritance_,
creating a _directed acyclic graph_ (DAG) and avoiding cross-dependency issues.

The [Getting Started](../Guides/Getting-Started.md#your-first-plugin) guide
includes an example of using this API:

```js
fastify.register(plugin, [options]);
```

### Plugin Options

<a id="plugin-options"></a>

The optional `options` parameter for `fastify.register` supports a predefined
set of options that Fastify itself will use, except when the plugin has been
wrapped with [fastify-plugin](https://github.com/fastify/fastify-plugin). This
options object will also be passed to the plugin upon invocation, regardless of
whether or not the plugin has been wrapped. The currently supported list of
Fastify specific options is:

- [`logLevel`](./Routes.md#custom-log-level)
- [`logSerializers`](./Routes.md#custom-log-serializer)
- [`prefix`](#route-prefixing-option)

These options will be ignored when used with fastify-plugin.

To avoid collisions, a plugin should consider namespacing its options. For
example, a plugin `foo` might be registered like so:

```js
fastify.register(require('fastify-foo'), {
  prefix: '/foo',
  foo: {
    fooOption1: 'value',
    fooOption2: 'value',
  },
});
```

If collisions are not a concern, the plugin may accept the options object as-is:

```js
fastify.register(require('fastify-foo'), {
  prefix: '/foo',
  fooOption1: 'value',
  fooOption2: 'value',
});
```

The `options` parameter can also be a `Function` evaluated at plugin registration,
providing access to the Fastify instance via the first argument:

```js
const fp = require('fastify-plugin');

fastify.register(
  fp((fastify, opts, done) => {
    fastify.decorate('foo_bar', { hello: 'world' });

    done();
  })
);

// The opts argument of fastify-foo will be { hello: 'world' }
fastify.register(require('fastify-foo'), (parent) => parent.foo_bar);
```

The Fastify instance passed to the function is the latest state of the **external
Fastify instance** the plugin was declared on, allowing access to variables
injected via [`decorate`](./Decorators.md) by preceding plugins according to the
**order of registration**. This is useful if a plugin depends on changes made to
the Fastify instance by a preceding plugin, such as utilizing an existing database
connection.

Keep in mind that the Fastify instance passed to the function is the same as the
one passed into the plugin, a copy of the external Fastify instance rather than a
reference. Any usage of the instance will behave the same as it would if called
within the plugin's function. For example, if `decorate` is called, the decorated
variables will be available within the plugin's function unless it was wrapped
with [`fastify-plugin`](https://github.com/fastify/fastify-plugin).

#### Route Prefixing option

<a id="route-prefixing-option"></a>

If an option with the key `prefix` and a `string` value is passed, Fastify will
use it to prefix all the routes inside the register. For more info, check
[here](./Routes.md#route-prefixing).

Be aware that if routes are wrapped with
[`fastify-plugin`](https://github.com/fastify/fastify-plugin), this option will
not work (see the [workaround](./Routes.md#fastify-plugin)).

#### Error handling

<a id="error-handling"></a>

Error handling is done by [avvio](https://github.com/mcollina/avvio#error-handling).

As a general rule, handle errors in the next `after` or `ready` block, otherwise
they will be caught inside the `listen` callback.

```js
fastify.register(require('my-plugin'));

// `after` will be executed once
// the previous declared `register` has finished
fastify.after((err) => console.log(err));

// `ready` will be executed once all the registers declared
// have finished their execution
fastify.ready((err) => console.log(err));

// `listen` is a special ready,
// so it behaves in the same way
fastify.listen({ port: 3000 }, (err, address) => {
  if (err) console.log(err);
});
```

### async/await

<a id="async-await"></a>

_async/await_ is supported by `after`, `ready`, and `listen`, as well as
`fastify` being a Thenable.

```js
await fastify.register(require('my-plugin'));

await fastify.after();

await fastify.ready();

await fastify.listen({ port: 3000 });
```

Using `await` when registering a plugin loads the plugin and its dependencies,
"finalizing" the encapsulation process. Any mutations to the plugin after it and
its dependencies have been loaded will not be reflected in the parent instance.

#### ESM support

<a id="esm-support"></a>

ESM is supported from [Node.js `v13.3.0`](https://nodejs.org/api/esm.html)
and above.

```js
// main.mjs
import Fastify from 'fastify';
const fastify = Fastify();

fastify.register(import('./plugin.mjs'));

fastify.listen({ port: 3000 }, console.log);

// plugin.mjs
async function plugin(fastify, opts) {
  fastify.get('/', async (req, reply) => {
    return { hello: 'world' };
  });
}

export default plugin;
```

### Create a plugin

<a id="create-plugin"></a>

Creating a plugin is easy. Create a function that takes three parameters: the
`fastify` instance, an `options` object, and the `done` callback.

Example:

```js
module.exports = function (fastify, opts, done) {
  fastify.decorate('utility', function () {});

  fastify.get('/', handler);

  done();
};
```

`register` can also be used inside another `register`:

```js
module.exports = function (fastify, opts, done) {
  fastify.decorate('utility', function () {});

  fastify.get('/', handler);

  fastify.register(require('./other-plugin'));

  done();
};
```

Remember, `register` always creates a new Fastify scope. If this is not needed,
read the following section.

### Handle the scope

<a id="handle-scope"></a>

If `register` is used only to extend server functionality with
[`decorate`](./Decorators.md), tell Fastify not to create a new scope. Otherwise,
changes will not be accessible in the upper scope.

There are two ways to avoid creating a new context:

- Use the [`fastify-plugin`](https://github.com/fastify/fastify-plugin) module
- Use the `'skip-override'` hidden property

Using the `fastify-plugin` module is recommended, as it solves this problem and
allows passing a version range of Fastify that the plugin will support:

```js
const fp = require('fastify-plugin');

module.exports = fp(function (fastify, opts, done) {
  fastify.decorate('utility', function () {});
  done();
}, '0.x');
```

Check the [`fastify-plugin`](https://github.com/fastify/fastify-plugin)
documentation to learn more about how to use this module.

If not using `fastify-plugin`, the `'skip-override'` hidden property can be used,
but it is not recommended. Future Fastify API changes will be your responsibility
to update, whilst `fastify-plugin` ensures backward compatibility.

```js
function yourPlugin(fastify, opts, done) {
  fastify.decorate('utility', function () {});
  done();
}
yourPlugin[Symbol.for('skip-override')] = true;
module.exports = yourPlugin;
```

# Technical Principles

Every decision in the Fastify framework and its official plugins is guided by
the following technical principles:

1. “Zero” overhead in production
2. “Good” developer experience
3. Works great for small & big projects alike
4. Easy to migrate to microservices (or even serverless) and back
5. Security & data validation
6. If something could be a plugin, it likely should be
7. Easily testable
8. Do not monkeypatch core
9. Semantic versioning & Long Term Support
10. Specification adherence

## "Zero" Overhead in Production

Fastify aims to implement features with minimal overhead. This is achieved by
using fast algorithms, data structures, and JavaScript-specific features.

Since JavaScript does not offer zero-overhead data structures, this principle
can conflict with providing a great developer experience and additional features,
as these usually incur some overhead.

## "Good" Developer Experience

Fastify aims to provide the best developer experience at its performance point.
It offers a great out-of-the-box experience that is flexible enough to adapt to
various situations.

For example, binary addons are forbidden because most JavaScript developers do
not have access to a compiler.

## Works great for small and big projects alike

Most applications start small and become more complex over time. Fastify aims to
grow with this complexity, providing advanced features to structure codebases.

## Easy to migrate to microservices (or even serverless) and back

Route deployment should not matter. The framework should "just work".

## Security and Data Validation

A web framework is the first point of contact with untrusted data and must act
as the first line of defense for the system.

## If something could be a plugin, it likely should

Recognizing the infinite use cases for an HTTP framework, catering to all in a
single module would make the codebase unmaintainable. Therefore, hooks and
options are provided to customize the framework as needed.

## Easily testable

Testing Fastify applications should be a first-class concern.

## Do not monkeypatch core

Monkeypatching Node.js APIs or installing globals that alter the runtime makes
building modular applications harder and limits Fastify's use cases. Other
frameworks do this; Fastify does not.

## Semantic Versioning and Long Term Support

A clear [Long Term Support strategy is provided](./LTS.md) to inform developers when
to upgrade.

## Specification adherence

In doubt, we chose the strict behavior as defined by the relevant
Specifications.

## Reply

- [Reply](#reply)
  - [Introduction](#introduction)
  - [.code(statusCode)](#codestatuscode)
  - [.elapsedTime](#elapsedtime)
  - [.statusCode](#statuscode)
  - [.server](#server)
  - [.header(key, value)](#headerkey-value)
  - [.headers(object)](#headersobject)
  - [.getHeader(key)](#getheaderkey)
  - [.getHeaders()](#getheaders)
  - [.removeHeader(key)](#removeheaderkey)
  - [.hasHeader(key)](#hasheaderkey)
  - [.writeEarlyHints(hints, callback)](#writeearlyhintshints-callback)
  - [.trailer(key, function)](#trailerkey-function)
  - [.hasTrailer(key)](#hastrailerkey)
  - [.removeTrailer(key)](#removetrailerkey)
  - [.redirect(dest, [code ,])](#redirectdest--code)
  - [.callNotFound()](#callnotfound)
  - [.type(contentType)](#typecontenttype)
  - [.getSerializationFunction(schema | httpStatus, [contentType])](#getserializationfunctionschema--httpstatus)
  - [.compileSerializationSchema(schema, [httpStatus], [contentType])](#compileserializationschemaschema-httpstatus)
  - [.serializeInput(data, [schema | httpStatus], [httpStatus], [contentType])](#serializeinputdata-schema--httpstatus-httpstatus)
  - [.serializer(func)](#serializerfunc)
  - [.raw](#raw)
  - [.sent](#sent)
  - [.hijack()](#hijack)
  - [.send(data)](#senddata)
    - [Objects](#objects)
    - [Strings](#strings)
    - [Streams](#streams)
    - [Buffers](#buffers)
    - [TypedArrays](#typedarrays)
    - [ReadableStream](#readablestream)
    - [Response](#response)
    - [Errors](#errors)
    - [Type of the final payload](#type-of-the-final-payload)
    - [Async-Await and Promises](#async-await-and-promises)
  - [.then(fulfilled, rejected)](#thenfulfilled-rejected)

### Introduction

<a id="introduction"></a>

The second parameter of the handler function is `Reply`. Reply is a core Fastify
object that exposes the following functions and properties:

- `.code(statusCode)` - Sets the status code.
- `.status(statusCode)` - An alias for `.code(statusCode)`.
- `.statusCode` - Read and set the HTTP status code.
- `.elapsedTime` - Returns the amount of time passed
  since the request was received by Fastify.
- `.server` - A reference to the fastify instance object.
- `.header(name, value)` - Sets a response header.
- `.headers(object)` - Sets all the keys of the object as response headers.
- `.getHeader(name)` - Retrieve value of already set header.
- `.getHeaders()` - Gets a shallow copy of all current response headers.
- `.removeHeader(key)` - Remove the value of a previously set header.
- `.hasHeader(name)` - Determine if a header has been set.
- `.writeEarlyHints(hints, callback)` - Sends early hints to the user
  while the response is being prepared.
- `.trailer(key, function)` - Sets a response trailer.
- `.hasTrailer(key)` - Determine if a trailer has been set.
- `.removeTrailer(key)` - Remove the value of a previously set trailer.
- `.type(value)` - Sets the header `Content-Type`.
- `.redirect(dest, [code,])` - Redirect to the specified URL, the status code is
  optional (defaults to `302`).
- `.callNotFound()` - Invokes the custom not found handler.
- `.serialize(payload)` - Serializes the specified payload using the default
  JSON serializer or using the custom serializer (if one is set) and returns the
  serialized payload.
- `.getSerializationFunction(schema | httpStatus, [contentType])` - Returns the serialization
  function for the specified schema or http status, if any of either are set.
- `.compileSerializationSchema(schema, [httpStatus], [contentType])` - Compiles
  the specified schema and returns a serialization function using the default
  (or customized) `SerializerCompiler`. The optional `httpStatus` is forwarded
  to the `SerializerCompiler` if provided, default to `undefined`.
- `.serializeInput(data, schema, [,httpStatus], [contentType])` - Serializes
  the specified data using the specified schema and returns the serialized payload.
  If the optional `httpStatus`, and `contentType` are provided, the function
  will use the serializer function given for that specific content type and
  HTTP Status Code. Default to `undefined`.
- `.serializer(function)` - Sets a custom serializer for the payload.
- `.send(payload)` - Sends the payload to the user, could be a plain text, a
  buffer, JSON, stream, or an Error object.
- `.sent` - A boolean value that you can use if you need to know if `send` has
  already been called.
- `.hijack()` - interrupt the normal request lifecycle.
- `.raw` - The
  [`http.ServerResponse`](https://nodejs.org/dist/latest-v20.x/docs/api/http.html#http_class_http_serverresponse)
  from Node core.
- `.log` - The logger instance of the incoming request.
- `.request` - The incoming request.

```js
fastify.get('/', options, function (request, reply) {
  // Your code
  reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send({ hello: 'world' });
});
```

### .code(statusCode)

<a id="code"></a>

If not set via `reply.code`, the resulting `statusCode` will be `200`.

### .elapsedTime

<a id="elapsedTime"></a>

Invokes the custom response time getter to calculate the amount of time passed
since the request was received by Fastify.

```js
const milliseconds = reply.elapsedTime;
```

### .statusCode

<a id="statusCode"></a>

This property reads and sets the HTTP status code. It is an alias for
`reply.code()` when used as a setter.

```js
if (reply.statusCode >= 299) {
  reply.statusCode = 500;
}
```

### .server

<a id="server"></a>

The Fastify server instance, scoped to the current [encapsulation
context](./Encapsulation.md).

```js
fastify.decorate('util', function util() {
  return 'foo';
});

fastify.get('/', async function (req, rep) {
  return rep.server.util(); // foo
});
```

### .header(key, value)

<a id="header"></a>

Sets a response header. If the value is omitted or undefined, it is coerced to
`''`.

> ℹ️ Note: The header's value must be properly encoded using
> [`encodeURI`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI)
> or similar modules such as
> [`encodeurl`](https://www.npmjs.com/package/encodeurl). Invalid characters
> will result in a 500 `TypeError` response.

For more information, see
[`http.ServerResponse#setHeader`](https://nodejs.org/dist/latest-v20.x/docs/api/http.html#http_response_setheader_name_value).

- ### set-cookie

  <a id="set-cookie"></a>

  - When sending different values as a cookie with `set-cookie` as the key,
    every value will be sent as a cookie instead of replacing the previous
    value.

  ```js
  reply.header('set-cookie', 'foo');
  reply.header('set-cookie', 'bar');
  ```

  - The browser will only consider the latest reference of a key for the
    `set-cookie` header. This is done to avoid parsing the `set-cookie` header
    when added to a reply and speeds up the serialization of the reply.

  - To reset the `set-cookie` header, you need to make an explicit call to
    `reply.removeHeader('set-cookie')`, read more about `.removeHeader(key)`
    [here](#removeheaderkey).

### .headers(object)

<a id="headers"></a>

Sets all the keys of the object as response headers.
[`.header`](#headerkey-value) will be called under the hood.

```js
reply.headers({
  'x-foo': 'foo',
  'x-bar': 'bar',
});
```

### .getHeader(key)

<a id="getHeader"></a>

Retrieves the value of a previously set header.

```js
reply.header('x-foo', 'foo'); // setHeader: key, value
reply.getHeader('x-foo'); // 'foo'
```

### .getHeaders()

<a id="getHeaders"></a>

Gets a shallow copy of all current response headers, including those set via the
raw `http.ServerResponse`. Note that headers set via Fastify take precedence
over those set via `http.ServerResponse`.

```js
reply.header('x-foo', 'foo');
reply.header('x-bar', 'bar');
reply.raw.setHeader('x-foo', 'foo2');
reply.getHeaders(); // { 'x-foo': 'foo', 'x-bar': 'bar' }
```

### .removeHeader(key)

<a id="getHeader"></a>

Remove the value of a previously set header.

```js
reply.header('x-foo', 'foo');
reply.removeHeader('x-foo');
reply.getHeader('x-foo'); // undefined
```

### .hasHeader(key)

<a id="hasHeader"></a>

Returns a boolean indicating if the specified header has been set.

### .writeEarlyHints(hints, callback)

<a id="writeEarlyHints"></a>

Sends early hints to the client. Early hints allow the client to
start processing resources before the final response is sent.
This can improve performance by allowing the client to preload
or preconnect to resources while the server is still generating the response.

The hints parameter is an object containing the early hint key-value pairs.

Example:

```js
reply.writeEarlyHints({
  Link: '</styles.css>; rel=preload; as=style',
});
```

The optional callback parameter is a function that will be called
once the hint is sent or if an error occurs.

### .trailer(key, function)

<a id="trailer"></a>

Sets a response trailer. Trailer is usually used when you need a header that
requires heavy resources to be sent after the `data`, for example,
`Server-Timing` and `Etag`. It can ensure the client receives the response data
as soon as possible.

> ℹ️ Note: The header `Transfer-Encoding: chunked` will be added once you use
> the trailer. It is a hard requirement for using trailer in Node.js.

> ℹ️ Note: Any error passed to `done` callback will be ignored. If you interested
> in the error, you can turn on `debug` level logging.\*

```js
reply.trailer('server-timing', function () {
  return 'db;dur=53, app;dur=47.2';
});

const { createHash } = require('node:crypto');
// trailer function also receive two argument
// @param {object} reply fastify reply
// @param {string|Buffer|null} payload payload that already sent, note that it will be null when stream is sent
// @param {function} done callback to set trailer value
reply.trailer('content-md5', function (reply, payload, done) {
  const hash = createHash('md5');
  hash.update(payload);
  done(null, hash.digest('hex'));
});

// when you prefer async-await
reply.trailer('content-md5', async function (reply, payload) {
  const hash = createHash('md5');
  hash.update(payload);
  return hash.digest('hex');
});
```

### .hasTrailer(key)

<a id="hasTrailer"></a>

Returns a boolean indicating if the specified trailer has been set.

### .removeTrailer(key)

<a id="removeTrailer"></a>

Remove the value of a previously set trailer.

```js
reply.trailer('server-timing', function () {
  return 'db;dur=53, app;dur=47.2';
});
reply.removeTrailer('server-timing');
reply.getTrailer('server-timing'); // undefined
```

### .redirect(dest, [code ,])

<a id="redirect"></a>

Redirects a request to the specified URL, the status code is optional, default
to `302` (if status code is not already set by calling `code`).

> ℹ️ Note: The input URL must be properly encoded using
> [`encodeURI`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI)
> or similar modules such as
> [`encodeurl`](https://www.npmjs.com/package/encodeurl). Invalid URLs will
> result in a 500 `TypeError` response.

Example (no `reply.code()` call) sets status code to `302` and redirects to
`/home`

```js
reply.redirect('/home');
```

Example (no `reply.code()` call) sets status code to `303` and redirects to
`/home`

```js
reply.redirect('/home', 303);
```

Example (`reply.code()` call) sets status code to `303` and redirects to `/home`

```js
reply.code(303).redirect('/home');
```

Example (`reply.code()` call) sets status code to `302` and redirects to `/home`

```js
reply.code(303).redirect('/home', 302);
```

### .callNotFound()

<a id="call-not-found"></a>

Invokes the custom not found handler. Note that it will only call `preHandler`
hook specified in [`setNotFoundHandler`](./Server.md#set-not-found-handler).

```js
reply.callNotFound();
```

### .type(contentType)

<a id="type"></a>

Sets the content type for the response. This is a shortcut for
`reply.header('Content-Type', 'the/type')`.

```js
reply.type('text/html');
```

If the `Content-Type` has a JSON subtype, and the charset parameter is not set,
`utf-8` will be used as the charset by default. For other content types, the
charset must be set explicitly.

### .getSerializationFunction(schema | httpStatus, [contentType])

<a id="getserializationfunction"></a>

By calling this function using a provided `schema` or `httpStatus`,
and the optional `contentType`, it will return a `serialzation` function
that can be used to serialize diverse inputs. It returns `undefined` if no
serialization function was found using either of the provided inputs.

This heavily depends of the `schema#responses` attached to the route, or
the serialization functions compiled by using `compileSerializationSchema`.

```js
const serialize = reply.getSerializationFunction({
  type: 'object',
  properties: {
    foo: {
      type: 'string',
    },
  },
});
serialize({ foo: 'bar' }); // '{"foo":"bar"}'

// or

const serialize = reply.getSerializationFunction(200);
serialize({ foo: 'bar' }); // '{"foo":"bar"}'

// or

const serialize = reply.getSerializationFunction(200, 'application/json');
serialize({ foo: 'bar' }); // '{"foo":"bar"}'
```

See [.compileSerializationSchema(schema, [httpStatus], [contentType])](#compileserializationschema)
for more information on how to compile serialization schemas.

### .compileSerializationSchema(schema, [httpStatus], [contentType])

<a id="compileserializationschema"></a>

This function will compile a serialization schema and
return a function that can be used to serialize data.
The function returned (a.k.a. _serialization function_) returned is compiled
by using the provided `SerializerCompiler`. Also this is cached by using
a `WeakMap` for reducing compilation calls.

The optional parameters `httpStatus` and `contentType`, if provided,
are forwarded directly to the `SerializerCompiler`, so it can be used
to compile the serialization function if a custom `SerializerCompiler` is used.

This heavily depends of the `schema#responses` attached to the route, or
the serialization functions compiled by using `compileSerializationSchema`.

```js
const serialize = reply.compileSerializationSchema({
  type: 'object',
  properties: {
    foo: {
      type: 'string',
    },
  },
});
serialize({ foo: 'bar' }); // '{"foo":"bar"}'

// or

const serialize = reply.compileSerializationSchema(
  {
    type: 'object',
    properties: {
      foo: {
        type: 'string',
      },
    },
  },
  200
);
serialize({ foo: 'bar' }); // '{"foo":"bar"}'

// or

const serialize = reply.compileSerializationSchema(
  {
    '3xx': {
      content: {
        'application/json': {
          schema: {
            name: { type: 'string' },
            phone: { type: 'number' },
          },
        },
      },
    },
  },
  '3xx',
  'application/json'
);
serialize({ name: 'Jone', phone: 201090909090 }); // '{"name":"Jone", "phone":201090909090}'
```

Note that you should be careful when using this function, as it will cache
the compiled serialization functions based on the schema provided. If the
schemas provided is mutated or changed, the serialization functions will not
detect that the schema has been altered and for instance it will reuse the
previously compiled serialization function based on the reference of the schema
previously provided.

If there's a need to change the properties of a schema, always opt to create
a totally new object, otherwise the implementation won't benefit from the cache
mechanism.

:Using the following schema as example:

```js
const schema1 = {
  type: 'object',
  properties: {
    foo: {
      type: 'string',
    },
  },
};
```

_Not_

```js
const serialize = reply.compileSerializationSchema(schema1)

// Later on...
schema1.properties.foo.type. = 'integer'
const newSerialize = reply.compileSerializationSchema(schema1)

console.log(newSerialize === serialize) // true
```

_Instead_

```js
const serialize = reply.compileSerializationSchema(schema1);

// Later on...
const newSchema = Object.assign({}, schema1);
newSchema.properties.foo.type = 'integer';

const newSerialize = reply.compileSerializationSchema(newSchema);

console.log(newSerialize === serialize); // false
```

### .serializeInput(data, [schema | httpStatus], [httpStatus], [contentType])

<a id="serializeinput"></a>

This function will serialize the input data based on the provided schema
or HTTP status code. If both are provided the `httpStatus` will take precedence.

If there is not a serialization function for a given `schema` a new serialization
function will be compiled, forwarding the `httpStatus` and `contentType` if provided.

```js
reply.serializeInput(
  { foo: 'bar' },
  {
    type: 'object',
    properties: {
      foo: {
        type: 'string',
      },
    },
  }
); // '{"foo":"bar"}'

// or

reply.serializeInput(
  { foo: 'bar' },
  {
    type: 'object',
    properties: {
      foo: {
        type: 'string',
      },
    },
  },
  200
); // '{"foo":"bar"}'

// or

reply.serializeInput({ foo: 'bar' }, 200); // '{"foo":"bar"}'

// or

reply.serializeInput(
  { name: 'Jone', age: 18 },
  '200',
  'application/vnd.v1+json'
); // '{"name": "Jone", "age": 18}'
```

See [.compileSerializationSchema(schema, [httpStatus], [contentType])](#compileserializationschema)
for more information on how to compile serialization schemas.

### .serializer(func)

<a id="serializer"></a>

By default, `.send()` will JSON-serialize any value that is not one of `Buffer`,
`stream`, `string`, `undefined`, or `Error`. If you need to replace the default
serializer with a custom serializer for a particular request, you can do so with
the `.serializer()` utility. Be aware that if you are using a custom serializer,
you must set a custom `'Content-Type'` header.

```js
reply
  .header('Content-Type', 'application/x-protobuf')
  .serializer(protoBuf.serialize);
```

Note that you don't need to use this utility inside a `handler` because Buffers,
streams, and strings (unless a serializer is set) are considered to already be
serialized.

```js
reply
  .header('Content-Type', 'application/x-protobuf')
  .send(protoBuf.serialize(data));
```

See [`.send()`](#send) for more information on sending different types of
values.

### .raw

<a id="raw"></a>

This is the
[`http.ServerResponse`](https://nodejs.org/dist/latest-v20.x/docs/api/http.html#http_class_http_serverresponse)
from Node core. Whilst you are using the Fastify `Reply` object, the use of
`Reply.raw` functions is at your own risk as you are skipping all the Fastify
logic of handling the HTTP response. e.g.:

```js
app.get('/cookie-2', (req, reply) => {
  reply.setCookie('session', 'value', { secure: false }); // this will not be used

  // in this case we are using only the nodejs http server response object
  reply.raw.writeHead(200, { 'Content-Type': 'text/plain' });
  reply.raw.write('ok');
  reply.raw.end();
});
```

Another example of the misuse of `Reply.raw` is explained in
[Reply](#getheaders).

### .sent

<a id="sent"></a>

As the name suggests, `.sent` is a property to indicate if a response has been
sent via `reply.send()`. It will also be `true` in case `reply.hijack()` was
used.

In case a route handler is defined as an async function or it returns a promise,
it is possible to call `reply.hijack()` to indicate that the automatic
invocation of `reply.send()` once the handler promise resolve should be skipped.
By calling `reply.hijack()`, an application claims full responsibility for the
low-level request and response. Moreover, hooks will not be invoked.

_Modifying the `.sent` property directly is deprecated. Please use the
aforementioned `.hijack()` method to achieve the same effect._

### .hijack()

<a name="hijack"></a>

Sometimes you might need to halt the execution of the normal request lifecycle
and handle sending the response manually.

To achieve this, Fastify provides the `reply.hijack()` method that can be called
during the request lifecycle (At any point before `reply.send()` is called), and
allows you to prevent Fastify from sending the response, and from running the
remaining hooks (and user handler if the reply was hijacked before).

```js
app.get('/', (req, reply) => {
  reply.hijack();
  reply.raw.end('hello world');

  return Promise.resolve('this will be skipped');
});
```

If `reply.raw` is used to send a response back to the user, the `onResponse`
hooks will still be executed.

### .send(data)

<a id="send"></a>

As the name suggests, `.send()` is the function that sends the payload to the
end user.

#### Objects

<a id="send-object"></a>

As noted above, if you are sending JSON objects, `send` will serialize the
object with
[fast-json-stringify](https://www.npmjs.com/package/fast-json-stringify) if you
set an output schema, otherwise, `JSON.stringify()` will be used.

```js
fastify.get('/json', options, function (request, reply) {
  reply.send({ hello: 'world' });
});
```

#### Strings

<a id="send-string"></a>

If you pass a string to `send` without a `Content-Type`, it will be sent as
`text/plain; charset=utf-8`. If you set the `Content-Type` header and pass a
string to `send`, it will be serialized with the custom serializer if one is
set, otherwise, it will be sent unmodified (unless the `Content-Type` header is
set to `application/json; charset=utf-8`, in which case it will be
JSON-serialized like an object — see the section above).

```js
fastify.get('/json', options, function (request, reply) {
  reply.send('plain string');
});
```

#### Streams

<a id="send-streams"></a>

If you are sending a stream and you have not set a `'Content-Type'` header,
_send_ will set it to `'application/octet-stream'`.

As noted above, streams are considered to be pre-serialized, so they will be
sent unmodified without response validation.

```js
const fs = require('node:fs');

fastify.get('/streams', function (request, reply) {
  const stream = fs.createReadStream('some-file', 'utf8');
  reply.header('Content-Type', 'application/octet-stream');
  reply.send(stream);
});
```

When using async-await you will need to return or await the reply object:

```js
const fs = require('node:fs');

fastify.get('/streams', async function (request, reply) {
  const stream = fs.createReadStream('some-file', 'utf8');
  reply.header('Content-Type', 'application/octet-stream');
  return reply.send(stream);
});
```

#### Buffers

<a id="send-buffers"></a>

If you are sending a buffer and you have not set a `'Content-Type'` header,
_send_ will set it to `'application/octet-stream'`.

As noted above, Buffers are considered to be pre-serialized, so they will be
sent unmodified without response validation.

```js
const fs = require('node:fs');

fastify.get('/streams', function (request, reply) {
  fs.readFile('some-file', (err, fileBuffer) => {
    reply.send(err || fileBuffer);
  });
});
```

When using async-await you will need to return or await the reply object:

```js
const fs = require('node:fs');

fastify.get('/streams', async function (request, reply) {
  fs.readFile('some-file', (err, fileBuffer) => {
    reply.send(err || fileBuffer);
  });
  return reply;
});
```

#### TypedArrays

<a id="send-typedarrays"></a>

`send` manages TypedArray like a Buffer, and sets the `'Content-Type'`
header to `'application/octet-stream'` if not already set.

As noted above, TypedArray/Buffers are considered to be pre-serialized, so they
will be sent unmodified without response validation.

```js
const fs = require('node:fs');

fastify.get('/streams', function (request, reply) {
  const typedArray = new Uint16Array(10);
  reply.send(typedArray);
});
```

#### ReadableStream

<a id="send-readablestream"></a>

`ReadableStream` will be treated as a node stream mentioned above,
the content is considered to be pre-serialized, so they will be
sent unmodified without response validation.

```js
const fs = require('node:fs');
const { ReadableStream } = require('node:stream/web');

fastify.get('/streams', function (request, reply) {
  const stream = fs.createReadStream('some-file');
  reply.header('Content-Type', 'application/octet-stream');
  reply.send(ReadableStream.from(stream));
});
```

#### Response

<a id="send-response"></a>

`Response` allows to manage the reply payload, status code and
headers in one place. The payload provided inside `Response` is
considered to be pre-serialized, so they will be sent unmodified
without response validation.

Please be aware when using `Response`, the status code and headers
will not directly reflect to `reply.statusCode` and `reply.getHeaders()`.
Such behavior is based on `Response` only allow `readonly` status
code and headers. The data is not allow to be bi-direction editing,
and may confuse when checking the `payload` in `onSend` hooks.

```js
const fs = require('node:fs');
const { ReadableStream } = require('node:stream/web');

fastify.get('/streams', function (request, reply) {
  const stream = fs.createReadStream('some-file');
  const readableStream = ReadableStream.from(stream);
  const response = new Response(readableStream, {
    status: 200,
    headers: { 'content-type': 'application/octet-stream' },
  });
  reply.send(response);
});
```

#### Errors

<a id="errors"></a>

If you pass to _send_ an object that is an instance of _Error_, Fastify will
automatically create an error structured as the following:

```js
{
  error: String; // the HTTP error message
  code: String; // the Fastify error code
  message: String; // the user error message
  statusCode: Number; // the HTTP status code
}
```

You can add custom properties to the Error object, such as `headers`, that will
be used to enhance the HTTP response.

> ℹ️ Note: If you are passing an error to `send` and the statusCode is less than
> 400, Fastify will automatically set it at 500.

Tip: you can simplify errors by using the
[`http-errors`](https://npm.im/http-errors) module or
[`@fastify/sensible`](https://github.com/fastify/fastify-sensible) plugin to
generate errors:

```js
fastify.get('/', function (request, reply) {
  reply.send(httpErrors.Gone());
});
```

To customize the JSON error output you can do it by:

- setting a response JSON schema for the status code you need
- add the additional properties to the `Error` instance

Notice that if the returned status code is not in the response schema list, the
default behavior will be applied.

```js
fastify.get(
  '/',
  {
    schema: {
      response: {
        501: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            code: { type: 'string' },
            error: { type: 'string' },
            message: { type: 'string' },
            time: { type: 'string' },
          },
        },
      },
    },
  },
  function (request, reply) {
    const error = new Error('This endpoint has not been implemented');
    error.time = 'it will be implemented in two weeks';
    reply.code(501).send(error);
  }
);
```

If you want to customize error handling, check out
[`setErrorHandler`](./Server.md#seterrorhandler) API.

> ℹ️ Note: you are responsible for logging when customizing the error handler.

API:

```js
fastify.setErrorHandler(function (error, request, reply) {
  request.log.warn(error);
  const statusCode = error.statusCode >= 400 ? error.statusCode : 500;
  reply
    .code(statusCode)
    .type('text/plain')
    .send(statusCode >= 500 ? 'Internal server error' : error.message);
});
```

Beware that calling `reply.send(error)` in your custom error handler will send
the error to the default error handler.
Check out the [Reply Lifecycle](./Lifecycle.md#reply-lifecycle)
for more information.

The not found errors generated by the router will use the
[`setNotFoundHandler`](./Server.md#setnotfoundhandler)

API:

```js
fastify.setNotFoundHandler(function (request, reply) {
  reply.code(404).type('text/plain').send('a custom not found');
});
```

#### Type of the final payload

<a id="payload-type"></a>

The type of the sent payload (after serialization and going through any
[`onSend` hooks](./Hooks.md#onsend)) must be one of the following types,
otherwise, an error will be thrown:

- `string`
- `Buffer`
- `stream`
- `undefined`
- `null`

#### Async-Await and Promises

<a id="async-await-promise"></a>

Fastify natively handles promises and supports async-await.

_Note that in the following examples we are not using reply.send._

```js
const { promisify } = require('node:util');
const delay = promisify(setTimeout);

fastify.get('/promises', options, function (request, reply) {
  return delay(200).then(() => {
    return { hello: 'world' };
  });
});

fastify.get('/async-await', options, async function (request, reply) {
  await delay(200);
  return { hello: 'world' };
});
```

Rejected promises default to a `500` HTTP status code. Reject the promise, or
`throw` in an `async function`, with an object that has `statusCode` (or
`status`) and `message` properties to modify the reply.

```js
fastify.get('/teapot', async function (request, reply) {
  const err = new Error();
  err.statusCode = 418;
  err.message = 'short and stout';
  throw err;
});

fastify.get('/botnet', async function (request, reply) {
  throw { statusCode: 418, message: 'short and stout' };
  // will return to the client the same json
});
```

If you want to know more please review
[Routes#async-await](./Routes.md#async-await).

### .then(fulfilled, rejected)

<a id="then"></a>

As the name suggests, a `Reply` object can be awaited upon, i.e. `await reply`
will wait until the reply is sent. The `await` syntax calls the `reply.then()`.

`reply.then(fulfilled, rejected)` accepts two parameters:

- `fulfilled` will be called when a response has been fully sent,
- `rejected` will be called if the underlying stream had an error, e.g. the
  socket has been destroyed.

For more details, see:

- https://github.com/fastify/fastify/issues/1864 for the discussion about this
  feature
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
  for the signature
  ## Request
  The first parameter of the handler function is `Request`.

Request is a core Fastify object containing the following fields:

- `query` - The parsed querystring, its format is specified by
  [`querystringParser`](./Server.md#querystringparser).
- `body` - The request payload, see [Content-Type Parser](./ContentTypeParser.md)
  for details on what request payloads Fastify natively parses and how to support
  other content types.
- `params` - The params matching the URL.
- [`headers`](#headers) - The headers getter and setter.
- `raw` - The incoming HTTP request from Node core.
- `server` - The Fastify server instance, scoped to the current
  [encapsulation context](./Encapsulation.md).
- `id` - The request ID.
- `log` - The logger instance of the incoming request.
- `ip` - The IP address of the incoming request.
- `ips` - An array of the IP addresses, ordered from closest to furthest, in the
  `X-Forwarded-For` header of the incoming request (only when the
  [`trustProxy`](./Server.md#factory-trust-proxy) option is enabled).
- `host` - The host of the incoming request (derived from `X-Forwarded-Host`
  header when the [`trustProxy`](./Server.md#factory-trust-proxy) option is
  enabled). For HTTP/2 compatibility, it returns `:authority` if no host header
  exists. The host header may return an empty string if `requireHostHeader` is
  `false`, not provided with HTTP/1.0, or removed by schema validation.
- `hostname` - The hostname derived from the `host` property of the incoming request.
- `port` - The port from the `host` property, which may refer to the port the
  server is listening on.
- `protocol` - The protocol of the incoming request (`https` or `http`).
- `method` - The method of the incoming request.
- `url` - The URL of the incoming request.
- `originalUrl` - Similar to `url`, allows access to the original `url` in
  case of internal re-routing.
- `is404` - `true` if request is being handled by 404 handler, `false` otherwise.
- `socket` - The underlying connection of the incoming request.
- `context` - Deprecated, use `request.routeOptions.config` instead. A Fastify
  internal object. Do not use or modify it directly. It is useful to access one
  special key:
  - `context.config` - The route [`config`](./Routes.md#routes-config) object.
- `routeOptions` - The route [`option`](./Routes.md#routes-options) object.
  - `bodyLimit` - Either server limit or route limit.
  - `config` - The [`config`](./Routes.md#routes-config) object for this route.
  - `method` - The HTTP method for the route.
  - `url` - The path of the URL to match this route.
  - `handler` - The handler for this route.
  - `attachValidation` - Attach `validationError` to request (if there is
    a schema defined).
  - `logLevel` - Log level defined for this route.
  - `schema` - The JSON schemas definition for this route.
  - `version` - A semver compatible string that defines the version of the endpoint.
  - `exposeHeadRoute` - Creates a sibling HEAD route for any GET routes.
  - `prefixTrailingSlash` - String used to determine how to handle passing `/`
    as a route with a prefix.
- [.getValidationFunction(schema | httpPart)](#getvalidationfunction) -
  Returns a validation function for the specified schema or HTTP part, if
  set or cached.
- [.compileValidationSchema(schema, [httpPart])](#compilevalidationschema) -
  Compiles the specified schema and returns a validation function using the
  default (or customized) `ValidationCompiler`. The optional `httpPart` is
  forwarded to the `ValidationCompiler` if provided, defaults to `null`.
- [.validateInput(data, schema | httpPart, [httpPart])](#validate) -
  Validates the input using the specified schema and returns the serialized
  payload. If `httpPart` is provided, the function uses the serializer for
  that HTTP Status Code. Defaults to `null`.

### Headers

The `request.headers` is a getter that returns an object with the headers of the
incoming request. Set custom headers as follows:

```js
request.headers = {
  foo: 'bar',
  baz: 'qux',
};
```

This operation adds new values to the request headers, accessible via
`request.headers.bar`. Standard request headers remain accessible via
`request.raw.headers`.

For performance reasons, `Symbol('fastify.RequestAcceptVersion')` may be added
to headers on `not found` routes.

> ℹ️ Note: Schema validation may mutate the `request.headers` and
> `request.raw.headers` objects, causing the headers to become empty.

```js
fastify.post('/:params', options, function (request, reply) {
  console.log(request.body);
  console.log(request.query);
  console.log(request.params);
  console.log(request.headers);
  console.log(request.raw);
  console.log(request.server);
  console.log(request.id);
  console.log(request.ip);
  console.log(request.ips);
  console.log(request.host);
  console.log(request.hostname);
  console.log(request.port);
  console.log(request.protocol);
  console.log(request.url);
  console.log(request.routeOptions.method);
  console.log(request.routeOptions.bodyLimit);
  console.log(request.routeOptions.method);
  console.log(request.routeOptions.url);
  console.log(request.routeOptions.attachValidation);
  console.log(request.routeOptions.logLevel);
  console.log(request.routeOptions.version);
  console.log(request.routeOptions.exposeHeadRoute);
  console.log(request.routeOptions.prefixTrailingSlash);
  console.log(request.routeOptions.logLevel);
  request.log.info('some info');
});
```

### .getValidationFunction(schema | httpPart)

<a id="getvalidationfunction"></a>

By calling this function with a provided `schema` or `httpPart`, it returns a
`validation` function to validate diverse inputs. It returns `undefined` if no
serialization function is found using the provided inputs.

This function has an `errors` property. Errors encountered during the last
validation are assigned to `errors`.

```js
const validate = request.getValidationFunction({
  type: 'object',
  properties: {
    foo: {
      type: 'string',
    },
  },
});
console.log(validate({ foo: 'bar' })); // true
console.log(validate.errors); // null

// or

const validate = request.getValidationFunction('body');
console.log(validate({ foo: 0.5 })); // false
console.log(validate.errors); // validation errors
```

See [.compileValidationSchema(schema, [httpStatus])](#compileValidationSchema)
for more information on compiling validation schemas.

### .compileValidationSchema(schema, [httpPart])

<a id="compilevalidationschema"></a>

This function compiles a validation schema and returns a function to validate data.
The returned function (a.k.a. _validation function_) is compiled using the provided
[`SchemaController#ValidationCompiler`](./Server.md#schema-controller). A `WeakMap`
is used to cache this, reducing compilation calls.

The optional parameter `httpPart`, if provided, is forwarded to the
`ValidationCompiler`, allowing it to compile the validation function if a custom
`ValidationCompiler` is provided for the route.

This function has an `errors` property. Errors encountered during the last
validation are assigned to `errors`.

```js
const validate = request.compileValidationSchema({
  type: 'object',
  properties: {
    foo: {
      type: 'string',
    },
  },
});
console.log(validate({ foo: 'bar' })); // true
console.log(validate.errors); // null

// or

const validate = request.compileValidationSchema(
  {
    type: 'object',
    properties: {
      foo: {
        type: 'string',
      },
    },
  },
  200
);
console.log(validate({ hello: 'world' })); // false
console.log(validate.errors); // validation errors
```

Be careful when using this function, as it caches compiled validation functions
based on the provided schema. If schemas are mutated or changed, the validation
functions will not detect the alterations and will reuse the previously compiled
validation function, as the cache is based on the schema's reference.

If schema properties need to be changed, create a new schema object to benefit
from the cache mechanism.

Using the following schema as an example:

```js
const schema1 = {
  type: 'object',
  properties: {
    foo: {
      type: 'string',
    },
  },
};
```

_Not_

```js
const validate = request.compileValidationSchema(schema1)

// Later on...
schema1.properties.foo.type. = 'integer'
const newValidate = request.compileValidationSchema(schema1)

console.log(newValidate === validate) // true
```

_Instead_

```js
const validate = request.compileValidationSchema(schema1);

// Later on...
const newSchema = Object.assign({}, schema1);
newSchema.properties.foo.type = 'integer';

const newValidate = request.compileValidationSchema(newSchema);

console.log(newValidate === validate); // false
```

### .validateInput(data, [schema | httpStatus], [httpStatus])

<a id="validate"></a>

This function validates the input based on the provided schema or HTTP part. If
both are provided, the `httpPart` parameter takes precedence.

If no validation function exists for a given `schema`, a new validation function
will be compiled, forwarding the `httpPart` if provided.

```js
request.validateInput(
  { foo: 'bar' },
  {
    type: 'object',
    properties: {
      foo: {
        type: 'string',
      },
    },
  }
); // true

// or

request.validateInput(
  { foo: 'bar' },
  {
    type: 'object',
    properties: {
      foo: {
        type: 'string',
      },
    },
  },
  'body'
); // true

// or

request.validateInput({ hello: 'world' }, 'query'); // false
```

See [.compileValidationSchema(schema, [httpStatus])](#compileValidationSchema)
for more information on compiling validation schemas.

## Routes

The route methods configure the endpoints of the application. Routes can be
declared using the shorthand method or the full declaration.

- [Full declaration](#full-declaration)
- [Routes options](#routes-options)
- [Shorthand declaration](#shorthand-declaration)
- [Url building](#url-building)
- [Async Await](#async-await)
- [Promise resolution](#promise-resolution)
- [Route Prefixing](#route-prefixing)
  - [Handling of / route inside prefixed
    plugins](#handling-of--route-inside-prefixed-plugins)
- [Custom Log Level](#custom-log-level)
- [Custom Log Serializer](#custom-log-serializer)
- [Config](#config)
- [Constraints](#constraints)
  - [Version Constraints](#version-constraints)
  - [Host Constraints](#host-constraints)

### Full declaration

<a id="full-declaration"></a>

```js
fastify.route(options);
```

### Routes options

<a id="options"></a>

- `method`: currently it supports `GET`, `HEAD`, `TRACE`, `DELETE`,
  `OPTIONS`, `PATCH`, `PUT` and `POST`. To accept more methods,
  the [`addHttpMethod`](./Server.md#addHttpMethod) must be used.
  It could also be an array of methods.
- `url`: the path of the URL to match this route (alias: `path`).
- `schema`: an object containing the schemas for the request and response. They
  need to be in [JSON Schema](https://json-schema.org/) format, check
  [here](./Validation-and-Serialization.md) for more info.

  - `body`: validates the body of the request if it is a POST, PUT, PATCH,
    TRACE, SEARCH, PROPFIND, PROPPATCH or LOCK method.
  - `querystring` or `query`: validates the querystring. This can be a complete
    JSON Schema object, with the property `type` of `object` and `properties`
    object of parameters, or simply the values of what would be contained in the
    `properties` object as shown below.
  - `params`: validates the params.
  - `response`: filter and generate a schema for the response, setting a schema
    allows us to have 10-20% more throughput.

- `exposeHeadRoute`: creates a sibling `HEAD` route for any `GET` routes.
  Defaults to the value of [`exposeHeadRoutes`](./Server.md#exposeHeadRoutes)
  instance option. If you want a custom `HEAD` handler without disabling this
  option, make sure to define it before the `GET` route.
- `attachValidation`: attach `validationError` to request, if there is a schema
  validation error, instead of sending the error to the error handler. The
  default [error format](https://ajv.js.org/api.html#error-objects) is the Ajv
  one.
- `onRequest(request, reply, done)`: a [function](./Hooks.md#onrequest) called
  as soon as a request is received, it could also be an array of functions.
- `preParsing(request, reply, payload, done)`: a
  [function](./Hooks.md#preparsing) called before parsing the request, it could
  also be an array of functions.
- `preValidation(request, reply, done)`: a [function](./Hooks.md#prevalidation)
  called after the shared `preValidation` hooks, useful if you need to perform
  authentication at route level for example, it could also be an array of
  functions.
- `preHandler(request, reply, done)`: a [function](./Hooks.md#prehandler) called
  just before the request handler, it could also be an array of functions.
- `preSerialization(request, reply, payload, done)`: a
  [function](./Hooks.md#preserialization) called just before the serialization,
  it could also be an array of functions.
- `onSend(request, reply, payload, done)`: a [function](./Hooks.md#route-hooks)
  called right before a response is sent, it could also be an array of
  functions.
- `onResponse(request, reply, done)`: a [function](./Hooks.md#onresponse) called
  when a response has been sent, so you will not be able to send more data to
  the client. It could also be an array of functions.
- `onTimeout(request, reply, done)`: a [function](./Hooks.md#ontimeout) called
  when a request is timed out and the HTTP socket has been hung up.
- `onError(request, reply, error, done)`: a [function](./Hooks.md#onerror)
  called when an Error is thrown or sent to the client by the route handler.
- `handler(request, reply)`: the function that will handle this request. The
  [Fastify server](./Server.md) will be bound to `this` when the handler is
  called. Note: using an arrow function will break the binding of `this`.
- `errorHandler(error, request, reply)`: a custom error handler for the scope of
  the request. Overrides the default error global handler, and anything set by
  [`setErrorHandler`](./Server.md#seterrorhandler), for requests to the route.
  To access the default handler, you can access `instance.errorHandler`. Note
  that this will point to fastify's default `errorHandler` only if a plugin
  hasn't overridden it already.
- `childLoggerFactory(logger, binding, opts, rawReq)`: a custom factory function
  that will be called to produce a child logger instance for every request.
  See [`childLoggerFactory`](./Server.md#childloggerfactory) for more info.
  Overrides the default logger factory, and anything set by
  [`setChildLoggerFactory`](./Server.md#setchildloggerfactory), for requests to
  the route. To access the default factory, you can access
  `instance.childLoggerFactory`. Note that this will point to Fastify's default
  `childLoggerFactory` only if a plugin hasn't overridden it already.
- `validatorCompiler({ schema, method, url, httpPart })`: function that builds
  schemas for request validations. See the [Validation and
  Serialization](./Validation-and-Serialization.md#schema-validator)
  documentation.
- `serializerCompiler({ { schema, method, url, httpStatus, contentType } })`:
  function that builds schemas for response serialization. See the [Validation and
  Serialization](./Validation-and-Serialization.md#schema-serializer)
  documentation.
- `schemaErrorFormatter(errors, dataVar)`: function that formats the errors from
  the validation compiler. See the [Validation and
  Serialization](./Validation-and-Serialization.md#error-handling)
  documentation. Overrides the global schema error formatter handler, and
  anything set by `setSchemaErrorFormatter`, for requests to the route.
- `bodyLimit`: prevents the default JSON body parser from parsing request bodies
  larger than this number of bytes. Must be an integer. You may also set this
  option globally when first creating the Fastify instance with
  `fastify(options)`. Defaults to `1048576` (1 MiB).
- `logLevel`: set log level for this route. See below.
- `logSerializers`: set serializers to log for this route.
- `config`: object used to store custom configuration.
- `version`: a [semver](https://semver.org/) compatible string that defined the
  version of the endpoint. [Example](#version-constraints).
- `constraints`: defines route restrictions based on request properties or
  values, enabling customized matching using
  [find-my-way](https://github.com/delvedor/find-my-way) constraints. Includes
  built-in `version` and `host` constraints, with support for custom constraint
  strategies.
- `prefixTrailingSlash`: string used to determine how to handle passing `/` as a
  route with a prefix.

  - `both` (default): Will register both `/prefix` and `/prefix/`.
  - `slash`: Will register only `/prefix/`.
  - `no-slash`: Will register only `/prefix`.

  Note: this option does not override `ignoreTrailingSlash` in
  [Server](./Server.md) configuration.

- `request` is defined in [Request](./Request.md).

- `reply` is defined in [Reply](./Reply.md).

> ℹ️ Note: The documentation for `onRequest`, `preParsing`, `preValidation`,
> `preHandler`, `preSerialization`, `onSend`, and `onResponse` is detailed in
> [Hooks](./Hooks.md). To send a response before the request is handled by the
> `handler`, see [Respond to a request from
> a hook](./Hooks.md#respond-to-a-request-from-a-hook).

Example:

```js
fastify.route({
  method: 'GET',
  url: '/',
  schema: {
    querystring: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        excitement: { type: 'integer' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          hello: { type: 'string' },
        },
      },
    },
  },
  handler: function (request, reply) {
    reply.send({ hello: 'world' });
  },
});
```

### Shorthand declaration

<a id="shorthand-declaration"></a>

The above route declaration is more _Hapi_-like, but if you prefer an
_Express/Restify_ approach, we support it as well:

`fastify.get(path, [options], handler)`

`fastify.head(path, [options], handler)`

`fastify.post(path, [options], handler)`

`fastify.put(path, [options], handler)`

`fastify.delete(path, [options], handler)`

`fastify.options(path, [options], handler)`

`fastify.patch(path, [options], handler)`

Example:

```js
const opts = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          hello: { type: 'string' },
        },
      },
    },
  },
};
fastify.get('/', opts, (request, reply) => {
  reply.send({ hello: 'world' });
});
```

`fastify.all(path, [options], handler)` will add the same handler to all the
supported methods.

The handler may also be supplied via the `options` object:

```js
const opts = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          hello: { type: 'string' },
        },
      },
    },
  },
  handler: function (request, reply) {
    reply.send({ hello: 'world' });
  },
};
fastify.get('/', opts);
```

> ℹ️ Note: Specifying the handler in both `options` and as the third parameter to
> the shortcut method throws a duplicate `handler` error.

### Url building

<a id="url-building"></a>

Fastify supports both static and dynamic URLs.

To register a **parametric** path, use a _colon_ before the parameter name. For
**wildcard**, use a _star_. Static routes are always checked before parametric
and wildcard routes.

```js
// parametric
fastify.get('/example/:userId', function (request, reply) {
  // curl ${app-url}/example/12345
  // userId === '12345'
  const { userId } = request.params;
  // your code here
});
fastify.get('/example/:userId/:secretToken', function (request, reply) {
  // curl ${app-url}/example/12345/abc.zHi
  // userId === '12345'
  // secretToken === 'abc.zHi'
  const { userId, secretToken } = request.params;
  // your code here
});

// wildcard
fastify.get('/example/*', function (request, reply) {});
```

Regular expression routes are supported, but slashes must be escaped.
Take note that RegExp is also very expensive in terms of performance!

```js
// parametric with regexp
fastify.get('/example/:file(^\\d+).png', function (request, reply) {
  // curl ${app-url}/example/12345.png
  // file === '12345'
  const { file } = request.params;
  // your code here
});
```

It is possible to define more than one parameter within the same couple of slash
("/"). Such as:

```js
fastify.get('/example/near/:lat-:lng/radius/:r', function (request, reply) {
  // curl ${app-url}/example/near/15°N-30°E/radius/20
  // lat === "15°N"
  // lng === "30°E"
  // r ==="20"
  const { lat, lng, r } = request.params;
  // your code here
});
```

_Remember in this case to use the dash ("-") as parameters separator._

Finally, it is possible to have multiple parameters with RegExp:

```js
fastify.get(
  '/example/at/:hour(^\\d{2})h:minute(^\\d{2})m',
  function (request, reply) {
    // curl ${app-url}/example/at/08h24m
    // hour === "08"
    // minute === "24"
    const { hour, minute } = request.params;
    // your code here
  }
);
```

In this case as parameter separator it is possible to use whatever character is
not matched by the regular expression.

The last parameter can be made optional by adding a question mark ("?") to the
end of the parameter name.

```js
fastify.get('/example/posts/:id?', function (request, reply) {
  const { id } = request.params;
  // your code here
});
```

In this case, `/example/posts` and `/example/posts/1` are both valid. The
optional param will be `undefined` if not specified.

Having a route with multiple parameters may negatively affect performance.
Prefer a single parameter approach, especially on routes that are on the hot
path of your application. For more details, see
[find-my-way](https://github.com/delvedor/find-my-way).

To include a colon in a path without declaring a parameter, use a double colon.
For example:

```js
fastify.post('/name::verb'); // will be interpreted as /name:verb
```

### Async Await

<a id="async-await"></a>

Are you an `async/await` user? We have you covered!

```js
fastify.get('/', options, async function (request, reply) {
  const data = await getData();
  const processed = await processData(data);
  return processed;
});
```

As shown, `reply.send` is not called to send data back to the user. Simply
return the body and you are done!

If needed, you can also send data back with `reply.send`. In this case, do not
forget to `return reply` or `await reply` in your `async` handler to avoid race
conditions.

```js
fastify.get('/', options, async function (request, reply) {
  const data = await getData();
  const processed = await processData(data);
  return reply.send(processed);
});
```

If the route is wrapping a callback-based API that will call `reply.send()`
outside of the promise chain, it is possible to `await reply`:

```js
fastify.get('/', options, async function (request, reply) {
  setImmediate(() => {
    reply.send({ hello: 'world' });
  });
  await reply;
});
```

Returning reply also works:

```js
fastify.get('/', options, async function (request, reply) {
  setImmediate(() => {
    reply.send({ hello: 'world' });
  });
  return reply;
});
```

> ⚠ Warning:
>
> - When using both `return value` and `reply.send(value)`, the first one takes
>   precedence, the second is discarded, and a _warn_ log is emitted.
> - Calling `reply.send()` outside of the promise is possible but requires special
>   attention. See [promise-resolution](#promise-resolution).
> - `undefined` cannot be returned. See [promise-resolution](#promise-resolution).

### Promise resolution

<a id="promise-resolution"></a>

If the handler is an `async` function or returns a promise, be aware of the
special behavior to support callback and promise control-flow. When the
handler's promise resolves, the reply is automatically sent with its value
unless you explicitly await or return `reply` in the handler.

1. If using `async/await` or promises but responding with `reply.send`:
   - **Do** `return reply` / `await reply`.
   - **Do not** forget to call `reply.send`.
2. If using `async/await` or promises:
   - **Do not** use `reply.send`.
   - **Do** return the value to send.

This approach supports both `callback-style` and `async-await` with minimal
trade-off. However, it is recommended to use only one style for consistent
error handling within your application.

> ℹ️ Note: Every async function returns a promise by itself.

### Route Prefixing

<a id="route-prefixing"></a>

Sometimes maintaining multiple versions of the same API is necessary. A common
approach is to prefix routes with the API version number, e.g., `/v1/user`.
Fastify offers a fast and smart way to create different versions of the same API
without changing all the route names by hand, called _route prefixing_. Here is
how it works:

```js
// server.js
const fastify = require('fastify')();

fastify.register(require('./routes/v1/users'), { prefix: '/v1' });
fastify.register(require('./routes/v2/users'), { prefix: '/v2' });

fastify.listen({ port: 3000 });
```

```js
// routes/v1/users.js
module.exports = function (fastify, opts, done) {
  fastify.get('/user', handler_v1);
  done();
};
```

```js
// routes/v2/users.js
module.exports = function (fastify, opts, done) {
  fastify.get('/user', handler_v2);
  done();
};
```

Fastify will not complain about using the same name for two different routes
because it handles the prefix automatically at compilation time. This ensures
performance is not affected.

Now clients will have access to the following routes:

- `/v1/user`
- `/v2/user`

This can be done multiple times and works for nested `register`. Route
parameters are also supported.

To use a prefix for all routes, place them inside a plugin:

```js
const fastify = require('fastify')();

const route = {
  method: 'POST',
  url: '/login',
  handler: () => {},
  schema: {},
};

fastify.register(
  function (app, _, done) {
    app.get('/users', () => {});
    app.route(route);

    done();
  },
  { prefix: '/v1' }
); // global route prefix

await fastify.listen({ port: 3000 });
```

### Route Prefixing and fastify-plugin

<a id="fastify-plugin"></a>

If using [`fastify-plugin`](https://github.com/fastify/fastify-plugin) to wrap
routes, this option will not work. To make it work, wrap a plugin in a plugin:

```js
const fp = require('fastify-plugin');
const routes = require('./lib/routes');

module.exports = fp(
  async function (app, opts) {
    app.register(routes, {
      prefix: '/v1',
    });
  },
  {
    name: 'my-routes',
  }
);
```

#### Handling of / route inside prefixed plugins

The `/` route behaves differently based on whether the prefix ends with `/`.
For example, with a prefix `/something/`, adding a `/` route matches only
`/something/`. With a prefix `/something`, adding a `/` route matches both
`/something` and `/something/`.

See the `prefixTrailingSlash` route option above to change this behavior.

### Custom Log Level

<a id="custom-log-level"></a>

Different log levels can be set for routes in Fastify by passing the `logLevel`
option to the plugin or route with the desired
[value](https://github.com/pinojs/pino/blob/master/docs/api.md#level-string).

Be aware that setting `logLevel` at the plugin level also affects
[`setNotFoundHandler`](./Server.md#setnotfoundhandler) and
[`setErrorHandler`](./Server.md#seterrorhandler).

```js
// server.js
const fastify = require('fastify')({ logger: true });

fastify.register(require('./routes/user'), { logLevel: 'warn' });
fastify.register(require('./routes/events'), { logLevel: 'debug' });

fastify.listen({ port: 3000 });
```

Or pass it directly to a route:

```js
fastify.get('/', { logLevel: 'warn' }, (request, reply) => {
  reply.send({ hello: 'world' });
});
```

_Remember that the custom log level applies only to routes, not to the global
Fastify Logger, accessible with `fastify.log`._

### Custom Log Serializer

<a id="custom-log-serializer"></a>

In some contexts, logging a large object may waste resources. Define custom
[`serializers`](https://github.com/pinojs/pino/blob/master/docs/api.md#serializers-object)
and attach them in the appropriate context.

```js
const fastify = require('fastify')({ logger: true });

fastify.register(require('./routes/user'), {
  logSerializers: {
    user: (value) => `My serializer one - ${value.name}`,
  },
});
fastify.register(require('./routes/events'), {
  logSerializers: {
    user: (value) => `My serializer two - ${value.name} ${value.surname}`,
  },
});

fastify.listen({ port: 3000 });
```

Serializers can be inherited by context:

```js
const fastify = Fastify({
  logger: {
    level: 'info',
    serializers: {
      user(req) {
        return {
          method: req.method,
          url: req.url,
          headers: req.headers,
          host: req.host,
          remoteAddress: req.ip,
          remotePort: req.socket.remotePort,
        };
      },
    },
  },
});

fastify.register(context1, {
  logSerializers: {
    user: (value) => `My serializer father - ${value}`,
  },
});

async function context1(fastify, opts) {
  fastify.get('/', (req, reply) => {
    req.log.info({ user: 'call father serializer', key: 'another key' });
    // shows: { user: 'My serializer father - call father  serializer', key: 'another key' }
    reply.send({});
  });
}

fastify.listen({ port: 3000 });
```

### Config

<a id="routes-config"></a>

Registering a new handler, you can pass a configuration object to it and
retrieve it in the handler.

```js
// server.js
const fastify = require('fastify')();

function handler(req, reply) {
  reply.send(reply.routeOptions.config.output);
}

fastify.get('/en', { config: { output: 'hello world!' } }, handler);
fastify.get('/it', { config: { output: 'ciao mondo!' } }, handler);

fastify.listen({ port: 3000 });
```

### Constraints

<a id="constraints"></a>

Fastify supports constraining routes to match certain requests based on
properties like the `Host` header or any other value via
[`find-my-way`](https://github.com/delvedor/find-my-way) constraints.
Constraints are specified in the `constraints` property of the route options.
Fastify has two built-in constraints: `version` and `host`. Custom constraint
strategies can be added to inspect other parts of a request to decide if a route
should be executed.

#### Version Constraints

You can provide a `version` key in the `constraints` option to a route.
Versioned routes allows multiple handlers to be declared for the same HTTP
route path, matched according to the request's `Accept-Version` header.
The `Accept-Version` header value should follow the
[semver](https://semver.org/) specification, and routes should be declared
with exact semver versions for matching.

Fastify will require a request `Accept-Version` header to be set if the route
has a version set, and will prefer a versioned route to a non-versioned route
for the same path. Advanced version ranges and pre-releases currently are not
supported.

_Be aware that using this feature will cause a degradation of the overall
performances of the router._

```js
fastify.route({
  method: 'GET',
  url: '/',
  constraints: { version: '1.2.0' },
  handler: function (request, reply) {
    reply.send({ hello: 'world' });
  },
});

fastify.inject(
  {
    method: 'GET',
    url: '/',
    headers: {
      'Accept-Version': '1.x', // it could also be '1.2.0' or '1.2.x'
    },
  },
  (err, res) => {
    // { hello: 'world' }
  }
);
```

> ⚠ Warning:
> Set a
> [`Vary`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary)
> header in responses with the value used for versioning
> (e.g., `'Accept-Version'`) to prevent cache poisoning attacks.
> This can also be configured in a Proxy/CDN.
>
> ```js
> const append = require('vary').append;
> fastify.addHook('onSend', (req, reply, payload, done) => {
>   if (req.headers['accept-version']) {
>     // or the custom header being used
>     let value = reply.getHeader('Vary') || '';
>     const header = Array.isArray(value) ? value.join(', ') : String(value);
>     if ((value = append(header, 'Accept-Version'))) {
>       // or the custom header being used
>       reply.header('Vary', value);
>     }
>   }
>   done();
> });
> ```

If multiple versions with the same major or minor are declared, Fastify will
always choose the highest compatible with the `Accept-Version` header value.

If the request lacks an `Accept-Version` header, a 404 error will be returned.

Custom version matching logic can be defined through the
[`constraints`](./Server.md#constraints) configuration when creating a Fastify
server instance.

#### Host Constraints

Provide a `host` key in the `constraints` route option to limit the route to
certain values of the request `Host` header. `host` constraint values can be
specified as strings for exact matches or RegExps for arbitrary host matching.

```js
fastify.route({
  method: 'GET',
  url: '/',
  constraints: { host: 'auth.fastify.dev' },
  handler: function (request, reply) {
    reply.send('hello world from auth.fastify.dev');
  },
});

fastify.inject(
  {
    method: 'GET',
    url: '/',
    headers: {
      Host: 'example.com',
    },
  },
  (err, res) => {
    // 404 because the host doesn't match the constraint
  }
);

fastify.inject(
  {
    method: 'GET',
    url: '/',
    headers: {
      Host: 'auth.fastify.dev',
    },
  },
  (err, res) => {
    // => 'hello world from auth.fastify.dev'
  }
);
```

RegExp `host` constraints can also be specified allowing constraining to hosts
matching wildcard subdomains (or any other pattern):

```js
fastify.route({
  method: 'GET',
  url: '/',
  constraints: { host: /.*\.fastify\.dev/ }, // will match any subdomain of fastify.dev
  handler: function (request, reply) {
    reply.send('hello world from ' + request.headers.host);
  },
});
```

#### Asynchronous Custom Constraints

Custom constraints can be provided, and the `constraint` criteria can be
fetched from another source such as a database. Use asynchronous custom
constraints as a last resort, as they impact router performance.

```js
function databaseOperation(field, done) {
  done(null, field);
}

const secret = {
  // strategy name for referencing in the route handler `constraints` options
  name: 'secret',
  // storage factory for storing routes in the find-my-way route tree
  storage: function () {
    let handlers = {};
    return {
      get: (type) => {
        return handlers[type] || null;
      },
      set: (type, store) => {
        handlers[type] = store;
      },
    };
  },
  // function to get the value of the constraint from each incoming request
  deriveConstraint: (req, ctx, done) => {
    databaseOperation(req.headers['secret'], done);
  },
  // optional flag marking if handlers without constraints can match requests that have a value for this constraint
  mustMatchWhenDerived: true,
};
```

> ⚠ Warning:
> When using asynchronous constraints, avoid returning errors inside the
> callback. If errors are unavoidable, provide a custom `frameworkErrors`
> handler to manage them. Otherwise, route selection may break or expose
> sensitive information.
>
> ```js
> const Fastify = require('fastify');
>
> const fastify = Fastify({
>   frameworkErrors: function (err, res, res) {
>     if (err instanceof Fastify.errorCodes.FST_ERR_ASYNC_CONSTRAINT) {
>       res.code(400);
>       return res.send('Invalid header provided');
>     } else {
>       res.send(err);
>     }
>   },
> });
> ```

## Factory

<a id="factory"></a>

The Fastify module exports a factory function that is used to create new
<code><b>Fastify server</b></code> instances. This factory function accepts an
options object which is used to customize the resulting instance. This document
describes the properties available in that options object.

- [Factory](#factory)
  - [`http`](#http)
  - [`http2`](#http2)
  - [`https`](#https)
  - [`connectionTimeout`](#connectiontimeout)
  - [`keepAliveTimeout`](#keepalivetimeout)
  - [`forceCloseConnections`](#forcecloseconnections)
  - [`maxRequestsPerSocket`](#maxrequestspersocket)
  - [`requestTimeout`](#requesttimeout)
  - [`ignoreTrailingSlash`](#ignoretrailingslash)
  - [`ignoreDuplicateSlashes`](#ignoreduplicateslashes)
  - [`maxParamLength`](#maxparamlength)
  - [`bodyLimit`](#bodylimit)
  - [`onProtoPoisoning`](#onprotopoisoning)
  - [`onConstructorPoisoning`](#onconstructorpoisoning)
  - [`logger`](#logger)
  - [`loggerInstance`](#loggerInstance)
  - [`disableRequestLogging`](#disablerequestlogging)
  - [`serverFactory`](#serverfactory)
  - [`caseSensitive`](#casesensitive)
  - [`allowUnsafeRegex`](#allowunsaferegex)
  - [`requestIdHeader`](#requestidheader)
  - [`requestIdLogLabel`](#requestidloglabel)
  - [`genReqId`](#genreqid)
  - [`trustProxy`](#trustproxy)
  - [`pluginTimeout`](#plugintimeout)
  - [`querystringParser`](#querystringparser)
  - [`exposeHeadRoutes`](#exposeheadroutes)
  - [`constraints`](#constraints)
  - [`return503OnClosing`](#return503onclosing)
  - [`ajv`](#ajv)
  - [`serializerOpts`](#serializeropts)
  - [`http2SessionTimeout`](#http2sessiontimeout)
  - [`frameworkErrors`](#frameworkerrors)
  - [`clientErrorHandler`](#clienterrorhandler)
  - [`rewriteUrl`](#rewriteurl)
  - [`useSemicolonDelimiter`](#usesemicolondelimiter)
  - [`allowErrorHandlerOverride`](#allowerrorhandleroverride)
- [Instance](#instance)
  - [Server Methods](#server-methods)
    - [server](#server)
    - [after](#after)
    - [ready](#ready)
    - [listen](#listen)
  - [`listenTextResolver`](#listentextresolver)
    - [addresses](#addresses)
    - [routing](#routing)
    - [route](#route)
    - [hasRoute](#hasroute)
    - [findRoute](#findroute)
    - [close](#close)
    - [decorate\*](#decorate)
    - [register](#register)
    - [addHook](#addhook)
    - [prefix](#prefix)
    - [pluginName](#pluginname)
    - [hasPlugin](#hasplugin)
  - [listeningOrigin](#listeningorigin)
    - [log](#log)
    - [version](#version)
    - [inject](#inject)
    - [addHttpMethod](#addHttpMethod)
    - [addSchema](#addschema)
    - [getSchemas](#getschemas)
    - [getSchema](#getschema)
    - [setReplySerializer](#setreplyserializer)
    - [setValidatorCompiler](#setvalidatorcompiler)
    - [setSchemaErrorFormatter](#setschemaerrorformatter)
    - [setSerializerCompiler](#setserializercompiler)
    - [validatorCompiler](#validatorcompiler)
    - [serializerCompiler](#serializercompiler)
    - [schemaErrorFormatter](#schemaerrorformatter)
    - [schemaController](#schemacontroller)
    - [setNotFoundHandler](#setnotfoundhandler)
    - [setErrorHandler](#seterrorhandler)
    - [setChildLoggerFactory](#setchildloggerfactory)
    - [setGenReqId](#setGenReqId)
    - [addConstraintStrategy](#addconstraintstrategy)
    - [hasConstraintStrategy](#hasconstraintstrategy)
    - [printRoutes](#printroutes)
    - [printPlugins](#printplugins)
    - [addContentTypeParser](#addcontenttypeparser)
    - [hasContentTypeParser](#hascontenttypeparser)
    - [removeContentTypeParser](#removecontenttypeparser)
    - [removeAllContentTypeParsers](#removeallcontenttypeparsers)
    - [getDefaultJsonParser](#getdefaultjsonparser)
    - [defaultTextParser](#defaulttextparser)
    - [errorHandler](#errorhandler)
    - [childLoggerFactory](#childloggerfactory)
    - [Symbol.asyncDispose](#symbolasyncdispose)
    - [initialConfig](#initialconfig)

### `http`

<a id="factory-http"></a>

- Default: `null`

An object used to configure the server's listening socket. The options
are the same as the Node.js core [`createServer`
method](https://nodejs.org/docs/latest-v20.x/api/http.html#httpcreateserveroptions-requestlistener).

This option is ignored if options [`http2`](#factory-http2) or
[`https`](#factory-https) are set.

### `http2`

<a id="factory-http2"></a>

- Default: `false`

If `true` Node.js core's
[HTTP/2](https://nodejs.org/dist/latest-v20.x/docs/api/http2.html) module is
used for binding the socket.

### `https`

<a id="factory-https"></a>

- Default: `null`

An object used to configure the server's listening socket for TLS. The options
are the same as the Node.js core [`createServer`
method](https://nodejs.org/dist/latest-v20.x/docs/api/https.html#https_https_createserver_options_requestlistener).
When this property is `null`, the socket will not be configured for TLS.

This option also applies when the [`http2`](#factory-http2) option is set.

### `connectionTimeout`

<a id="factory-connection-timeout"></a>

- Default: `0` (no timeout)

Defines the server timeout in milliseconds. See documentation for
[`server.timeout`
property](https://nodejs.org/api/http.html#http_server_timeout) to understand
the effect of this option.

When `serverFactory` option is specified this option is ignored.

### `keepAliveTimeout`

<a id="factory-keep-alive-timeout"></a>

- Default: `72000` (72 seconds)

Defines the server keep-alive timeout in milliseconds. See documentation for
[`server.keepAliveTimeout`
property](https://nodejs.org/api/http.html#http_server_keepalivetimeout) to
understand the effect of this option. This option only applies when HTTP/1 is in
use.

When `serverFactory` option is specified this option is ignored.

### `forceCloseConnections`

<a id="forcecloseconnections"></a>

- Default: `"idle"` if the HTTP server allows it, `false` otherwise

When set to `true`, upon [`close`](#close) the server will iterate the current
persistent connections and [destroy their
sockets](https://nodejs.org/dist/latest-v16.x/docs/api/net.html#socketdestroyerror).

> ⚠ Warning:
> Connections are not inspected to determine if requests have
> been completed.

Fastify will prefer the HTTP server's
[`closeAllConnections`](https://nodejs.org/dist/latest-v18.x/docs/api/http.html#servercloseallconnections)
method if supported, otherwise, it will use internal connection tracking.

When set to `"idle"`, upon [`close`](#close) the server will iterate the current
persistent connections which are not sending a request or waiting for a response
and destroy their sockets. The value is only supported if the HTTP server
supports the
[`closeIdleConnections`](https://nodejs.org/dist/latest-v18.x/docs/api/http.html#servercloseidleconnections)
method, otherwise attempting to set it will throw an exception.

### `maxRequestsPerSocket`

<a id="factory-max-requests-per-socket"></a>

- Default: `0` (no limit)

Defines the maximum number of requests a socket can handle before closing keep
alive connection. See [`server.maxRequestsPerSocket`
property](https://nodejs.org/dist/latest/docs/api/http.html#http_server_maxrequestspersocket)
to understand the effect of this option. This option only applies when HTTP/1.1
is in use. Also, when `serverFactory` option is specified, this option is
ignored.

> ℹ️ Note:
> At the time of writing, only node >= v16.10.0 supports this option.

### `requestTimeout`

<a id="factory-request-timeout"></a>

- Default: `0` (no limit)

Defines the maximum number of milliseconds for receiving the entire request from
the client. See [`server.requestTimeout`
property](https://nodejs.org/dist/latest/docs/api/http.html#http_server_requesttimeout)
to understand the effect of this option.

When `serverFactory` option is specified, this option is ignored.
It must be set to a non-zero value (e.g. 120 seconds) to protect against potential
Denial-of-Service attacks in case the server is deployed without a reverse proxy
in front.

> ℹ️ Note:
> At the time of writing, only node >= v14.11.0 supports this option

### `ignoreTrailingSlash`

<a id="factory-ignore-slash"></a>

- Default: `false`

Fastify uses [find-my-way](https://github.com/delvedor/find-my-way) to handle
routing. By default, Fastify will take into account the trailing slashes.
Paths like `/foo` and `/foo/` are treated as different paths. If you want to
change this, set this flag to `true`. That way, both `/foo` and `/foo/` will
point to the same route. This option applies to _all_ route registrations for
the resulting server instance.

```js
const fastify = require('fastify')({
  ignoreTrailingSlash: true,
});

// registers both "/foo" and "/foo/"
fastify.get('/foo/', function (req, reply) {
  reply.send('foo');
});

// registers both "/bar" and "/bar/"
fastify.get('/bar', function (req, reply) {
  reply.send('bar');
});
```

### `ignoreDuplicateSlashes`

<a id="factory-ignore-duplicate-slashes"></a>

- Default: `false`

Fastify uses [find-my-way](https://github.com/delvedor/find-my-way) to handle
routing. You can use `ignoreDuplicateSlashes` option to remove duplicate slashes
from the path. It removes duplicate slashes in the route path and the request
URL. This option applies to _all_ route registrations for the resulting server
instance.

When `ignoreTrailingSlash` and `ignoreDuplicateSlashes` are both set
to `true` Fastify will remove duplicate slashes, and then trailing slashes,
meaning `//a//b//c//` will be converted to `/a/b/c`.

```js
const fastify = require('fastify')({
  ignoreDuplicateSlashes: true,
});

// registers "/foo/bar/"
fastify.get('///foo//bar//', function (req, reply) {
  reply.send('foo');
});
```

### `maxParamLength`

<a id="factory-max-param-length"></a>

- Default: `100`

You can set a custom length for parameters in parametric (standard, regex, and
multi) routes by using `maxParamLength` option; the default value is 100
characters. If the maximum length limit is reached, the not found route will
be invoked.

This can be useful especially if you have a regex-based route, protecting you
against [ReDoS
attacks](https://www.owasp.org/index.php/Regular_expression_Denial_of_Service_-_ReDoS).

### `bodyLimit`

<a id="factory-body-limit"></a>

- Default: `1048576` (1MiB)

Defines the maximum payload, in bytes, the server is allowed to accept.
The default body reader sends [`FST_ERR_CTP_BODY_TOO_LARGE`](./Errors.md#fst_err_ctp_body_too_large)
reply, if the size of the body exceeds this limit.
If [`preParsing` hook](./Hooks.md#preparsing) is provided, this limit is applied
to the size of the stream the hook returns (i.e. the size of "decoded" body).

### `onProtoPoisoning`

<a id="factory-on-proto-poisoning"></a>

- Default: `'error'`

Defines what action the framework must take when parsing a JSON object with
`__proto__`. This functionality is provided by
[secure-json-parse](https://github.com/fastify/secure-json-parse). See
[Prototype Poisoning](../Guides/Prototype-Poisoning.md) for more details about
prototype poisoning attacks.

Possible values are `'error'`, `'remove'`, or `'ignore'`.

### `onConstructorPoisoning`

<a id="factory-on-constructor-poisoning"></a>

- Default: `'error'`

Defines what action the framework must take when parsing a JSON object with
`constructor`. This functionality is provided by
[secure-json-parse](https://github.com/fastify/secure-json-parse). See
[Prototype Poisoning](../Guides/Prototype-Poisoning.md) for more details about
prototype poisoning attacks.

Possible values are `'error'`, `'remove'`, or `'ignore'`.

### `logger`

<a id="factory-logger"></a>

Fastify includes built-in logging via the [Pino](https://getpino.io/) logger.
This property is used to configure the internal logger instance.

The possible values this property may have are:

- Default: `false`. The logger is disabled. All logging methods will point to a
  null logger [abstract-logging](https://npm.im/abstract-logging) instance.

- `object`: a standard Pino [options
  object](https://github.com/pinojs/pino/blob/c77d8ec5ce/docs/API.md#constructor).
  This will be passed directly to the Pino constructor. If the following
  properties are not present on the object, they will be added accordingly:
  - `level`: the minimum logging level. If not set, it will be set to
    `'info'`.
  - `serializers`: a hash of serialization functions. By default, serializers
    are added for `req` (incoming request objects), `res` (outgoing response
    objects), and `err` (standard `Error` objects). When a log method receives
    an object with any of these properties then the respective serializer will
    be used for that property. For example:
    ```js
    fastify.get('/foo', function (req, res) {
      req.log.info({ req }); // log the serialized request object
      res.send('foo');
    });
    ```
    Any user-supplied serializer will override the default serializer of the
    corresponding property.

### `loggerInstance`

<a id="factory-logger-instance"></a>

- Default: `null`

A custom logger instance. The logger must be a Pino instance or conform to the
Pino interface by having the following methods: `info`, `error`, `debug`,
`fatal`, `warn`, `trace`, `child`. For example:

```js
const pino = require('pino')();

const customLogger = {
  info: function (o, ...n) {},
  warn: function (o, ...n) {},
  error: function (o, ...n) {},
  fatal: function (o, ...n) {},
  trace: function (o, ...n) {},
  debug: function (o, ...n) {},
  child: function () {
    const child = Object.create(this);
    child.pino = pino.child(...arguments);
    return child;
  },
};

const fastify = require('fastify')({ logger: customLogger });
```

### `disableRequestLogging`

<a id="factory-disable-request-logging"></a>

- Default: `false`

When logging is enabled, Fastify will issue an `info` level log
message when a request is received and when the response for that request has
been sent. By setting this option to `true`, these log messages will be
disabled. This allows for more flexible request start and end logging by
attaching custom `onRequest` and `onResponse` hooks.

The other log entries that will be disabled are:

- an error log written by the default `onResponse` hook on reply callback errors
- the error and info logs written by the `defaultErrorHandler`
  on error management
- the info log written by the `fourOhFour` handler when a
  non existent route is requested

Other log messages emitted by Fastify will stay enabled,
like deprecation warnings and messages
emitted when requests are received while the server is closing.

```js
// Examples of hooks to replicate the disabled functionality.
fastify.addHook('onRequest', (req, reply, done) => {
  req.log.info({ url: req.raw.url, id: req.id }, 'received request');
  done();
});

fastify.addHook('onResponse', (req, reply, done) => {
  req.log.info(
    { url: req.raw.originalUrl, statusCode: reply.raw.statusCode },
    'request completed'
  );
  done();
});
```

### `serverFactory`

<a id="custom-http-server"></a>

You can pass a custom HTTP server to Fastify by using the `serverFactory`
option.

`serverFactory` is a function that takes a `handler` parameter, which takes the
`request` and `response` objects as parameters, and an options object, which is
the same you have passed to Fastify.

```js
const serverFactory = (handler, opts) => {
  const server = http.createServer((req, res) => {
    handler(req, res);
  });

  return server;
};

const fastify = Fastify({ serverFactory });

fastify.get('/', (req, reply) => {
  reply.send({ hello: 'world' });
});

fastify.listen({ port: 3000 });
```

Internally Fastify uses the API of Node core HTTP server, so if you are using a
custom server you must be sure to have the same API exposed. If not, you can
enhance the server instance inside the `serverFactory` function before the
`return` statement.

### `caseSensitive`

<a id="factory-case-sensitive"></a>

- Default: `true`

When `true` routes are registered as case-sensitive. That is, `/foo`
is not equal to `/Foo`.
When `false` then routes are case-insensitive.

Please note that setting this option to `false` goes against
[RFC3986](https://datatracker.ietf.org/doc/html/rfc3986#section-6.2.2.1).

By setting `caseSensitive` to `false`, all paths will be matched as lowercase,
but the route parameters or wildcards will maintain their original letter
casing.
This option does not affect query strings, please refer to
[`querystringParser`](#querystringparser) to change their handling.

```js
fastify.get('/user/:username', (request, reply) => {
  // Given the URL: /USER/NodeJS
  console.log(request.params.username); // -> 'NodeJS'
});
```

### `allowUnsafeRegex`

<a id="factory-allow-unsafe-regex"></a>

- Default `false`

Disabled by default, so routes only allow safe regular expressions. To use
unsafe expressions, set `allowUnsafeRegex` to `true`.

```js
fastify.get('/user/:id(^([0-9]+){4}$)', (request, reply) => {
  // Throws an error without allowUnsafeRegex = true
});
```

### `requestIdHeader`

<a id="factory-request-id-header"></a>

- Default: `'request-id'`

The header name used to set the request-id. See [the
request-id](./Logging.md#logging-request-id) section.
Setting `requestIdHeader` to `true` will set the `requestIdHeader` to
`"request-id"`.
Setting `requestIdHeader` to a non-empty string will use
the specified string as the `requestIdHeader`.
By default `requestIdHeader` is set to `false` and will immediately use [genReqId](#genreqid).
Setting `requestIdHeader` to an empty String (`""`) will set the
requestIdHeader to `false`.

- Default: `false`

```js
const fastify = require('fastify')({
  requestIdHeader: 'x-custom-id', // -> use 'X-Custom-Id' header if available
  //requestIdHeader: false, // -> always use genReqId
});
```

### `requestIdLogLabel`

<a id="factory-request-id-log-label"></a>

- Default: `'reqId'`

Defines the label used for the request identifier when logging the request.

### `genReqId`

<a id="factory-gen-request-id"></a>

- Default: `value of 'request-id' header if provided or monotonically increasing
integers`

Function for generating the request-id. It will receive the _raw_ incoming
request as a parameter. This function is expected to be error-free.

Especially in distributed systems, you may want to override the default ID
generation behavior as shown below. For generating `UUID`s you may want to check
out [hyperid](https://github.com/mcollina/hyperid).

> ℹ️ Note:
> `genReqId` will be not called if the header set in
> <code>[requestIdHeader](#requestidheader)</code> is available (defaults to
> 'request-id').

```js
let i = 0;
const fastify = require('fastify')({
  genReqId: function (req) {
    return i++;
  },
});
```

### `trustProxy`

<a id="factory-trust-proxy"></a>

- Default: `false`
- `true/false`: Trust all proxies (`true`) or do not trust any proxies
  (`false`).
- `string`: Trust only given IP/CIDR (e.g. `'127.0.0.1'`). May be a list of
  comma separated values (e.g. `'127.0.0.1,192.168.1.1/24'`).
- `Array<string>`: Trust only given IP/CIDR list (e.g. `['127.0.0.1']`).
- `number`: Trust the nth hop from the front-facing proxy server as the client.
- `Function`: Custom trust function that takes `address` as first argument
  ```js
  function myTrustFn(address, hop) {
    return address === '1.2.3.4' || hop === 1;
  }
  ```

By enabling the `trustProxy` option, Fastify will know that it is sitting behind
a proxy and that the `X-Forwarded-*` header fields may be trusted, which
otherwise may be easily spoofed.

```js
const fastify = Fastify({ trustProxy: true });
```

For more examples, refer to the
[`@fastify/proxy-addr`](https://www.npmjs.com/package/@fastify/proxy-addr) package.

You may access the `ip`, `ips`, `host` and `protocol` values on the
[`request`](./Request.md) object.

```js
fastify.get('/', (request, reply) => {
  console.log(request.ip);
  console.log(request.ips);
  console.log(request.host);
  console.log(request.protocol);
});
```

> ℹ️ Note:
> If a request contains multiple `x-forwarded-host` or `x-forwarded-proto`
> headers, it is only the last one that is used to derive `request.hostname`
> and `request.protocol`.

### `pluginTimeout`

<a id="plugin-timeout"></a>

- Default: `10000`

The maximum amount of time in _milliseconds_ in which a plugin can load. If not,
[`ready`](#ready) will complete with an `Error` with code
`'ERR_AVVIO_PLUGIN_TIMEOUT'`. When set to `0`, disables this check. This
controls [avvio](https://www.npmjs.com/package/avvio) 's `timeout` parameter.

### `querystringParser`

<a id="factory-querystring-parser"></a>

The default query string parser that Fastify uses is a more performant fork
of Node.js's core `querystring` module called
[`fast-querystring`](https://github.com/anonrig/fast-querystring).

You can use this option to use a custom parser, such as
[`qs`](https://www.npmjs.com/package/qs).

If you only want the keys (and not the values) to be case insensitive we
recommend using a custom parser to convert only the keys to lowercase.

```js
const qs = require('qs');
const fastify = require('fastify')({
  querystringParser: (str) => qs.parse(str),
});
```

You can also use Fastify's default parser but change some handling behavior,
like the example below for case insensitive keys and values:

```js
const querystring = require('fast-querystring');
const fastify = require('fastify')({
  querystringParser: (str) => querystring.parse(str.toLowerCase()),
});
```

### `exposeHeadRoutes`

<a id="exposeHeadRoutes"></a>

- Default: `true`

Automatically creates a sibling `HEAD` route for each `GET` route defined. If
you want a custom `HEAD` handler without disabling this option, make sure to
define it before the `GET` route.

### `constraints`

<a id="constraints"></a>

Fastify's built-in route constraints are provided by `find-my-way`, which
allows constraining routes by `version` or `host`. You can add new constraint
strategies, or override the built-in strategies, by providing a `constraints`
object with strategies for `find-my-way`. You can find more information on
constraint strategies in the
[find-my-way](https://github.com/delvedor/find-my-way) documentation.

```js
const customVersionStrategy = {
  storage: function () {
    const versions = {};
    return {
      get: (version) => {
        return versions[version] || null;
      },
      set: (version, store) => {
        versions[version] = store;
      },
    };
  },
  deriveVersion: (req, ctx) => {
    return req.headers['accept'];
  },
};

const fastify = require('fastify')({
  constraints: {
    version: customVersionStrategy,
  },
});
```

### `return503OnClosing`

<a id="factory-return-503-on-closing"></a>

- Default: `true`

Returns 503 after calling `close` server method. If `false`, the server routes
the incoming request as usual.

### `ajv`

<a id="factory-ajv"></a>

Configure the Ajv v8 instance used by Fastify without providing a custom one.
The default configuration is explained in the
[#schema-validator](./Validation-and-Serialization.md#schema-validator) section.

```js
const fastify = require('fastify')({
  ajv: {
    customOptions: {
      removeAdditional: 'all', // Refer to [ajv options](https://ajv.js.org/options.html#removeadditional)
    },
    plugins: [
      require('ajv-merge-patch'),
      [require('ajv-keywords'), 'instanceof'],
      // Usage: [plugin, pluginOptions] - Plugin with options
      // Usage: plugin - Plugin without options
    ],
  },
});
```

### `serializerOpts`

<a id="serializer-opts"></a>

Customize the options of the default
[`fast-json-stringify`](https://github.com/fastify/fast-json-stringify#options)
instance that serializes the response's payload:

```js
const fastify = require('fastify')({
  serializerOpts: {
    rounding: 'ceil',
  },
});
```

### `http2SessionTimeout`

<a id="http2-session-timeout"></a>

- Default: `72000`

Set a default
[timeout](https://nodejs.org/api/http2.html#http2sessionsettimeoutmsecs-callback)
to every incoming HTTP/2 session in milliseconds. The session will be closed on
the timeout.

This option is needed to offer a graceful "close" experience when using
HTTP/2. The low default has been chosen to mitigate denial of service attacks.
When the server is behind a load balancer or can scale automatically this value
can be increased to fit the use case. Node core defaults this to `0`.

### `frameworkErrors`

<a id="framework-errors"></a>

- Default: `null`

Fastify provides default error handlers for the most common use cases. It is
possible to override one or more of those handlers with custom code using this
option.

> ℹ️ Note:
> Only `FST_ERR_BAD_URL` and `FST_ERR_ASYNC_CONSTRAINT` are implemented at present.

```js
const fastify = require('fastify')({
  frameworkErrors: function (error, req, res) {
    if (error instanceof FST_ERR_BAD_URL) {
      res.code(400);
      return res.send('Provided url is not valid');
    } else if (error instanceof FST_ERR_ASYNC_CONSTRAINT) {
      res.code(400);
      return res.send('Provided header is not valid');
    } else {
      res.send(err);
    }
  },
});
```

### `clientErrorHandler`

<a id="client-error-handler"></a>

Set a
[clientErrorHandler](https://nodejs.org/api/http.html#http_event_clienterror)
that listens to `error` events emitted by client connections and responds with a
`400`.

It is possible to override the default `clientErrorHandler` using this option.

- Default:

```js
function defaultClientErrorHandler(err, socket) {
  if (err.code === 'ECONNRESET') {
    return;
  }

  const body = JSON.stringify({
    error: http.STATUS_CODES['400'],
    message: 'Client Error',
    statusCode: 400,
  });
  this.log.trace({ err }, 'client error');

  if (socket.writable) {
    socket.end(
      [
        'HTTP/1.1 400 Bad Request',
        `Content-Length: ${body.length}`,
        `Content-Type: application/json\r\n\r\n${body}`,
      ].join('\r\n')
    );
  }
}
```

> ℹ️ Note:
> `clientErrorHandler` operates with raw sockets. The handler is expected to
> return a properly formed HTTP response that includes a status line, HTTP headers
> and a message body. Before attempting to write the socket, the handler should
> check if the socket is still writable as it may have already been destroyed.

```js
const fastify = require('fastify')({
  clientErrorHandler: function (err, socket) {
    const body = JSON.stringify({
      error: {
        message: 'Client error',
        code: '400',
      },
    });

    // `this` is bound to fastify instance
    this.log.trace({ err }, 'client error');

    // the handler is responsible for generating a valid HTTP response
    socket.end(
      [
        'HTTP/1.1 400 Bad Request',
        `Content-Length: ${body.length}`,
        `Content-Type: application/json\r\n\r\n${body}`,
      ].join('\r\n')
    );
  },
});
```

### `rewriteUrl`

<a id="rewrite-url"></a>

Set a sync callback function that must return a string that allows rewriting
URLs. This is useful when you are behind a proxy that changes the URL.
Rewriting a URL will modify the `url` property of the `req` object.

Note that `rewriteUrl` is called _before_ routing, it is not encapsulated and it
is an instance-wide configuration.

```js
// @param {object} req The raw Node.js HTTP request, not the `FastifyRequest` object.
// @this Fastify The root Fastify instance (not an encapsulated instance).
// @returns {string} The path that the request should be mapped to.
function rewriteUrl(req) {
  if (req.url === '/hi') {
    this.log.debug({ originalUrl: req.url, url: '/hello' }, 'rewrite url');
    return '/hello';
  } else {
    return req.url;
  }
}
```

### `useSemicolonDelimiter`

<a id="use-semicolon-delimiter"></a>

- Default `false`

Fastify uses [find-my-way](https://github.com/delvedor/find-my-way) which supports,
separating the path and query string with a `;` character (code 59), e.g. `/dev;foo=bar`.
This decision originated from [delvedor/find-my-way#76]
(https://github.com/delvedor/find-my-way/issues/76). Thus, this option will support
backwards compatiblilty for the need to split on `;`. To enable support for splitting
on `;` set `useSemicolonDelimiter` to `true`.

```js
const fastify = require('fastify')({
  useSemicolonDelimiter: true,
});

fastify.get('/dev', async (request, reply) => {
  // An example request such as `/dev;foo=bar`
  // Will produce the following query params result `{ foo = 'bar' }`
  return request.query;
});
```

### `allowErrorHandlerOverride`

<a id="allow-error-handler-override"></a>

- **Default:** `true`

> ⚠ **Warning:** This option will be set to `false` by default
> in the next major release.

When set to `false`, it prevents `setErrorHandler` from being called
multiple times within the same scope, ensuring that the previous error
handler is not unintentionally overridden.

#### Example of incorrect usage:

```js
app.setErrorHandler(function freeSomeResources() {
  // Never executed, memory leaks
});

app.setErrorHandler(function anotherErrorHandler() {
  // Overrides the previous handler
});
```

## Instance

### Server Methods

#### server

<a id="server"></a>

`fastify.server`: The Node core
[server](https://nodejs.org/api/http.html#http_class_http_server) object as
returned by the [**`Fastify factory function`**](#factory).

> ⚠ Warning:
> If utilized improperly, certain Fastify features could be disrupted.
> It is recommended to only use it for attaching listeners.

#### after

<a id="after"></a>

Invoked when the current plugin and all the plugins that have been registered
within it have finished loading. It is always executed before the method
`fastify.ready`.

```js
fastify
  .register((instance, opts, done) => {
    console.log('Current plugin');
    done();
  })
  .after((err) => {
    console.log('After current plugin');
  })
  .register((instance, opts, done) => {
    console.log('Next plugin');
    done();
  })
  .ready((err) => {
    console.log('Everything has been loaded');
  });
```

In case `after()` is called without a function, it returns a `Promise`:

```js
fastify.register(async (instance, opts) => {
  console.log('Current plugin');
});

await fastify.after();
console.log('After current plugin');

fastify.register(async (instance, opts) => {
  console.log('Next plugin');
});

await fastify.ready();

console.log('Everything has been loaded');
```

#### ready

<a id="ready"></a>

Function called when all the plugins have been loaded. It takes an error
parameter if something went wrong.

```js
fastify.ready((err) => {
  if (err) throw err;
});
```

If it is called without any arguments, it will return a `Promise`:

```js
fastify.ready().then(
  () => {
    console.log('successfully booted!');
  },
  (err) => {
    console.log('an error happened', err);
  }
);
```

#### listen

<a id="listen"></a>

Starts the server and internally waits for the `.ready()` event. The signature
is `.listen([options][, callback])`. Both the `options` object and the
`callback` parameters extend the [Node.js
core](https://nodejs.org/api/net.html#serverlistenoptions-callback) options
object. Thus, all core options are available with the following additional
Fastify specific options:

### `listenTextResolver`

<a id="listen-text-resolver"></a>

Set an optional resolver for the text to log after server has been successfully
started.
It is possible to override the default `Server listening at [address]` log
entry using this option.

```js
server.listen({
  port: 9080,
  listenTextResolver: (address) => {
    return `Prometheus metrics server is listening at ${address}`;
  },
});
```

By default, the server will listen on the address(es) resolved by `localhost`
when no specific host is provided. If listening on any available interface is
desired, then specifying `0.0.0.0` for the address will listen on all IPv4
addresses. The address argument provided above will then return the first such
IPv4 address. The following table details the possible values for `host` when
targeting `localhost`, and what the result of those values for `host` will be.

| Host                                                                              | IPv4            | IPv6 |
| --------------------------------------------------------------------------------- | --------------- | ---- |
| `::`                                                                              | ✅<sup>\*</sup> | ✅   |
| `::` + [`ipv6Only`](https://nodejs.org/api/net.html#serverlistenoptions-callback) | 🚫              | ✅   |
| `0.0.0.0`                                                                         | ✅              | 🚫   |
| `localhost`                                                                       | ✅              | ✅   |
| `127.0.0.1`                                                                       | ✅              | 🚫   |
| `::1`                                                                             | 🚫              | ✅   |

<sup>\*</sup> Using `::` for the address will listen on all IPv6 addresses and,
depending on OS, may also listen on [all IPv4
addresses](https://nodejs.org/api/net.html#serverlistenport-host-backlog-callback).

Be careful when deciding to listen on all interfaces; it comes with inherent
[security
risks](https://web.archive.org/web/20170831174611/https://snyk.io/blog/mongodb-hack-and-secure-defaults/).

The default is to listen on `port: 0` (which picks the first available open
port) and `host: 'localhost'`:

```js
fastify.listen((err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
```

Specifying an address is also supported:

```js
fastify.listen({ port: 3000, host: '127.0.0.1' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
```

If no callback is provided a Promise is returned:

```js
fastify
  .listen({ port: 3000 })
  .then((address) => console.log(`server listening on ${address}`))
  .catch((err) => {
    console.log('Error starting server:', err);
    process.exit(1);
  });
```

When deploying to a Docker, and potentially other, containers, it is advisable
to listen on `0.0.0.0` because they do not default to exposing mapped ports to
`localhost`:

```js
fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
```

If the `port` is omitted (or is set to zero), a random available port is
automatically chosen (available via `fastify.server.address().port`).

The default options of listen are:

```js
fastify.listen(
  {
    port: 0,
    host: 'localhost',
    exclusive: false,
    readableAll: false,
    writableAll: false,
    ipv6Only: false,
  },
  (err) => {}
);
```

#### addresses

<a id="addresses"></a>

This method returns an array of addresses that the server is listening on. If
you call it before `listen()` is called or after the `close()` function, it will
return an empty array.

```js
await fastify.listen({ port: 8080 });
const addresses = fastify.addresses();
// [
//   { port: 8080, family: 'IPv6', address: '::1' },
//   { port: 8080, family: 'IPv4', address: '127.0.0.1' }
// ]
```

Note that the array contains the `fastify.server.address()` too.

#### routing

<a id="routing"></a>

Method to access the `lookup` method of the internal router and match the
request to the appropriate handler:

```js
fastify.routing(req, res);
```

#### route

<a id="route"></a>

Method to add routes to the server, it also has shorthand functions, check
[here](./Routes.md).

#### hasRoute

<a id="hasRoute"></a>

Method to check if a route is already registered to the internal router. It
expects an object as the payload. `url` and `method` are mandatory fields. It
is possible to also specify `constraints`. The method returns `true` if the
route is registered or `false` if not.

```js
const routeExists = fastify.hasRoute({
  url: '/',
  method: 'GET',
  constraints: { version: '1.0.0' }, // optional
});

if (routeExists === false) {
  // add route
}
```

#### findRoute

<a id="findRoute"></a>

Method to retrieve a route already registered to the internal router. It
expects an object as the payload. `url` and `method` are mandatory fields. It
is possible to also specify `constraints`.
The method returns a route object or `null` if the route cannot be found.

```js
const route = fastify.findRoute({
  url: '/artists/:artistId',
  method: 'GET',
  constraints: { version: '1.0.0' }, // optional
});

if (route !== null) {
  // perform some route checks
  console.log(route.params); // `{artistId: ':artistId'}`
}
```

#### close

<a id="close"></a>

`fastify.close(callback)`: call this function to close the server instance and
run the [`'onClose'`](./Hooks.md#on-close) hook.

Calling `close` will also cause the server to respond to every new incoming
request with a `503` error and destroy that request. See [`return503OnClosing`
flags](#factory-return-503-on-closing) for changing this behavior.

If it is called without any arguments, it will return a Promise:

```js
fastify.close().then(
  () => {
    console.log('successfully closed!');
  },
  (err) => {
    console.log('an error happened', err);
  }
);
```

#### decorate\*

<a id="decorate"></a>

Function useful if you need to decorate the fastify instance, Reply or Request,
check [here](./Decorators.md).

#### register

<a id="register"></a>

Fastify allows the user to extend its functionality with plugins. A plugin can
be a set of routes, a server decorator, or whatever, check [here](./Plugins.md).

#### addHook

<a id="addHook"></a>

Function to add a specific hook in the lifecycle of Fastify, check
[here](./Hooks.md).

#### prefix

<a id="prefix"></a>

The full path that will be prefixed to a route.

Example:

```js
fastify.register(
  function (instance, opts, done) {
    instance.get('/foo', function (request, reply) {
      // Will log "prefix: /v1"
      request.log.info('prefix: %s', instance.prefix);
      reply.send({ prefix: instance.prefix });
    });

    instance.register(
      function (instance, opts, done) {
        instance.get('/bar', function (request, reply) {
          // Will log "prefix: /v1/v2"
          request.log.info('prefix: %s', instance.prefix);
          reply.send({ prefix: instance.prefix });
        });

        done();
      },
      { prefix: '/v2' }
    );

    done();
  },
  { prefix: '/v1' }
);
```

#### pluginName

<a id="pluginName"></a>

Name of the current plugin. The root plugin is called `'fastify'`. There are
different ways to define a name (in order).

1. If you use [fastify-plugin](https://github.com/fastify/fastify-plugin) the
   metadata `name` is used.
2. If the exported plugin has the `Symbol.for('fastify.display-name')` property,
   then the value of that property is used.
   Example: `pluginFn[Symbol.for('fastify.display-name')] = "Custom Name"`
3. If you `module.exports` a plugin the filename is used.
4. If you use a regular [function
   declaration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions#Defining_functions)
   the function name is used.

_Fallback_: The first two lines of your plugin will represent the plugin name.
Newlines are replaced by `--`. This will help to identify the root cause when
you deal with many plugins.

> ⚠ Warning:
> If you have to deal with nested plugins, the name differs with the usage of
> the [fastify-plugin](https://github.com/fastify/fastify-plugin) because
> no new scope is created and therefore we have no place to attach contextual
> data. In that case, the plugin name will represent the boot order of all
> involved plugins in the format of `fastify -> plugin-A -> plugin-B`.

#### hasPlugin

<a id="hasPlugin"></a>

Method to check if a specific plugin has been registered. Relies on the plugin
metadata name. Returns `true` if the plugin is registered. Otherwise, returns
`false`.

```js
const fastify = require('fastify')();
fastify.register(require('@fastify/cookie'), {
  secret: 'my-secret',
  parseOptions: {},
});

fastify.ready(() => {
  fastify.hasPlugin('@fastify/cookie'); // true
});
```

### listeningOrigin

<a id="listeningOrigin"></a>

The current origin the server is listening to.
For example, a TCP socket based server returns
a base address like `http://127.0.0.1:3000`,
and a Unix socket server will return the socket
path, e.g. `fastify.temp.sock`.

#### log

<a id="log"></a>

The logger instance, check [here](./Logging.md).

#### version

<a id="version"></a>

Fastify version of the instance. Used for plugin support. See
[Plugins](./Plugins.md#handle-the-scope) for information on how the version is
used by plugins.

#### inject

<a id="inject"></a>

Fake HTTP injection (for testing purposes)
[here](../Guides/Testing.md#benefits-of-using-fastifyinject).

#### addHttpMethod

<a id="addHttpMethod"></a>

Fastify supports the `GET`, `HEAD`, `TRACE`, `DELETE`, `OPTIONS`,
`PATCH`, `PUT` and `POST` HTTP methods by default.
The `addHttpMethod` method allows to add any non standard HTTP
methods to the server that are [supported by Node.js](https://nodejs.org/api/http.html#httpmethods).

```js
// Add a new HTTP method called 'MKCOL' that supports a request body
fastify.addHttpMethod('MKCOL', { hasBody: true });

// Add a new HTTP method called 'COPY' that does not support a request body
fastify.addHttpMethod('COPY');
```

After calling `addHttpMethod`, it is possible to use the route shorthand
methods to define routes for the new HTTP method:

```js
fastify.addHttpMethod('MKCOL', { hasBody: true });
fastify.mkcol('/', (req, reply) => {
  // Handle the 'MKCOL' request
});
```

#### addSchema

<a id="add-schema"></a>

`fastify.addSchema(schemaObj)`, adds a JSON schema to the Fastify instance. This
allows you to reuse it everywhere in your application just by using the standard
`$ref` keyword.

To learn more, read the [Validation and
Serialization](./Validation-and-Serialization.md) documentation.

#### getSchemas

<a id="get-schemas"></a>

`fastify.getSchemas()`, returns a hash of all schemas added via `.addSchema`.
The keys of the hash are the `$id`s of the JSON Schema provided.

#### getSchema

<a id="get-schema"></a>

`fastify.getSchema(id)`, return the JSON schema added with `.addSchema` and the
matching `id`. It returns `undefined` if it is not found.

#### setReplySerializer

<a id="set-reply-serializer"></a>

Set the reply serializer for all the routes. This will be used as default if a
[Reply.serializer(func)](./Reply.md#serializerfunc) has not been set. The
handler is fully encapsulated, so different plugins can set different error
handlers. Note: the function parameter is called only for status `2xx`. Check
out the [`setErrorHandler`](#seterrorhandler) for errors.

```js
fastify.setReplySerializer(function (payload, statusCode) {
  // serialize the payload with a sync function
  return `my serialized ${statusCode} content: ${payload}`;
});
```

#### setValidatorCompiler

<a id="set-validator-compiler"></a>

Set the schema validator compiler for all routes. See
[#schema-validator](./Validation-and-Serialization.md#schema-validator).

#### setSchemaErrorFormatter

<a id="set-schema-error-formatter"></a>

Set the schema error formatter for all routes. See
[#error-handling](./Validation-and-Serialization.md#schemaerrorformatter).

#### setSerializerCompiler

<a id="set-serializer-resolver"></a>

Set the schema serializer compiler for all routes. See
[#schema-serializer](./Validation-and-Serialization.md#schema-serializer).

> ℹ️ Note:
> [`setReplySerializer`](#set-reply-serializer) has priority if set!

#### validatorCompiler

<a id="validator-compiler"></a>

This property can be used to get the schema validator. If not set, it will be
`null` until the server starts, then it will be a function with the signature
`function ({ schema, method, url, httpPart })` that returns the input `schema`
compiled to a function for validating data. The input `schema` can access all
the shared schemas added with [`.addSchema`](#add-schema) function.

#### serializerCompiler

<a id="serializer-compiler"></a>

This property can be used to get the schema serializer. If not set, it will be
`null` until the server starts, then it will be a function with the signature
`function ({ schema, method, url, httpPart })` that returns the input `schema`
compiled to a function for validating data. The input `schema` can access all
the shared schemas added with [`.addSchema`](#add-schema) function.

#### schemaErrorFormatter

<a id="schema-error-formatter"></a>

This property can be used to set a function to format errors that happen while
the `validationCompiler` fails to validate the schema. See
[#error-handling](./Validation-and-Serialization.md#schemaerrorformatter).

#### schemaController

<a id="schema-controller"></a>

This property can be used to fully manage:

- `bucket`: where the schemas of your application will be stored
- `compilersFactory`: what module must compile the JSON schemas

It can be useful when your schemas are stored in another data structure that is
unknown to Fastify.

Another use case is to tweak all the schemas processing. Doing so it is possible
to use Ajv v8 JTD or Standalone feature. To use such as JTD or the Standalone
mode, refers to the [`@fastify/ajv-compiler`
documentation](https://github.com/fastify/ajv-compiler#usage).

```js
const fastify = Fastify({
  schemaController: {
    /**
     * This factory is called whenever `fastify.register()` is called.
     * It may receive as input the schemas of the parent context if some schemas have been added.
     * @param {object} parentSchemas these schemas will be returned by the
     * `getSchemas()` method function of the returned `bucket`.
     */
    bucket: function factory(parentSchemas) {
      return {
        add(inputSchema) {
          // This function must store the schema added by the user.
          // This function is invoked when `fastify.addSchema()` is called.
        },
        getSchema(schema$id) {
          // This function must return the raw schema requested by the `schema$id`.
          // This function is invoked when `fastify.getSchema(id)` is called.
          return aSchema;
        },
        getSchemas() {
          // This function must return all the schemas referenced by the routes schemas' $ref
          // It must return a JSON where the property is the schema `$id` and the value is the raw JSON Schema.
          const allTheSchemaStored = {
            schema$id1: schema1,
            schema$id2: schema2,
          };
          return allTheSchemaStored;
        },
      };
    },

    /**
     * The compilers factory lets you fully control the validator and serializer
     * in the Fastify's lifecycle, providing the encapsulation to your compilers.
     */
    compilersFactory: {
      /**
       * This factory is called whenever a new validator instance is needed.
       * It may be called whenever `fastify.register()` is called only if new schemas have been added to the
       * encapsulation context.
       * It may receive as input the schemas of the parent context if some schemas have been added.
       * @param {object} externalSchemas these schemas will be returned by the
       * `bucket.getSchemas()`. Needed to resolve the external references $ref.
       * @param {object} ajvServerOption the server `ajv` options to build your compilers accordingly
       */
      buildValidator: function factory(externalSchemas, ajvServerOption) {
        // This factory function must return a schema validator compiler.
        // See [#schema-validator](./Validation-and-Serialization.md#schema-validator) for details.
        const yourAjvInstance = new Ajv(ajvServerOption.customOptions);
        return function validatorCompiler({ schema, method, url, httpPart }) {
          return yourAjvInstance.compile(schema);
        };
      },

      /**
       * This factory is called whenever a new serializer instance is needed.
       * It may be called whenever `fastify.register()` is called only if new schemas have been added to the
       * encapsulation context.
       * It may receive as input the schemas of the parent context if some schemas have been added.
       * @param {object} externalSchemas these schemas will be returned by the
       * `bucket.getSchemas()`. Needed to resolve the external references $ref.
       * @param {object} serializerOptsServerOption the server `serializerOpts`
       * options to build your compilers accordingly
       */
      buildSerializer: function factory(
        externalSchemas,
        serializerOptsServerOption
      ) {
        // This factory function must return a schema serializer compiler.
        // See [#schema-serializer](./Validation-and-Serialization.md#schema-serializer) for details.
        return function serializerCompiler({
          schema,
          method,
          url,
          httpStatus,
          contentType,
        }) {
          return (data) => JSON.stringify(data);
        };
      },
    },
  },
});
```

#### setNotFoundHandler

<a id="set-not-found-handler"></a>

`fastify.setNotFoundHandler(handler(request, reply))`: set the 404 handler. This
call is encapsulated by prefix, so different plugins can set different not found
handlers if a different [`prefix` option](./Plugins.md#route-prefixing-option)
is passed to `fastify.register()`. The handler is treated as a regular route
handler so requests will go through the full [Fastify
lifecycle](./Lifecycle.md#lifecycle). _async-await_ is supported as well.

You can also register [`preValidation`](./Hooks.md#route-hooks) and
[`preHandler`](./Hooks.md#route-hooks) hooks for the 404 handler.

> ℹ️ Note:
> The `preValidation` hook registered using this method will run for a
> route that Fastify does not recognize and **not** when a route handler manually
> calls [`reply.callNotFound`](./Reply.md#call-not-found). In which case, only
> preHandler will be run.

```js
fastify.setNotFoundHandler(
  {
    preValidation: (req, reply, done) => {
      // your code
      done();
    },
    preHandler: (req, reply, done) => {
      // your code
      done();
    },
  },
  function (request, reply) {
    // Default not found handler with preValidation and preHandler hooks
  }
);

fastify.register(
  function (instance, options, done) {
    instance.setNotFoundHandler(function (request, reply) {
      // Handle not found request without preValidation and preHandler hooks
      // to URLs that begin with '/v1'
    });
    done();
  },
  { prefix: '/v1' }
);
```

Fastify calls setNotFoundHandler to add a default 404 handler at startup before
plugins are registered. If you would like to augment the behavior of the default
404 handler, for example with plugins, you can call setNotFoundHandler with no
arguments `fastify.setNotFoundHandler()` within the context of these registered
plugins.

> ℹ️ Note:
> Some config properties from the request object will be
> undefined inside the custom not found handler. E.g.:
> `request.routeOptions.url`, `routeOptions.method` and `routeOptions.config`.
> This method design goal is to allow calling the common not found route.
> To return a per-route customized 404 response, you can do it in
> the response itself.

#### setErrorHandler

<a id="set-error-handler"></a>

`fastify.setErrorHandler(handler(error, request, reply))`: Set a function that
will be invoked whenever an exception is thrown during the request lifecycle.
The handler is bound to the Fastify instance and is fully encapsulated, so
different plugins can set different error handlers. _async-await_ is
supported as well.

If the error `statusCode` is less than 400, Fastify will automatically
set it to 500 before calling the error handler.

`setErrorHandler` will **_not_** catch:

- exceptions thrown in an `onResponse` hook because the response has already been
  sent to the client. Use the `onSend` hook instead.
- not found (404) errors. Use [`setNotFoundHandler`](#set-not-found-handler)
  instead.

```js
fastify.setErrorHandler(function (error, request, reply) {
  // Log error
  this.log.error(error);
  // Send error response
  reply.status(409).send({ ok: false });
});
```

Fastify is provided with a default function that is called if no error handler
is set. It can be accessed using `fastify.errorHandler` and it logs the error
with respect to its `statusCode`.

```js
const statusCode = error.statusCode;
if (statusCode >= 500) {
  log.error(error);
} else if (statusCode >= 400) {
  log.info(error);
} else {
  log.error(error);
}
```

> ⚠ Warning:
> Avoid calling setErrorHandler multiple times in the same scope.
> See [`allowErrorHandlerOverride`](#allowerrorhandleroverride).

#### setChildLoggerFactory

<a id="set-child-logger-factory"></a>

`fastify.setChildLoggerFactory(factory(logger, bindings, opts, rawReq))`: Set a
function that will be called when creating a child logger instance for each request
which allows for modifying or adding child logger bindings and logger options, or
returning a custom child logger implementation.

Child logger bindings have a performance advantage over per-log bindings because
they are pre-serialized by Pino when the child logger is created.

The first parameter is the parent logger instance, followed by the default bindings
and logger options which should be passed to the child logger, and finally
the raw request (not a Fastify request object). The function is bound with `this`
being the Fastify instance.

For example:

```js
const fastify = require('fastify')({
  childLoggerFactory: function (logger, bindings, opts, rawReq) {
    // Calculate additional bindings from the request if needed
    bindings.traceContext = rawReq.headers['x-cloud-trace-context'];
    return logger.child(bindings, opts);
  },
});
```

The handler is bound to the Fastify instance and is fully encapsulated, so
different plugins can set different logger factories.

#### setGenReqId

<a id="set-gen-req-id"></a>

`fastify.setGenReqId(function (rawReq))` Synchronous function for setting the request-id
for additional Fastify instances. It will receive the _raw_ incoming request as a
parameter. The provided function should not throw an Error in any case.

Especially in distributed systems, you may want to override the default ID
generation behavior to handle custom ways of generating different IDs in
order to handle different use cases. Such as observability or webhooks plugins.

For example:

```js
const fastify = require('fastify')({
  genReqId: (req) => {
    return 'base';
  },
});

fastify.register(
  (instance, opts, done) => {
    instance.setGenReqId((req) => {
      // custom request ID for `/webhooks`
      return 'webhooks-id';
    });
    done();
  },
  { prefix: '/webhooks' }
);

fastify.register(
  (instance, opts, done) => {
    instance.setGenReqId((req) => {
      // custom request ID for `/observability`
      return 'observability-id';
    });
    done();
  },
  { prefix: '/observability' }
);
```

The handler is bound to the Fastify instance and is fully encapsulated, so
different plugins can set a different request ID.

#### addConstraintStrategy

<a id="addConstraintStrategy"></a>

Function to add a custom constraint strategy. To register a new type of
constraint, you must add a new constraint strategy that knows how to match
values to handlers, and that knows how to get the constraint value from a
request.

Add a custom constraint strategy using the `fastify.addConstraintStrategy`
method:

```js
const customResponseTypeStrategy = {
  // strategy name for referencing in the route handler `constraints` options
  name: 'accept',
  // storage factory for storing routes in the find-my-way route tree
  storage: function () {
    let handlers = {};
    return {
      get: (type) => {
        return handlers[type] || null;
      },
      set: (type, store) => {
        handlers[type] = store;
      },
    };
  },
  // function to get the value of the constraint from each incoming request
  deriveConstraint: (req, ctx) => {
    return req.headers['accept'];
  },
  // optional flag marking if handlers without constraints can match requests that have a value for this constraint
  mustMatchWhenDerived: true,
};

const router = Fastify();
router.addConstraintStrategy(customResponseTypeStrategy);
```

#### hasConstraintStrategy

<a id="hasConstraintStrategy"></a>

The `fastify.hasConstraintStrategy(strategyName)` checks if there already exists
a custom constraint strategy with the same name.

#### printRoutes

<a id="print-routes"></a>

`fastify.printRoutes()`: Fastify router builds a tree of routes for each HTTP
method. If you call the prettyPrint without specifying an HTTP method, it will
merge all the trees into one and print it. The merged tree doesn't represent the
internal router structure. **Do not use it for debugging.**

_Remember to call it inside or after a `ready` call._

```js
fastify.get('/test', () => {});
fastify.get('/test/hello', () => {});
fastify.get('/testing', () => {});
fastify.get('/testing/:param', () => {});
fastify.put('/update', () => {});

fastify.ready(() => {
  console.log(fastify.printRoutes());
  // └── /
  //     ├── test (GET)
  //     │   ├── /hello (GET)
  //     │   └── ing (GET)
  //     │       └── /
  //     │           └── :param (GET)
  //     └── update (PUT)
});
```

If you want to print the internal router tree, you should specify the `method`
param. Printed tree will represent the internal router structure.
**You can use it for debugging.**

```js
console.log(fastify.printRoutes({ method: 'GET' }));
// └── /
//     └── test (GET)
//         ├── /hello (GET)
//         └── ing (GET)
//             └── /
//                 └── :param (GET)

console.log(fastify.printRoutes({ method: 'PUT' }));
// └── /
//     └── update (PUT)
```

`fastify.printRoutes({ commonPrefix: false })` will print compressed trees. This
may be useful when you have a large number of routes with common prefixes.
It doesn't represent the internal router structure. **Do not use it for debugging.**

```js
console.log(fastify.printRoutes({ commonPrefix: false }));
// ├── /test (GET)
// │   ├── /hello (GET)
// │   └── ing (GET)
// │       └── /:param (GET)
// └── /update (PUT)
```

`fastify.printRoutes({ includeMeta: (true | []) })` will display properties from
the `route.store` object for each displayed route. This can be an `array` of
keys (e.g. `['onRequest', Symbol('key')]`), or `true` to display all properties.
A shorthand option, `fastify.printRoutes({ includeHooks: true })` will include
all [hooks](./Hooks.md).

```js
fastify.get('/test', () => {});
fastify.get('/test/hello', () => {});

const onTimeout = () => {};

fastify.addHook('onRequest', () => {});
fastify.addHook('onTimeout', onTimeout);

console.log(
  fastify.printRoutes({ includeHooks: true, includeMeta: ['errorHandler'] })
);
// └── /
//     └── test (GET)
//         • (onTimeout) ["onTimeout()"]
//         • (onRequest) ["anonymous()"]
//         • (errorHandler) "defaultErrorHandler()"
//         test (HEAD)
//         • (onTimeout) ["onTimeout()"]
//         • (onRequest) ["anonymous()"]
//         • (onSend) ["headRouteOnSendHandler()"]
//         • (errorHandler) "defaultErrorHandler()"
//         └── /hello (GET)
//             • (onTimeout) ["onTimeout()"]
//             • (onRequest) ["anonymous()"]
//             • (errorHandler) "defaultErrorHandler()"
//             /hello (HEAD)
//             • (onTimeout) ["onTimeout()"]
//             • (onRequest) ["anonymous()"]
//             • (onSend) ["headRouteOnSendHandler()"]
//             • (errorHandler) "defaultErrorHandler()"

console.log(fastify.printRoutes({ includeHooks: true }));
// └── /
//     └── test (GET)
//         • (onTimeout) ["onTimeout()"]
//         • (onRequest) ["anonymous()"]
//         test (HEAD)
//         • (onTimeout) ["onTimeout()"]
//         • (onRequest) ["anonymous()"]
//         • (onSend) ["headRouteOnSendHandler()"]
//         └── /hello (GET)
//             • (onTimeout) ["onTimeout()"]
//             • (onRequest) ["anonymous()"]
//             /hello (HEAD)
//             • (onTimeout) ["onTimeout()"]
//             • (onRequest) ["anonymous()"]
//             • (onSend) ["headRouteOnSendHandler()"]
```

#### printPlugins

<a id="print-plugins"></a>

`fastify.printPlugins()`: Prints the representation of the internal plugin tree
used by the avvio, useful for debugging require order issues.

_Remember to call it inside or after a `ready` call._

```js
fastify.register(async function foo(instance) {
  instance.register(async function bar() {});
});
fastify.register(async function baz() {});

fastify.ready(() => {
  console.error(fastify.printPlugins());
  // will output the following to stderr:
  // └── root
  //     ├── foo
  //     │   └── bar
  //     └── baz
});
```

#### addContentTypeParser

<a id="addContentTypeParser"></a>

`fastify.addContentTypeParser(content-type, options, parser)` is used to pass
a custom parser for a given content type. Useful for adding parsers for custom
content types, e.g. `text/json, application/vnd.oasis.opendocument.text`.
`content-type` can be a string, string array or RegExp.

```js
// The two arguments passed to getDefaultJsonParser are for ProtoType poisoning
// and Constructor Poisoning configuration respectively. The possible values are
// 'ignore', 'remove', 'error'. ignore  skips all validations and it is similar
// to calling JSON.parse() directly. See the
// [`secure-json-parse` documentation](https://github.com/fastify/secure-json-parse#api) for more information.

fastify.addContentTypeParser(
  'text/json',
  { asString: true },
  fastify.getDefaultJsonParser('ignore', 'ignore')
);
```

#### hasContentTypeParser

<a id="hasContentTypeParser"></a>

`fastify.hasContentTypeParser(contentType)` is used to check whether there is a
content type parser in the current context for the specified content type.

```js
fastify.hasContentTypeParser('text/json');

fastify.hasContentTypeParser(/^.+\/json$/);
```

#### removeContentTypeParser

<a id="removeContentTypeParser"></a>

`fastify.removeContentTypeParser(contentType)` is used to remove content type
parsers in the current context. This method allows for example to remove the
both built-in parsers for `application/json` and `text/plain`.

```js
fastify.removeContentTypeParser('application/json');

fastify.removeContentTypeParser(['application/json', 'text/plain']);
```

#### removeAllContentTypeParsers

<a id="removeAllContentTypeParsers"></a>

The `fastify.removeAllContentTypeParsers()` method allows all content type
parsers in the current context to be removed. A use case of this method is the
implementation of catch-all content type parser. Before adding this parser with
`fastify.addContentTypeParser()` one could call the
`removeAllContentTypeParsers` method.

For more details about the usage of the different content type parser APIs see
[here](./ContentTypeParser.md#usage).

#### getDefaultJsonParser

<a id="getDefaultJsonParser"></a>

`fastify.getDefaultJsonParser(onProtoPoisoning, onConstructorPoisoning)` takes
two arguments. First argument is ProtoType poisoning configuration and second
argument is constructor poisoning configuration. See the [`secure-json-parse`
documentation](https://github.com/fastify/secure-json-parse#api) for more
information.

#### defaultTextParser

<a id="defaultTextParser"></a>

`fastify.defaultTextParser()` can be used to parse content as plain text.

```js
fastify.addContentTypeParser(
  'text/json',
  { asString: true },
  fastify.defaultTextParser
);
```

#### errorHandler

<a id="errorHandler"></a>

`fastify.errorHandler` can be used to handle errors using fastify's default
error handler.

```js
fastify.get(
  '/',
  {
    errorHandler: (error, request, reply) => {
      if (error.code === 'SOMETHING_SPECIFIC') {
        reply.send({ custom: 'response' });
        return;
      }

      fastify.errorHandler(error, request, response);
    },
  },
  handler
);
```

#### childLoggerFactory

<a id="childLoggerFactory"></a>

`fastify.childLoggerFactory` returns the custom logger factory function for the
Fastify instance. See the [`childLoggerFactory` config option](#setchildloggerfactory)
for more info.

#### Symbol.asyncDispose

<a id="symbolAsyncDispose"></a>

`fastify[Symbol.asyncDispose]` is a symbol that can be used to define an
asynchronous function that will be called when the Fastify instance is closed.

It's commonly used alongside the `using` TypeScript keyword to ensure that
resources are cleaned up when the Fastify instance is closed.

This combines perfectly inside short lived processes or unit tests, where you must
close all Fastify resources after returning from inside the function.

```ts
test('Uses app and closes it afterwards', async () => {
  await using app = fastify();
  // do something with app.
})
```

In the above example, Fastify is closed automatically after the test finishes.

Read more about the
[ECMAScript Explicit Resource Management](https://tc39.es/proposal-explicit-resource-management)
and the [using keyword](https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/)
introduced in TypeScript 5.2.

#### initialConfig

<a id="initial-config"></a>

`fastify.initialConfig`: Exposes a frozen read-only object registering the
initial options passed down by the user to the Fastify instance.

The properties that can currently be exposed are:

- connectionTimeout
- keepAliveTimeout
- bodyLimit
- caseSensitive
- allowUnsafeRegex
- http2
- https (it will return `false`/`true` or `{ allowHTTP1: true/false }` if
  explicitly passed)
- ignoreTrailingSlash
- disableRequestLogging
- maxParamLength
- onProtoPoisoning
- onConstructorPoisoning
- pluginTimeout
- requestIdHeader
- requestIdLogLabel
- http2SessionTimeout
- useSemicolonDelimiter

```js
const { readFileSync } = require('node:fs');
const Fastify = require('fastify');

const fastify = Fastify({
  https: {
    allowHTTP1: true,
    key: readFileSync('./fastify.key'),
    cert: readFileSync('./fastify.cert'),
  },
  logger: { level: 'trace' },
  ignoreTrailingSlash: true,
  maxParamLength: 200,
  caseSensitive: true,
  trustProxy: '127.0.0.1,192.168.1.1/24',
});

console.log(fastify.initialConfig);
/*
will log :
{
  caseSensitive: true,
  https: { allowHTTP1: true },
  ignoreTrailingSlash: true,
  maxParamLength: 200
}
*/

fastify.register(async (instance, opts) => {
  instance.get('/', async (request, reply) => {
    return instance.initialConfig;
    /*
    will return :
    {
      caseSensitive: true,
      https: { allowHTTP1: true },
      ignoreTrailingSlash: true,
      maxParamLength: 200
    }
    */
  });

  instance.get('/error', async (request, reply) => {
    // will throw an error because initialConfig is read-only
    // and can not be modified
    instance.initialConfig.https.allowHTTP1 = false;

    return instance.initialConfig;
  });
});

// Start listening.
fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
```

## Type Providers

Type Providers are a TypeScript feature that enables Fastify to infer type
information from inline JSON Schema. They are an alternative to specifying
generic arguments on routes and can reduce the need to keep associated types for
each schema in a project.

### Providers

Official Type Provider packages follow the
`@fastify/type-provider-{provider-name}` naming convention.
Several community providers are also available.

The following inference packages are supported:

- [`json-schema-to-ts`](https://github.com/ThomasAribart/json-schema-to-ts)
- [`typebox`](https://github.com/sinclairzx81/typebox)
- [`zod`](https://github.com/colinhacks/zod)

See also the Type Provider wrapper packages for each of the packages respectively:

- [`@fastify/type-provider-json-schema-to-ts`](https://github.com/fastify/fastify-type-provider-json-schema-to-ts)
- [`@fastify/type-provider-typebox`](https://github.com/fastify/fastify-type-provider-typebox)
- [`fastify-type-provider-zod`](https://github.com/turkerdev/fastify-type-provider-zod)
  (3rd party)

### Json Schema to Ts

The following sets up a `json-schema-to-ts` Type Provider:

```bash
$ npm i @fastify/type-provider-json-schema-to-ts
```

```typescript
import fastify from 'fastify';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';

const server = fastify().withTypeProvider<JsonSchemaToTsProvider>();

server.get(
  '/route',
  {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          foo: { type: 'number' },
          bar: { type: 'string' },
        },
        required: ['foo', 'bar'],
      },
    },
  },
  (request, reply) => {
    // type Query = { foo: number, bar: string }
    const { foo, bar } = request.query; // type safe!
  }
);
```

### TypeBox

The following sets up a TypeBox Type Provider:

```bash
$ npm i @fastify/type-provider-typebox
```

```typescript
import fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

const server = fastify().withTypeProvider<TypeBoxTypeProvider>();

server.get(
  '/route',
  {
    schema: {
      querystring: Type.Object({
        foo: Type.Number(),
        bar: Type.String(),
      }),
    },
  },
  (request, reply) => {
    // type Query = { foo: number, bar: string }
    const { foo, bar } = request.query; // type safe!
  }
);
```

See the [TypeBox
documentation](https://github.com/sinclairzx81/typebox#validation)
for setting up AJV to work with TypeBox.

### Zod

See [official documentation](https://github.com/turkerdev/fastify-type-provider-zod)
for Zod Type Provider instructions.

### Scoped Type-Provider

The provider types don't propagate globally. In encapsulated usage, one can
remap the context to use one or more providers (for example, `typebox` and
`json-schema-to-ts` can be used in the same application).

Example:

```ts
import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { Type } from '@sinclair/typebox';

const fastify = Fastify();

function pluginWithTypebox(fastify: FastifyInstance, _opts, done): void {
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    '/',
    {
      schema: {
        body: Type.Object({
          x: Type.String(),
          y: Type.Number(),
          z: Type.Boolean(),
        }),
      },
    },
    (req) => {
      const { x, y, z } = req.body; // type safe
    }
  );
  done();
}

function pluginWithJsonSchema(fastify: FastifyInstance, _opts, done): void {
  fastify.withTypeProvider<JsonSchemaToTsProvider>().get(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            x: { type: 'string' },
            y: { type: 'number' },
            z: { type: 'boolean' },
          },
        },
      },
    },
    (req) => {
      const { x, y, z } = req.body; // type safe
    }
  );
  done();
}

fastify.register(pluginWithJsonSchema);
fastify.register(pluginWithTypebox);
```

It is important to note that since the types do not propagate globally, it is
currently not possible to avoid multiple registrations on routes when dealing
with several scopes, as shown below:

```ts
import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

const server = Fastify().withTypeProvider<TypeBoxTypeProvider>();

server.register(plugin1); // wrong
server.register(plugin2); // correct

function plugin1(fastify: FastifyInstance, _opts, done): void {
  fastify.get(
    '/',
    {
      schema: {
        body: Type.Object({
          x: Type.String(),
          y: Type.Number(),
          z: Type.Boolean(),
        }),
      },
    },
    (req) => {
      // In a new scope, call `withTypeProvider` again to ensure it works
      const { x, y, z } = req.body;
    }
  );
  done();
}

function plugin2(fastify: FastifyInstance, _opts, done): void {
  const server = fastify.withTypeProvider<TypeBoxTypeProvider>();

  server.get(
    '/',
    {
      schema: {
        body: Type.Object({
          x: Type.String(),
          y: Type.Number(),
          z: Type.Boolean(),
        }),
      },
    },
    (req) => {
      // works
      const { x, y, z } = req.body;
    }
  );
  done();
}
```

### Type Definition of FastifyInstance + TypeProvider

When working with modules, use `FastifyInstance` with Type Provider generics.
See the example below:

```ts
// index.ts
import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { registerRoutes } from './routes';

const server = Fastify().withTypeProvider<TypeBoxTypeProvider>();

registerRoutes(server);

server.listen({ port: 3000 });
```

```ts
// routes.ts
import { Type } from '@sinclair/typebox';
import {
  FastifyInstance,
  FastifyBaseLogger,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

type FastifyTypebox = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  FastifyBaseLogger,
  TypeBoxTypeProvider
>;

export function registerRoutes(fastify: FastifyTypebox): void {
  fastify.get(
    '/',
    {
      schema: {
        body: Type.Object({
          x: Type.String(),
          y: Type.Number(),
          z: Type.Boolean(),
        }),
      },
    },
    (req) => {
      // works
      const { x, y, z } = req.body;
    }
  );
}
```

## TypeScript

The Fastify framework is written in vanilla JavaScript, and as such type
definitions are not as easy to maintain; however, since version 2 and beyond,
maintainers and contributors have put in a great effort to improve the types.

The type system was changed in Fastify version 3. The new type system introduces
generic constraining and defaulting, plus a new way to define schema types such
as a request body, querystring, and more! As the team works on improving
framework and type definition synergy, sometimes parts of the API will not be
typed or may be typed incorrectly. We encourage you to **contribute** to help us
fill in the gaps. Just make sure to read our
[`CONTRIBUTING.md`](https://github.com/fastify/fastify/blob/main/CONTRIBUTING.md)
file before getting started to make sure things go smoothly!

> The documentation in this section covers Fastify version 3.x typings

> Plugins may or may not include typings. See [Plugins](#plugins) for more
> information. We encourage users to send pull requests to improve typings
> support.

🚨 Don't forget to install `@types/node`

## Learn By Example

The best way to learn the Fastify type system is by example! The following four
examples should cover the most common Fastify development cases. After the
examples there is further, more detailed documentation for the type system.

### Getting Started

This example will get you up and running with Fastify and TypeScript. It results
in a blank http Fastify server.

1. Create a new npm project, install Fastify, and install typescript & Node.js
   types as peer dependencies:

```bash
npm init -y
npm i fastify
npm i -D typescript @types/node
```

2. Add the following lines to the `"scripts"` section of the `package.json`:

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node index.js"
  }
}
```

3. Initialize a TypeScript configuration file:

```bash
npx tsc --init
```

or use one of the [recommended
ones](https://github.com/tsconfig/bases#node-14-tsconfigjson).

_Note: Set `target` property in `tsconfig.json` to `es2017` or greater to avoid
[FastifyDeprecation](https://github.com/fastify/fastify/issues/3284) warning._

4. Create an `index.ts` file - this will contain the server code
5. Add the following code block to your file:

   ```typescript
   import fastify from 'fastify';

   const server = fastify();

   server.get('/ping', async (request, reply) => {
     return 'pong\n';
   });

   server.listen({ port: 8080 }, (err, address) => {
     if (err) {
       console.error(err);
       process.exit(1);
     }
     console.log(`Server listening at ${address}`);
   });
   ```

6. Run `npm run build` - this will compile `index.ts` into `index.js` which can
   be executed using Node.js. If you run into any errors please open an issue in
   [fastify/help](https://github.com/fastify/help/)
7. Run `npm run start` to run the Fastify server
8. You should see `Server listening at http://127.0.0.1:8080` in your console
9. Try out your server using `curl localhost:8080/ping`, it should return `pong`
   🏓

🎉 You now have a working Typescript Fastify server! This example demonstrates
the simplicity of the version 3.x type system. By default, the type system
assumes you are using an `http` server. The later examples will demonstrate how
to create more complex servers such as `https` and `http2`, how to specify route
schemas, and more!

> For more examples on initializing Fastify with TypeScript (such as enabling
> HTTP2) check out the detailed API section [here][Fastify]

### Using Generics

The type system heavily relies on generic properties to provide the most
accurate development experience. While some may find the overhead a bit
cumbersome, the tradeoff is worth it! This example will dive into implementing
generic types for route schemas and the dynamic properties located on the
route-level `request` object.

1. If you did not complete the previous example, follow steps 1-4 to get set up.
2. Inside `index.ts`, define three interfaces `IQuerystring`,`IHeaders` and `IReply`:

   ```typescript
   interface IQuerystring {
     username: string;
     password: string;
   }

   interface IHeaders {
     'h-Custom': string;
   }

   interface IReply {
     200: { success: boolean };
     302: { url: string };
     '4xx': { error: string };
   }
   ```

3. Using the three interfaces, define a new API route and pass them as generics.
   The shorthand route methods (i.e. `.get`) accept a generic object
   `RouteGenericInterface` containing five named properties: `Body`,
   `Querystring`, `Params`, `Headers` and `Reply`. The interfaces `Body`,
   `Querystring`, `Params` and `Headers` will be passed down through the route
   method into the route method handler `request` instance and the `Reply`
   interface to the `reply` instance.

   ```typescript
   server.get<{
     Querystring: IQuerystring;
     Headers: IHeaders;
     Reply: IReply;
   }>('/auth', async (request, reply) => {
     const { username, password } = request.query;
     const customerHeader = request.headers['h-Custom'];
     // do something with request data

     // chaining .statusCode/.code calls with .send allows type narrowing. For example:
     // this works
     reply.code(200).send({ success: true });
     // but this gives a type error
     reply.code(200).send('uh-oh');
     // it even works for wildcards
     reply.code(404).send({ error: 'Not found' });
     return `logged in!`;
   });
   ```

4. Build and run the server code with `npm run build` and `npm run start`
5. Query the API
   ```bash
   curl localhost:8080/auth?username=admin&password=Password123!
   ```
   And it should return back `logged in!`
6. But wait there's more! The generic interfaces are also available inside route
   level hook methods. Modify the previous route by adding a `preValidation`
   hook:
   ```typescript
   server.get<{
     Querystring: IQuerystring;
     Headers: IHeaders;
     Reply: IReply;
   }>(
     '/auth',
     {
       preValidation: (request, reply, done) => {
         const { username, password } = request.query;
         done(username !== 'admin' ? new Error('Must be admin') : undefined); // only validate `admin` account
       },
     },
     async (request, reply) => {
       const customerHeader = request.headers['h-Custom'];
       // do something with request data
       return `logged in!`;
     }
   );
   ```
7. Build and run and query with the `username` query string option set to
   anything other than `admin`. The API should now return a HTTP 500 error
   `{"statusCode":500,"error":"Internal Server Error","message":"Must be
admin"}`

🎉 Good work, now you can define interfaces for each route and have strictly
typed request and reply instances. Other parts of the Fastify type system rely
on generic properties. Make sure to reference the detailed type system
documentation below to learn more about what is available.

### JSON Schema

To validate your requests and responses you can use JSON Schema files. If you
didn't know already, defining schemas for your Fastify routes can increase their
throughput! Check out the [Validation and
Serialization](./Validation-and-Serialization.md) documentation for more info.

Also it has the advantage to use the defined type within your handlers
(including pre-validation, etc.).

Here are some options on how to achieve this.

#### Fastify Type Providers

Fastify offers two packages wrapping `json-schema-to-ts` and `typebox`:

- [`@fastify/type-provider-json-schema-to-ts`](https://github.com/fastify/fastify-type-provider-json-schema-to-ts)
- [`@fastify/type-provider-typebox`](https://github.com/fastify/fastify-type-provider-typebox)

And a `zod` wrapper by a third party called [`fastify-type-provider-zod`](https://github.com/turkerdev/fastify-type-provider-zod)

They simplify schema validation setup and you can read more about them in [Type
Providers](./Type-Providers.md) page.

Below is how to setup schema validation using the `typebox`,
`json-schema-to-typescript`, and `json-schema-to-ts` packages without type
providers.

#### TypeBox

A useful library for building types and a schema at once is [TypeBox](https://www.npmjs.com/package/@sinclair/typebox).
With TypeBox you define your schema within your code and use them directly as
types or schemas as you need them.

When you want to use it for validation of some payload in a fastify route you
can do it as follows:

1. Install `typebox` in your project.

   ```bash
   npm i @sinclair/typebox
   ```

2. Define the schema you need with `Type` and create the respective type with
   `Static`.

   ```typescript
   import { Static, Type } from '@sinclair/typebox';

   export const User = Type.Object({
     name: Type.String(),
     mail: Type.Optional(Type.String({ format: 'email' })),
   });

   export type UserType = Static<typeof User>;
   ```

3. Use the defined type and schema during the definition of your route

   ```typescript
   import Fastify from 'fastify';
   // ...

   const fastify = Fastify();

   fastify.post<{ Body: UserType; Reply: UserType }>(
     '/',
     {
       schema: {
         body: User,
         response: {
           200: User,
         },
       },
     },
     (request, reply) => {
       // The `name` and `mail` types are automatically inferred
       const { name, mail } = request.body;
       reply.status(200).send({ name, mail });
     }
   );
   ```

#### json-schema-to-typescript

In the last example we used Typebox to define the types and schemas for our
route. Many users will already be using JSON Schemas to define these properties,
and luckily there is a way to transform existing JSON Schemas into TypeScript
interfaces!

1. If you did not complete the 'Getting Started' example, go back and follow
   steps 1-4 first.
2. Install the `json-schema-to-typescript` module:

   ```bash
   npm i -D json-schema-to-typescript
   ```

3. Create a new folder called `schemas` and add two files `headers.json` and
   `querystring.json`. Copy and paste the following schema definitions into the
   respective files:

   ```json
   {
     "title": "Headers Schema",
     "type": "object",
     "properties": {
       "h-Custom": { "type": "string" }
     },
     "additionalProperties": false,
     "required": ["h-Custom"]
   }
   ```

   ```json
   {
     "title": "Querystring Schema",
     "type": "object",
     "properties": {
       "username": { "type": "string" },
       "password": { "type": "string" }
     },
     "additionalProperties": false,
     "required": ["username", "password"]
   }
   ```

4. Add a `compile-schemas` script to the package.json:

```json
{
  "scripts": {
    "compile-schemas": "json2ts -i schemas -o types"
  }
}
```

`json2ts` is a CLI utility included in `json-schema-to-typescript`. `schemas`
is the input path, and `types` is the output path. 5. Run `npm run compile-schemas`. Two new files should have been created in the
`types` directory. 6. Update `index.ts` to have the following code:

```typescript
import fastify from 'fastify';

// import json schemas as normal
import QuerystringSchema from './schemas/querystring.json';
import HeadersSchema from './schemas/headers.json';

// import the generated interfaces
import { QuerystringSchema as QuerystringSchemaInterface } from './types/querystring';
import { HeadersSchema as HeadersSchemaInterface } from './types/headers';

const server = fastify();

server.get<{
  Querystring: QuerystringSchemaInterface;
  Headers: HeadersSchemaInterface;
}>(
  '/auth',
  {
    schema: {
      querystring: QuerystringSchema,
      headers: HeadersSchema,
    },
    preValidation: (request, reply, done) => {
      const { username, password } = request.query;
      done(username !== 'admin' ? new Error('Must be admin') : undefined);
    },
    //  or if using async
    //  preValidation: async (request, reply) => {
    //    const { username, password } = request.query
    //    if (username !== "admin") throw new Error("Must be admin");
    //  }
  },
  async (request, reply) => {
    const customerHeader = request.headers['h-Custom'];
    // do something with request data
    return `logged in!`;
  }
);

server.route<{
  Querystring: QuerystringSchemaInterface;
  Headers: HeadersSchemaInterface;
}>({
  method: 'GET',
  url: '/auth2',
  schema: {
    querystring: QuerystringSchema,
    headers: HeadersSchema,
  },
  preHandler: (request, reply, done) => {
    const { username, password } = request.query;
    const customerHeader = request.headers['h-Custom'];
    done();
  },
  handler: (request, reply) => {
    const { username, password } = request.query;
    const customerHeader = request.headers['h-Custom'];
    reply.status(200).send({ username });
  },
});

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(0);
  }
  console.log(`Server listening at ${address}`);
});
```

Pay special attention to the imports at the top of this file. It might seem
redundant, but you need to import both the schema files and the generated
interfaces.

Great work! Now you can make use of both JSON Schemas and TypeScript
definitions.

#### json-schema-to-ts

If you do not want to generate types from your schemas, but want to use them
directly from your code, you can use the package
[json-schema-to-ts](https://www.npmjs.com/package/json-schema-to-ts).

You can install it as dev-dependency.

```bash
npm i -D json-schema-to-ts
```

In your code you can define your schema like a normal object. But be aware of
making it _const_ like explained in the docs of the module.

```typescript
const todo = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    done: { type: 'boolean' },
  },
  required: ['name'],
} as const; // don't forget to use const !
```

With the provided type `FromSchema` you can build a type from your schema and
use it in your handler.

```typescript
import { FromSchema } from 'json-schema-to-ts';
fastify.post<{ Body: FromSchema<typeof todo> }>(
  '/todo',
  {
    schema: {
      body: todo,
      response: {
        201: {
          type: 'string',
        },
      },
    },
  },
  async (request, reply): Promise<void> => {
    /*
    request.body has type
    {
      [x: string]: unknown;
      description?: string;
      done?: boolean;
      name: string;
    }
    */

    request.body.name; // will not throw type error
    request.body.notthere; // will throw type error

    reply.status(201).send();
  }
);
```

### Plugins

One of Fastify's most distinguishable features is its extensive plugin
ecosystem. Plugin types are fully supported, and take advantage of the
[declaration
merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
pattern. This example is broken up into three parts: Creating a TypeScript
Fastify Plugin, Creating Type Definitions for a Fastify Plugin, and Using a
Fastify Plugin in a TypeScript Project.

#### Creating a TypeScript Fastify Plugin

1. Initialize a new npm project and install required dependencies
   ```bash
   npm init -y
   npm i fastify fastify-plugin
   npm i -D typescript @types/node
   ```
2. Add a `build` script to the `"scripts"` section and `'index.d.ts'` to the
   `"types"` section of the `package.json` file:
   ```json
   {
     "types": "index.d.ts",
     "scripts": {
       "build": "tsc -p tsconfig.json"
     }
   }
   ```
3. Initialize a TypeScript configuration file:
   ```bash
   npx typescript --init
   ```
   Once the file is generated, enable the `"declaration"` option in the
   `"compilerOptions"` object.
   ```json
   {
     "compilerOptions": {
       "declaration": true
     }
   }
   ```
4. Create an `index.ts` file - this will contain the plugin code
5. Add the following code to `index.ts`

   ```typescript
   import { FastifyPluginCallback, FastifyPluginAsync } from 'fastify';
   import fp from 'fastify-plugin';

   // using declaration merging, add your plugin props to the appropriate fastify interfaces
   // if prop type is defined here, the value will be typechecked when you call decorate{,Request,Reply}
   declare module 'fastify' {
     interface FastifyRequest {
       myPluginProp: string;
     }
     interface FastifyReply {
       myPluginProp: number;
     }
   }

   // define options
   export interface MyPluginOptions {
     myPluginOption: string;
   }

   // define plugin using callbacks
   const myPluginCallback: FastifyPluginCallback<MyPluginOptions> = (
     fastify,
     options,
     done
   ) => {
     fastify.decorateRequest('myPluginProp', 'super_secret_value');
     fastify.decorateReply('myPluginProp', options.myPluginOption);

     done();
   };

   // define plugin using promises
   const myPluginAsync: FastifyPluginAsync<MyPluginOptions> = async (
     fastify,
     options
   ) => {
     fastify.decorateRequest('myPluginProp', 'super_secret_value');
     fastify.decorateReply('myPluginProp', options.myPluginOption);
   };

   // export plugin using fastify-plugin
   export default fp(myPluginCallback, '3.x');
   // or
   // export default fp(myPluginAsync, '3.x')
   ```

6. Run `npm run build` to compile the plugin code and produce both a JavaScript
   source file and a type definition file.
7. With the plugin now complete you can [publish to npm] or use it locally.
   > You do not _need_ to publish your plugin to npm to use it. You can include
   > it in a Fastify project and reference it as you would any piece of code! As
   > a TypeScript user, make sure the declaration override exists somewhere that
   > will be included in your project compilation so the TypeScript interpreter
   > can process it.

#### Creating Type Definitions for a Fastify Plugin

This plugin guide is for Fastify plugins written in JavaScript. The steps
outlined in this example are for adding TypeScript support for users consuming
your plugin.

1. Initialize a new npm project and install required dependencies
   ```bash
   npm init -y
   npm i fastify-plugin
   ```
2. Create two files `index.js` and `index.d.ts`
3. Modify the package json to include these files under the `main` and `types`
   properties (the name does not have to be `index` explicitly, but it is
   recommended the files have the same name):
   ```json
   {
     "main": "index.js",
     "types": "index.d.ts"
   }
   ```
4. Open `index.js` and add the following code:

   ```javascript
   // fastify-plugin is highly recommended for any plugin you write
   const fp = require('fastify-plugin');

   function myPlugin(instance, options, done) {
     // decorate the fastify instance with a custom function called myPluginFunc
     instance.decorate('myPluginFunc', (input) => {
       return input.toUpperCase();
     });

     done();
   }

   module.exports = fp(myPlugin, {
     fastify: '5.x',
     name: 'my-plugin', // this is used by fastify-plugin to derive the property name
   });
   ```

5. Open `index.d.ts` and add the following code:

   ```typescript
   import { FastifyPluginCallback } from 'fastify';

   interface PluginOptions {
     //...
   }

   // Optionally, you can add any additional exports.
   // Here we are exporting the decorator we added.
   export interface myPluginFunc {
     (input: string): string;
   }

   // Most importantly, use declaration merging to add the custom property to the Fastify type system
   declare module 'fastify' {
     interface FastifyInstance {
       myPluginFunc: myPluginFunc;
     }
   }

   // fastify-plugin automatically adds named export, so be sure to add also this type
   // the variable name is derived from `options.name` property if `module.exports.myPlugin` is missing
   export const myPlugin: FastifyPluginCallback<PluginOptions>;

   // fastify-plugin automatically adds `.default` property to the exported plugin. See the note below
   export default myPlugin;
   ```

**Note**: [fastify-plugin](https://github.com/fastify/fastify-plugin) v2.3.0 and
newer, automatically adds `.default` property and a named export to the exported
plugin. Be sure to `export default` and `export const myPlugin` in your typings
to provide the best developer experience. For a complete example you can check
out
[@fastify/swagger](https://github.com/fastify/fastify-swagger/blob/main/index.d.ts).

With those files completed, the plugin is now ready to be consumed by any
TypeScript project!

The Fastify plugin system enables developers to decorate the Fastify instance,
and the request/reply instances. For more information check out this blog post
on [Declaration Merging and Generic
Inheritance](https://dev.to/ethanarrowood/is-declaration-merging-and-generic-inheritance-at-the-same-time-impossible-53cp).

#### Using a Plugin

Using a Fastify plugin in TypeScript is just as easy as using one in JavaScript.
Import the plugin with `import/from` and you're all set -- except there is one
exception users should be aware of.

Fastify plugins use declaration merging to modify existing Fastify type
interfaces (check out the previous two examples for more details). Declaration
merging is not very _smart_, meaning if the plugin type definition for a plugin
is within the scope of the TypeScript interpreter, then the plugin types will be
included **regardless** of if the plugin is being used or not. This is an
unfortunate limitation of using TypeScript and is unavoidable as of right now.

However, there are a couple of suggestions to help improve this experience:

- Make sure the `no-unused-vars` rule is enabled in
  [ESLint](https://eslint.org/docs/rules/no-unused-vars) and any imported plugin
  are actually being loaded.
- Use a module such as [depcheck](https://www.npmjs.com/package/depcheck) or
  [npm-check](https://www.npmjs.com/package/npm-check) to verify plugin
  dependencies are being used somewhere in your project.

Note that using `require` will not load the type definitions properly and may
cause type errors.
TypeScript can only identify the types that are directly imported into code,
which means that you can use require inline with import on top. For example:

```typescript
import 'plugin'; // here will trigger the type augmentation.

fastify.register(require('plugin'));
```

```typescript
import plugin from 'plugin'; //  here will trigger the type augmentation.

fastify.register(plugin);
```

Or even explicit config on tsconfig

```jsonc
{
  "types": ["plugin"] // we force TypeScript to import the types
}
```

## Code Completion In Vanilla JavaScript

Vanilla JavaScript can use the published types to provide code completion (e.g.
[Intellisense](https://code.visualstudio.com/docs/editor/intellisense)) by
following the [TypeScript JSDoc
Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html).

For example:

```js
/**  @type {import('fastify').FastifyPluginAsync<{ optionA: boolean, optionB: string }>} */
module.exports = async function (fastify, { optionA, optionB }) {
  fastify.get('/look', () => 'at me');
};
```

## API Type System Documentation

This section is a detailed account of all the types available to you in Fastify
version 3.x

All `http`, `https`, and `http2` types are inferred from `@types/node`

[Generics](#generics) are documented by their default value as well as their
constraint value(s). Read these articles for more information on TypeScript
generics.

- [Generic Parameter
  Default](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-3.html#generic-parameter-defaults)
- [Generic Constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)

#### How to import

The Fastify API is powered by the `fastify()` method. In JavaScript you would
import it using `const fastify = require('fastify')`. In TypeScript it is
recommended to use the `import/from` syntax instead so types can be resolved.
There are a couple supported import methods with the Fastify type system.

1. `import fastify from 'fastify'`

   - Types are resolved but not accessible using dot notation
   - Example:

     ```typescript
     import fastify from 'fastify';

     const f = fastify();
     f.listen({ port: 8080 }, () => {
       console.log('running');
     });
     ```

   - Gain access to types with destructuring:

     ```typescript
     import fastify, { FastifyInstance } from 'fastify';

     const f: FastifyInstance = fastify();
     f.listen({ port: 8080 }, () => {
       console.log('running');
     });
     ```

   - Destructuring also works for the main API method:

     ```typescript
     import { fastify, FastifyInstance } from 'fastify';

     const f: FastifyInstance = fastify();
     f.listen({ port: 8080 }, () => {
       console.log('running');
     });
     ```

2. `import * as Fastify from 'fastify'`

   - Types are resolved and accessible using dot notation
   - Calling the main Fastify API method requires a slightly different syntax
     (see example)
   - Example:

     ```typescript
     import * as Fastify from 'fastify';

     const f: Fastify.FastifyInstance = Fastify.fastify();
     f.listen({ port: 8080 }, () => {
       console.log('running');
     });
     ```

3. `const fastify = require('fastify')`

   - This syntax is valid and will import fastify as expected; however, types
     will **not** be resolved
   - Example:

     ```typescript
     const fastify = require('fastify');

     const f = fastify();
     f.listen({ port: 8080 }, () => {
       console.log('running');
     });
     ```

   - Destructuring is supported and will resolve types properly

     ```typescript
     const { fastify } = require('fastify');

     const f = fastify();
     f.listen({ port: 8080 }, () => {
       console.log('running');
     });
     ```

#### Generics

Many type definitions share the same generic parameters; they are all
documented, in detail, within this section.

Most definitions depend on `@types/node` modules `http`, `https`, and `http2`

##### RawServer

Underlying Node.js server type

Default: `http.Server`

Constraints: `http.Server`, `https.Server`, `http2.Http2Server`,
`http2.Http2SecureServer`

Enforces generic parameters: [`RawRequest`][RawRequestGeneric],
[`RawReply`][RawReplyGeneric]

##### RawRequest

Underlying Node.js request type

Default: [`RawRequestDefaultExpression`][RawRequestDefaultExpression]

Constraints: `http.IncomingMessage`, `http2.Http2ServerRequest`

Enforced by: [`RawServer`][RawServerGeneric]

##### RawReply

Underlying Node.js response type

Default: [`RawReplyDefaultExpression`][RawReplyDefaultExpression]

Constraints: `http.ServerResponse`, `http2.Http2ServerResponse`

Enforced by: [`RawServer`][RawServerGeneric]

##### Logger

Fastify logging utility

Default: [`FastifyLoggerOptions`][FastifyLoggerOptions]

Enforced by: [`RawServer`][RawServerGeneric]

##### RawBody

A generic parameter for the content-type-parser methods.

Constraints: `string | Buffer`

---

#### Fastify

##### fastify< [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [Logger][LoggerGeneric]>(opts?: [FastifyServerOptions][FastifyServerOptions]): [FastifyInstance][FastifyInstance]

[src](https://github.com/fastify/fastify/blob/main/fastify.d.ts#L19)

The main Fastify API method. By default creates an HTTP server. Utilizing
discriminant unions and overload methods, the type system will automatically
infer which type of server (http, https, or http2) is being created purely based
on the options based to the method (see the examples below for more
information). It also supports an extensive generic type system to allow the
user to extend the underlying Node.js Server, Request, and Reply objects.
Additionally, the `Logger` generic exists for custom log types. See the examples
and generic breakdown below for more information.

###### Example 1: Standard HTTP server

No need to specify the `Server` generic as the type system defaults to HTTP.

```typescript
import fastify from 'fastify';

const server = fastify();
```

Check out the Learn By Example - [Getting Started](#getting-started) example for
a more detailed http server walkthrough.

###### Example 2: HTTPS server

1. Create the following imports from `@types/node` and `fastify`
   ```typescript
   import fs from 'node:fs';
   import path from 'node:path';
   import fastify from 'fastify';
   ```
2. Perform the following steps before setting up a Fastify HTTPS server
   to create the `key.pem` and `cert.pem` files:

```sh
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
rm csr.pem
```

3. Instantiate a Fastify https server and add a route:

   ```typescript
   const server = fastify({
     https: {
       key: fs.readFileSync(path.join(__dirname, 'key.pem')),
       cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
     },
   });

   server.get('/', async function (request, reply) {
     return { hello: 'world' };
   });

   server.listen({ port: 8080 }, (err, address) => {
     if (err) {
       console.error(err);
       process.exit(0);
     }
     console.log(`Server listening at ${address}`);
   });
   ```

4. Build and run! Test your server out by querying with: `curl -k
https://localhost:8080`

###### Example 3: HTTP2 server

There are two types of HTTP2 server types, insecure and secure. Both require
specifying the `http2` property as `true` in the `options` object. The `https`
property is used for creating a secure http2 server; omitting the `https`
property will create an insecure http2 server.

```typescript
const insecureServer = fastify({ http2: true });
const secureServer = fastify({
  http2: true,
  https: {}, // use the `key.pem` and `cert.pem` files from the https section
});
```

For more details on using HTTP2 check out the Fastify [HTTP2](./HTTP2.md)
documentation page.

###### Example 4: Extended HTTP server

Not only can you specify the server type, but also the request and reply types.
Thus, allowing you to specify special properties, methods, and more! When
specified at server instantiation, the custom type becomes available on all
further instances of the custom type.

```typescript
import fastify from 'fastify';
import http from 'node:http';

interface customRequest extends http.IncomingMessage {
  mySpecialProp: string;
}

const server = fastify<http.Server, customRequest>();

server.get('/', async (request, reply) => {
  const someValue = request.raw.mySpecialProp; // TS knows this is a string, because of the `customRequest` interface
  return someValue.toUpperCase();
});
```

###### Example 5: Specifying logger types

Fastify uses [Pino](https://getpino.io/#/) logging library under the hood. Since
`pino@7`, all of it's properties can be configured via `logger` field when
constructing Fastify's instance. If properties you need aren't exposed, please
open an Issue to [`Pino`](https://github.com/pinojs/pino/issues) or pass a
preconfigured external instance of Pino (or any other compatible logger) as
temporary fix to Fastify via the same field. This allows creating custom
serializers as well, see the [Logging](Logging.md) documentation for more info.

```typescript
import fastify from 'fastify';

const server = fastify({
  logger: {
    level: 'info',
    redact: ['x-userinfo'],
    messageKey: 'message',
  },
});

server.get('/', async (request, reply) => {
  server.log.info('log message');
  return 'another message';
});
```

---

##### fastify.HTTPMethods

[src](https://github.com/fastify/fastify/blob/main/types/utils.d.ts#L8)

Union type of: `'DELETE' | 'GET' | 'HEAD' | 'PATCH' | 'POST' | 'PUT' |
'OPTIONS'`

##### fastify.RawServerBase

[src](https://github.com/fastify/fastify/blob/main/types/utils.d.ts#L13)

Dependent on `@types/node` modules `http`, `https`, `http2`

Union type of: `http.Server | https.Server | http2.Http2Server |
http2.Http2SecureServer`

##### fastify.RawServerDefault

[src](https://github.com/fastify/fastify/blob/main/types/utils.d.ts#L18)

Dependent on `@types/node` modules `http`

Type alias for `http.Server`

---

##### fastify.FastifyServerOptions< [RawServer][RawServerGeneric], [Logger][LoggerGeneric]>

[src](https://github.com/fastify/fastify/blob/main/fastify.d.ts#L29)

An interface of properties used in the instantiation of the Fastify server. Is
used in the main [`fastify()`][Fastify] method. The `RawServer` and `Logger`
generic parameters are passed down through that method.

See the main [fastify][Fastify] method type definition section for examples on
instantiating a Fastify server with TypeScript.

##### fastify.FastifyInstance< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RequestGeneric][FastifyRequestGenericInterface], [Logger][LoggerGeneric]>

[src](https://github.com/fastify/fastify/blob/main/types/instance.d.ts#L16)

Interface that represents the Fastify server object. This is the returned server
instance from the [`fastify()`][Fastify] method. This type is an interface so it
can be extended via [declaration
merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
if your code makes use of the `decorate` method.

Through the use of generic cascading, all methods attached to the instance
inherit the generic properties from instantiation. This means that by specifying
the server, request, or reply types, all methods will know how to type those
objects.

Check out the main [Learn by Example](#learn-by-example) section for detailed
guides, or the more simplified [fastify][Fastify] method examples for additional
details on this interface.

---

#### Request

##### fastify.FastifyRequest< [RequestGeneric][FastifyRequestGenericInterface], [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric]>

[src](https://github.com/fastify/fastify/blob/main/types/request.d.ts#L15)

This interface contains properties of Fastify request object. The properties
added here disregard what kind of request object (http vs http2) and disregard
what route level it is serving; thus calling `request.body` inside a GET request
will not throw an error (but good luck sending a GET request with a body 😉).

If you need to add custom properties to the `FastifyRequest` object (such as
when using the [`decorateRequest`][DecorateRequest] method) you need to use
declaration merging on this interface.

A basic example is provided in the [`FastifyRequest`][FastifyRequest] section.
For a more detailed example check out the Learn By Example section:
[Plugins](#plugins)

###### Example

```typescript
import fastify from 'fastify';

const server = fastify();

server.decorateRequest('someProp', 'hello!');

server.get('/', async (request, reply) => {
  const { someProp } = request; // need to use declaration merging to add this prop to the request interface
  return someProp;
});

// this declaration must be in scope of the typescript interpreter to work
declare module 'fastify' {
  interface FastifyRequest {
    // you must reference the interface and not the type
    someProp: string;
  }
}

// Or you can type your request using
type CustomRequest = FastifyRequest<{
  Body: { test: boolean };
}>;

server.get(
  '/typedRequest',
  async (request: CustomRequest, reply: FastifyReply) => {
    return request.body.test;
  }
);
```

##### fastify.RequestGenericInterface

[src](https://github.com/fastify/fastify/blob/main/types/request.d.ts#L4)

Fastify request objects have four dynamic properties: `body`, `params`, `query`,
and `headers`. Their respective types are assignable through this interface. It
is a named property interface enabling the developer to ignore the properties
they do not want to specify. All omitted properties are defaulted to `unknown`.
The corresponding property names are: `Body`, `Querystring`, `Params`,
`Headers`.

```typescript
import fastify, { RequestGenericInterface } from 'fastify';

const server = fastify();

interface requestGeneric extends RequestGenericInterface {
  Querystring: {
    name: string;
  };
}

server.get<requestGeneric>('/', async (request, reply) => {
  const { name } = request.query; // the name prop now exists on the query prop
  return name.toUpperCase();
});
```

If you want to see a detailed example of using this interface check out the
Learn by Example section: [JSON Schema](#json-schema).

##### fastify.RawRequestDefaultExpression\<[RawServer][RawServerGeneric]\>

[src](https://github.com/fastify/fastify/blob/main/types/utils.d.ts#L23)

Dependent on `@types/node` modules `http`, `https`, `http2`

Generic parameter `RawServer` defaults to [`RawServerDefault`][RawServerDefault]

If `RawServer` is of type `http.Server` or `https.Server`, then this expression
returns `http.IncomingMessage`, otherwise, it returns
`http2.Http2ServerRequest`.

```typescript
import http from 'node:http';
import http2 from 'node:http2';
import { RawRequestDefaultExpression } from 'fastify';

RawRequestDefaultExpression<http.Server>; // -> http.IncomingMessage
RawRequestDefaultExpression<http2.Http2Server>; // -> http2.Http2ServerRequest
```

---

#### Reply

##### fastify.FastifyReply<[RequestGeneric][FastifyRequestGenericInterface], [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [ContextConfig][ContextConfigGeneric]>

[src](https://github.com/fastify/fastify/blob/main/types/reply.d.ts#L32)

This interface contains the custom properties that Fastify adds to the standard
Node.js reply object. The properties added here disregard what kind of reply
object (http vs http2).

If you need to add custom properties to the FastifyReply object (such as when
using the `decorateReply` method) you need to use declaration merging on this
interface.

A basic example is provided in the [`FastifyReply`][FastifyReply] section. For a
more detailed example check out the Learn By Example section:
[Plugins](#plugins)

###### Example

```typescript
import fastify from 'fastify';

const server = fastify();

server.decorateReply('someProp', 'world');

server.get('/', async (request, reply) => {
  const { someProp } = reply; // need to use declaration merging to add this prop to the reply interface
  return someProp;
});

// this declaration must be in scope of the typescript interpreter to work
declare module 'fastify' {
  interface FastifyReply {
    // you must reference the interface and not the type
    someProp: string;
  }
}
```

##### fastify.RawReplyDefaultExpression< [RawServer][RawServerGeneric]>

[src](https://github.com/fastify/fastify/blob/main/types/utils.d.ts#L27)

Dependent on `@types/node` modules `http`, `https`, `http2`

Generic parameter `RawServer` defaults to [`RawServerDefault`][RawServerDefault]

If `RawServer` is of type `http.Server` or `https.Server`, then this expression
returns `http.ServerResponse`, otherwise, it returns
`http2.Http2ServerResponse`.

```typescript
import http from 'node:http';
import http2 from 'node:http2';
import { RawReplyDefaultExpression } from 'fastify';

RawReplyDefaultExpression<http.Server>; // -> http.ServerResponse
RawReplyDefaultExpression<http2.Http2Server>; // -> http2.Http2ServerResponse
```

---

#### Plugin

Fastify allows the user to extend its functionalities with plugins. A plugin can
be a set of routes, a server decorator or whatever. To activate plugins, use the
[`fastify.register()`][FastifyRegister] method.

When creating plugins for Fastify, it is recommended to use the `fastify-plugin`
module. Additionally, there is a guide to creating plugins with TypeScript and
Fastify available in the Learn by Example, [Plugins](#plugins) section.

##### fastify.FastifyPluginCallback< [Options][FastifyPluginOptions]>

[src](https://github.com/fastify/fastify/blob/main/types/plugin.d.ts#L9)

Interface method definition used within the
[`fastify.register()`][FastifyRegister] method.

##### fastify.FastifyPluginAsync< [Options][FastifyPluginOptions]>

[src](https://github.com/fastify/fastify/blob/main/types/plugin.d.ts#L20)

Interface method definition used within the
[`fastify.register()`][FastifyRegister] method.

##### fastify.FastifyPlugin< [Options][FastifyPluginOptions]>

[src](https://github.com/fastify/fastify/blob/main/types/plugin.d.ts#L29)

Interface method definition used within the
[`fastify.register()`][FastifyRegister] method. Document deprecated in favor of
`FastifyPluginCallback` and `FastifyPluginAsync` since general `FastifyPlugin`
doesn't properly infer types for async functions.

##### fastify.FastifyPluginOptions

[src](https://github.com/fastify/fastify/blob/main/types/plugin.d.ts#L31)

A loosely typed object used to constrain the `options` parameter of
[`fastify.register()`][FastifyRegister] to an object. When creating a plugin,
define its options as an extension of this interface (`interface MyPluginOptions
extends FastifyPluginOptions`) so they can be passed to the register method.

---

#### Register

##### fastify.FastifyRegister(plugin: [FastifyPluginCallback][FastifyPluginCallback], opts: [FastifyRegisterOptions][FastifyRegisterOptions])

[src](https://github.com/fastify/fastify/blob/main/types/register.d.ts#L9)

##### fastify.FastifyRegister(plugin: [FastifyPluginAsync][FastifyPluginAsync], opts: [FastifyRegisterOptions][FastifyRegisterOptions])

[src](https://github.com/fastify/fastify/blob/main/types/register.d.ts#L9)

##### fastify.FastifyRegister(plugin: [FastifyPlugin][FastifyPlugin], opts: [FastifyRegisterOptions][FastifyRegisterOptions])

[src](https://github.com/fastify/fastify/blob/main/types/register.d.ts#L9)

This type interface specifies the type for the
[`fastify.register()`](./Server.md#register) method. The type interface returns
a function signature with an underlying generic `Options` which is defaulted to
[FastifyPluginOptions][FastifyPluginOptions]. It infers this generic from the
FastifyPlugin parameter when calling this function so there is no need to
specify the underlying generic. The options parameter is the intersection of the
plugin's options and two additional optional properties: `prefix: string` and
`logLevel`: [LogLevel][LogLevel]. `FastifyPlugin` is deprecated use
`FastifyPluginCallback` and `FastifyPluginAsync` instead.

Below is an example of the options inference in action:

```typescript
const server = fastify();

const plugin: FastifyPluginCallback<{
  option1: string;
  option2: boolean;
}> = function (instance, opts, done) {};

server().register(plugin, {}); // Error - options object is missing required properties
server().register(plugin, { option1: '', option2: true }); // OK - options object contains required properties
```

See the Learn By Example, [Plugins](#plugins) section for more detailed examples
of creating TypeScript plugins in Fastify.

##### fastify.FastifyRegisterOptions

[src](https://github.com/fastify/fastify/blob/main/types/register.d.ts#L16)

This type is the intersection of the `Options` generic and a non-exported
interface `RegisterOptions` that specifies two optional properties: `prefix:
string` and `logLevel`: [LogLevel][LogLevel]. This type can also be specified as
a function that returns the previously described intersection.

---

#### Logger

Check out the [Specifying Logger Types](#example-5-specifying-logger-types)
example for more details on specifying a custom logger.

##### fastify.FastifyLoggerOptions< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric]>

[src](https://github.com/fastify/fastify/blob/main/types/logger.d.ts#L17)

An interface definition for the internal Fastify logger. It is emulative of the
[Pino.js](https://getpino.io/#/) logger. When enabled through server options,
use it following the general [logger](./Logging.md) documentation.

##### fastify.FastifyLogFn

[src](https://github.com/fastify/fastify/blob/main/types/logger.d.ts#L7)

An overload function interface that implements the two ways Fastify calls log
methods. This interface is passed to all associated log level properties on the
FastifyLoggerOptions object.

##### fastify.LogLevel

[src](https://github.com/fastify/fastify/blob/main/types/logger.d.ts#L12)

Union type of: `'info' | 'error' | 'debug' | 'fatal' | 'warn' | 'trace'`

---

#### Context

The context type definition is similar to the other highly dynamic pieces of the
type system. Route context is available in the route handler method.

##### fastify.FastifyRequestContext

[src](https://github.com/fastify/fastify/blob/main/types/context.d.ts#L11)

An interface with a single required property `config` that is set by default to
`unknown`. Can be specified either using a generic or an overload.

This type definition is potentially incomplete. If you are using it and can
provide more details on how to improve the definition, we strongly encourage you
to open an issue in the main
[fastify/fastify](https://github.com/fastify/fastify) repository. Thank you in
advanced!

##### fastify.FastifyReplyContext

[src](https://github.com/fastify/fastify/blob/main/types/context.d.ts#L11)

An interface with a single required property `config` that is set by default to
`unknown`. Can be specified either using a generic or an overload.

This type definition is potentially incomplete. If you are using it and can
provide more details on how to improve the definition, we strongly encourage you
to open an issue in the main
[fastify/fastify](https://github.com/fastify/fastify) repository. Thank you in
advanced!

---

#### Routing

One of the core principles in Fastify is its routing capabilities. Most of the
types defined in this section are used under-the-hood by the Fastify instance
`.route` and `.get/.post/.etc` methods.

##### fastify.RouteHandlerMethod< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [RequestGeneric][FastifyRequestGenericInterface], [ContextConfig][ContextConfigGeneric]>

[src](https://github.com/fastify/fastify/blob/main/types/route.d.ts#L105)

A type declaration for the route handler methods. Has two arguments, `request`
and `reply` which are typed by `FastifyRequest` and `FastifyReply` respectively.
The generics parameters are passed through to these arguments. The method
returns either `void` or `Promise<any>` for synchronous and asynchronous
handlers respectively.

##### fastify.RouteOptions< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [RequestGeneric][FastifyRequestGenericInterface], [ContextConfig][ContextConfigGeneric]>

[src](https://github.com/fastify/fastify/blob/main/types/route.d.ts#L78)

An interface that extends RouteShorthandOptions and adds the following three
required properties:

1. `method` which corresponds to a singular [HTTPMethod][HTTPMethods] or a list
   of [HTTPMethods][HTTPMethods]
2. `url` a string for the route
3. `handler` the route handler method, see [RouteHandlerMethod][] for more
   details

##### fastify.RouteShorthandMethod< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric]>

[src](https://github.com/fastify/fastify/blob/main/types/route.d.ts#12)

An overloaded function interface for three kinds of shorthand route methods to
be used in conjunction with the `.get/.post/.etc` methods.

##### fastify.RouteShorthandOptions< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [RequestGeneric][FastifyRequestGenericInterface], [ContextConfig][ContextConfigGeneric]>

[src](https://github.com/fastify/fastify/blob/main/types/route.d.ts#55)

An interface that covers all of the base options for a route. Each property on
this interface is optional, and it serves as the base for the RouteOptions and
RouteShorthandOptionsWithHandler interfaces.

##### fastify.RouteShorthandOptionsWithHandler< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [RequestGeneric][FastifyRequestGenericInterface], [ContextConfig][ContextConfigGeneric]>

[src](https://github.com/fastify/fastify/blob/main/types/route.d.ts#93)

This interface adds a single, required property to the RouteShorthandOptions
interface `handler` which is of type RouteHandlerMethod

---

#### Parsers

##### RawBody

A generic type that is either a `string` or `Buffer`

##### fastify.FastifyBodyParser< [RawBody][RawBodyGeneric], [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric]>

[src](https://github.com/fastify/fastify/blob/main/types/content-type-parser.d.ts#L7)

A function type definition for specifying a body parser method. Use the
`RawBody` generic to specify the type of the body being parsed.

##### fastify.FastifyContentTypeParser< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric]>

[src](https://github.com/fastify/fastify/blob/main/types/content-type-parser.d.ts#L17)

A function type definition for specifying a body parser method. Content is typed
via the `RawRequest` generic.

##### fastify.AddContentTypeParser< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric]>

[src](https://github.com/fastify/fastify/blob/main/types/content-type-parser.d.ts#L46)

An overloaded interface function definition for the `addContentTypeParser`
method. If `parseAs` is passed to the `opts` parameter, the definition uses
[FastifyBodyParser][] for the `parser` parameter; otherwise, it uses
[FastifyContentTypeParser][].

##### fastify.hasContentTypeParser

[src](https://github.com/fastify/fastify/blob/main/types/content-type-parser.d.ts#L63)

A method for checking the existence of a type parser of a certain content type

---

#### Errors

##### fastify.FastifyError

[src](https://github.com/fastify/fastify/blob/main/fastify.d.ts#L179)

FastifyError is a custom error object that includes status code and validation
results.

It extends the Node.js `Error` type, and adds two additional, optional
properties: `statusCode: number` and `validation: ValidationResult[]`.

##### fastify.ValidationResult

[src](https://github.com/fastify/fastify/blob/main/fastify.d.ts#L184)

The route validation internally relies upon Ajv, which is a high-performance
JSON schema validator.

This interface is passed to instance of FastifyError.

---

#### Hooks

##### fastify.onRequestHookHandler< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [RequestGeneric][FastifyRequestGenericInterface], [ContextConfig][ContextConfigGeneric]>(request: [FastifyRequest][FastifyRequest], reply: [FastifyReply][FastifyReply], done: (err?: [FastifyError][FastifyError]) => void): Promise\<unknown\> | void

[src](https://github.com/fastify/fastify/blob/main/types/hooks.d.ts#L17)

`onRequest` is the first hook to be executed in the request lifecycle. There was
no previous hook, the next hook will be `preParsing`.

Notice: in the `onRequest` hook, request.body will always be null, because the
body parsing happens before the `preHandler` hook.

##### fastify.preParsingHookHandler< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [RequestGeneric][FastifyRequestGenericInterface], [ContextConfig][ContextConfigGeneric]>(request: [FastifyRequest][FastifyRequest], reply: [FastifyReply][FastifyReply], done: (err?: [FastifyError][FastifyError]) => void): Promise\<unknown\> | void

[src](https://github.com/fastify/fastify/blob/main/types/hooks.d.ts#L35)

`preParsing` is the second hook to be executed in the request lifecycle. The
previous hook was `onRequest`, the next hook will be `preValidation`.

Notice: in the `preParsing` hook, request.body will always be null, because the
body parsing happens before the `preValidation` hook.

Notice: you should also add `receivedEncodedLength` property to the returned
stream. This property is used to correctly match the request payload with the
`Content-Length` header value. Ideally, this property should be updated on each
received chunk.

##### fastify.preValidationHookHandler< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [RequestGeneric][FastifyRequestGenericInterface], [ContextConfig][ContextConfigGeneric]>(request: [FastifyRequest][FastifyRequest], reply: [FastifyReply][FastifyReply], done: (err?: [FastifyError][FastifyError]) => void): Promise\<unknown\> | void

[src](https://github.com/fastify/fastify/blob/main/types/hooks.d.ts#L53)

`preValidation` is the third hook to be executed in the request lifecycle. The
previous hook was `preParsing`, the next hook will be `preHandler`.

##### fastify.preHandlerHookHandler< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [RequestGeneric][FastifyRequestGenericInterface], [ContextConfig][ContextConfigGeneric]>(request: [FastifyRequest][FastifyRequest], reply: [FastifyReply][FastifyReply], done: (err?: [FastifyError][FastifyError]) => void): Promise\<unknown\> | void

[src](https://github.com/fastify/fastify/blob/main/types/hooks.d.ts#L70)

`preHandler` is the fourth hook to be executed in the request lifecycle. The
previous hook was `preValidation`, the next hook will be `preSerialization`.

##### fastify.preSerializationHookHandler< PreSerializationPayload, [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [RequestGeneric][FastifyRequestGenericInterface], [ContextConfig][ContextConfigGeneric]>(request: [FastifyRequest][FastifyRequest], reply: [FastifyReply][FastifyReply], payload: PreSerializationPayload, done: (err: [FastifyError][FastifyError] | null, res?: unknown) => void): Promise\<unknown\> | void

[src](https://github.com/fastify/fastify/blob/main/types/hooks.d.ts#L94)

`preSerialization` is the fifth hook to be executed in the request lifecycle.
The previous hook was `preHandler`, the next hook will be `onSend`.

Note: the hook is NOT called if the payload is a string, a Buffer, a stream or
null.

##### fastify.onSendHookHandler< OnSendPayload, [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [RequestGeneric][FastifyRequestGenericInterface], [ContextConfig][ContextConfigGeneric]>(request: [FastifyRequest][FastifyRequest], reply: [FastifyReply][FastifyReply], payload: OnSendPayload, done: (err: [FastifyError][FastifyError] | null, res?: unknown) => void): Promise\<unknown\> | void

[src](https://github.com/fastify/fastify/blob/main/types/hooks.d.ts#L114)

You can change the payload with the `onSend` hook. It is the sixth hook to be
executed in the request lifecycle. The previous hook was `preSerialization`, the
next hook will be `onResponse`.

Note: If you change the payload, you may only change it to a string, a Buffer, a
stream, or null.

##### fastify.onResponseHookHandler< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [RequestGeneric][FastifyRequestGenericInterface], [ContextConfig][ContextConfigGeneric]>(request: [FastifyRequest][FastifyRequest], reply: [FastifyReply][FastifyReply], done: (err?: [FastifyError][FastifyError]) => void): Promise\<unknown\> | void

[src](https://github.com/fastify/fastify/blob/main/types/hooks.d.ts#L134)

`onResponse` is the seventh and last hook in the request hook lifecycle. The
previous hook was `onSend`, there is no next hook.

The onResponse hook is executed when a response has been sent, so you will not
be able to send more data to the client. It can however be useful for sending
data to external services, for example to gather statistics.

##### fastify.onErrorHookHandler< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [RequestGeneric][FastifyRequestGenericInterface], [ContextConfig][ContextConfigGeneric]>(request: [FastifyRequest][FastifyRequest], reply: [FastifyReply][FastifyReply], error: [FastifyError][FastifyError], done: () => void): Promise\<unknown\> | void

[src](https://github.com/fastify/fastify/blob/main/types/hooks.d.ts#L154)

This hook is useful if you need to do some custom error logging or add some
specific header in case of error.

It is not intended for changing the error, and calling reply.send will throw an
exception.

This hook will be executed before the customErrorHandler.

Notice: unlike the other hooks, pass an error to the done function is not
supported.

##### fastify.onRouteHookHandler< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [RequestGeneric][FastifyRequestGenericInterface], [ContextConfig][ContextConfigGeneric]>(opts: [RouteOptions][RouteOptions] & \{ path: string; prefix: string }): Promise\<unknown\> | void

[src](https://github.com/fastify/fastify/blob/main/types/hooks.d.ts#L174)

Triggered when a new route is registered. Listeners are passed a routeOptions
object as the sole parameter. The interface is synchronous, and, as such, the
listener does not get passed a callback

##### fastify.onRegisterHookHandler< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [Logger][LoggerGeneric]>(instance: [FastifyInstance][FastifyInstance], done: (err?: [FastifyError][FastifyError]) => void): Promise\<unknown\> | void

[src](https://github.com/fastify/fastify/blob/main/types/hooks.d.ts#L191)

Triggered when a new plugin is registered and a new encapsulation context is
created. The hook will be executed before the registered code.

This hook can be useful if you are developing a plugin that needs to know when a
plugin context is formed, and you want to operate in that specific context.

Note: This hook will not be called if a plugin is wrapped inside fastify-plugin.

##### fastify.onCloseHookHandler< [RawServer][RawServerGeneric], [RawRequest][RawRequestGeneric], [RawReply][RawReplyGeneric], [Logger][LoggerGeneric]>(instance: [FastifyInstance][FastifyInstance], done: (err?: [FastifyError][FastifyError]) => void): Promise\<unknown\> | void

[src](https://github.com/fastify/fastify/blob/main/types/hooks.d.ts#L206)

Triggered when fastify.close() is invoked to stop the server. It is useful when
plugins need a "shutdown" event, for example to close an open connection to a
database.

<!-- Links -->

[Fastify]: #fastifyrawserver-rawrequest-rawreply-loggeropts-fastifyserveroptions-fastifyinstance
[RawServerGeneric]: #rawserver
[RawRequestGeneric]: #rawrequest
[RawReplyGeneric]: #rawreply
[LoggerGeneric]: #logger
[RawBodyGeneric]: #rawbody
[HTTPMethods]: #fastifyhttpmethods
[RawServerBase]: #fastifyrawserverbase
[RawServerDefault]: #fastifyrawserverdefault
[FastifyRequest]: #fastifyfastifyrequestrawserver-rawrequest-requestgeneric
[FastifyRequestGenericInterface]: #fastifyrequestgenericinterface
[RawRequestDefaultExpression]: #fastifyrawrequestdefaultexpressionrawserver
[FastifyReply]: #fastifyfastifyreplyrawserver-rawreply-contextconfig
[RawReplyDefaultExpression]: #fastifyrawreplydefaultexpression
[FastifyServerOptions]: #fastifyfastifyserveroptions-rawserver-logger
[FastifyInstance]: #fastifyfastifyinstance
[FastifyLoggerOptions]: #fastifyfastifyloggeroptions
[ContextConfigGeneric]: #ContextConfigGeneric
[FastifyPlugin]: #fastifyfastifypluginoptions-rawserver-rawrequest-requestgeneric
[FastifyPluginCallback]: #fastifyfastifyplugincallbackoptions
[FastifyPluginAsync]: #fastifyfastifypluginasyncoptions
[FastifyPluginOptions]: #fastifyfastifypluginoptions
[FastifyRegister]: #fastifyfastifyregisterrawserver-rawrequest-requestgenericplugin-fastifyplugin-opts-fastifyregisteroptions
[FastifyRegisterOptions]: #fastifyfastifytregisteroptions
[LogLevel]: #fastifyloglevel
[FastifyError]: #fastifyfastifyerror
[RouteOptions]: #fastifyrouteoptionsrawserver-rawrequest-rawreply-requestgeneric-contextconfig

## Validation and Serialization

Fastify uses a schema-based approach. We recommend using
[JSON Schema](https://json-schema.org/) to validate routes and serialize outputs.
Fastify compiles the schema into a highly performant function.

Validation is only attempted if the content type is `application/json`.

All examples use the
[JSON Schema Draft 7](https://json-schema.org/specification-links.html#draft-7)
specification.

> ⚠ Warning:
> Treat schema definitions as application code. Validation and serialization
> features use `new Function()`, which is unsafe with user-provided schemas. See
> [Ajv](https://npm.im/ajv) and
> [fast-json-stringify](https://npm.im/fast-json-stringify) for details.
>
> Whilst Fastify supports the
> [`$async` Ajv feature](https://ajv.js.org/guide/async-validation.html),
> it should not be used for initial validation. Accessing databases during
> validation may lead to Denial of Service attacks. Use
> [Fastify's hooks](./Hooks.md) like `preHandler` for `async` tasks after validation.
>
> When using custom validators with async `preValidation` hooks,
> validators **must return** `{error}` objects instead of throwing errors.
> Throwing errors from custom validators will cause unhandled promise rejections
> that crash the application when combined with async hooks. See the
> [custom validator examples](#using-other-validation-libraries) below for the
> correct pattern.

### Core concepts

Validation and serialization are handled by two customizable dependencies:

- [Ajv v8](https://www.npmjs.com/package/ajv) for request validation
- [fast-json-stringify](https://www.npmjs.com/package/fast-json-stringify) for
  response body serialization

These dependencies share only the JSON schemas added to Fastify's instance via
`.addSchema(schema)`.

#### Adding a shared schema

<a id="shared-schema"></a>

The `addSchema` API allows adding multiple schemas to the Fastify instance for
reuse throughout the application. This API is encapsulated.

Shared schemas can be reused with the JSON Schema
[**`$ref`**](https://tools.ietf.org/html/draft-handrews-json-schema-01#section-8)
keyword. Here is an overview of how references work:

- `myField: { $ref: '#foo' }` searches for `$id: '#foo'` in the current schema
- `myField: { $ref: '#/definitions/foo' }` searches for `definitions.foo` in the
  current schema
- `myField: { $ref: 'http://url.com/sh.json#' }` searches for a shared schema
  with `$id: 'http://url.com/sh.json'`
- `myField: { $ref: 'http://url.com/sh.json#/definitions/foo' }` searches for a
  shared schema with `$id: 'http://url.com/sh.json'` and uses `definitions.foo`
- `myField: { $ref: 'http://url.com/sh.json#foo' }` searches for a shared schema
  with `$id: 'http://url.com/sh.json'` and looks for `$id: '#foo'` within it

**Simple usage:**

```js
fastify.addSchema({
  $id: 'http://example.com/',
  type: 'object',
  properties: {
    hello: { type: 'string' },
  },
});

fastify.post('/', {
  handler() {},
  schema: {
    body: {
      type: 'array',
      items: { $ref: 'http://example.com#/properties/hello' },
    },
  },
});
```

**`$ref` as root reference:**

```js
fastify.addSchema({
  $id: 'commonSchema',
  type: 'object',
  properties: {
    hello: { type: 'string' },
  },
});

fastify.post('/', {
  handler() {},
  schema: {
    body: { $ref: 'commonSchema#' },
    headers: { $ref: 'commonSchema#' },
  },
});
```

#### Retrieving the shared schemas

<a id="get-shared-schema"></a>

If the validator and serializer are customized, `.addSchema` is not useful since
Fastify no longer controls them. To access schemas added to the Fastify instance,
use `.getSchemas()`:

```js
fastify.addSchema({
  $id: 'schemaId',
  type: 'object',
  properties: {
    hello: { type: 'string' },
  },
});

const mySchemas = fastify.getSchemas();
const mySchema = fastify.getSchema('schemaId');
```

The `getSchemas` function is encapsulated and returns shared schemas available
in the selected scope:

```js
fastify.addSchema({ $id: 'one', my: 'hello' });
// will return only `one` schema
fastify.get('/', (request, reply) => {
  reply.send(fastify.getSchemas());
});

fastify.register((instance, opts, done) => {
  instance.addSchema({ $id: 'two', my: 'ciao' });
  // will return `one` and `two` schemas
  instance.get('/sub', (request, reply) => {
    reply.send(instance.getSchemas());
  });

  instance.register((subinstance, opts, done) => {
    subinstance.addSchema({ $id: 'three', my: 'hola' });
    // will return `one`, `two` and `three`
    subinstance.get('/deep', (request, reply) => {
      reply.send(subinstance.getSchemas());
    });
    done();
  });
  done();
});
```

### Validation

Route validation relies on [Ajv v8](https://www.npmjs.com/package/ajv), a
high-performance JSON Schema validator. To validate input, add the required
fields to the route schema.

Supported validations include:

- `body`: validates the request body for POST, PUT, or PATCH methods.
- `querystring` or `query`: validates the query string.
- `params`: validates the route parameters.
- `headers`: validates the request headers.

Validations can be a complete JSON Schema object with a `type` of `'object'` and
a `'properties'` object containing parameters, or a simpler variation listing
parameters at the top level.

> ℹ For using the latest Ajv (v8), refer to the
> [`schemaController`](./Server.md#schema-controller) section.

Example:

```js
const bodyJsonSchema = {
  type: 'object',
  required: ['requiredKey'],
  properties: {
    someKey: { type: 'string' },
    someOtherKey: { type: 'number' },
    requiredKey: {
      type: 'array',
      maxItems: 3,
      items: { type: 'integer' },
    },
    nullableKey: { type: ['number', 'null'] }, // or { type: 'number', nullable: true }
    multipleTypesKey: { type: ['boolean', 'number'] },
    multipleRestrictedTypesKey: {
      oneOf: [
        { type: 'string', maxLength: 5 },
        { type: 'number', minimum: 10 },
      ],
    },
    enumKey: {
      type: 'string',
      enum: ['John', 'Foo'],
    },
    notTypeKey: {
      not: { type: 'array' },
    },
  },
};

const queryStringJsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    excitement: { type: 'integer' },
  },
};

const paramsJsonSchema = {
  type: 'object',
  properties: {
    par1: { type: 'string' },
    par2: { type: 'number' },
  },
};

const headersJsonSchema = {
  type: 'object',
  properties: {
    'x-foo': { type: 'string' },
  },
  required: ['x-foo'],
};

const schema = {
  body: bodyJsonSchema,
  querystring: queryStringJsonSchema,
  params: paramsJsonSchema,
  headers: headersJsonSchema,
};

fastify.post('/the/url', { schema }, handler);
```

For `body` schema, it is further possible to differentiate the schema per content
type by nesting the schemas inside `content` property. The schema validation
will be applied based on the `Content-Type` header in the request.

```js
fastify.post(
  '/the/url',
  {
    schema: {
      body: {
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
          'text/plain': {
            schema: { type: 'string' },
          },
          // Other content types will not be validated
        },
      },
    },
  },
  handler
);
```

Note that Ajv will try to [coerce](https://ajv.js.org/coercion.html) values to
the types specified in the schema `type` keywords, both to pass validation and
to use the correctly typed data afterwards.

The Ajv default configuration in Fastify supports coercing array parameters in
`querystring`. Example:

```js
const opts = {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          default: [],
        },
      },
    },
  },
};

fastify.get('/', opts, (request, reply) => {
  reply.send({ params: request.query }); // echo the querystring
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
});
```

```sh
curl -X GET "http://localhost:3000/?ids=1

{"params":{"ids":["1"]}}
```

A custom schema validator can be specified for each parameter type (body,
querystring, params, headers).

For example, the following code disables type coercion only for the `body`
parameters, changing the Ajv default options:

```js
const schemaCompilers = {
  body: new Ajv({
    removeAdditional: false,
    coerceTypes: false,
    allErrors: true,
  }),
  params: new Ajv({
    removeAdditional: false,
    coerceTypes: true,
    allErrors: true,
  }),
  querystring: new Ajv({
    removeAdditional: false,
    coerceTypes: true,
    allErrors: true,
  }),
  headers: new Ajv({
    removeAdditional: false,
    coerceTypes: true,
    allErrors: true,
  }),
};

server.setValidatorCompiler((req) => {
  if (!req.httpPart) {
    throw new Error('Missing httpPart');
  }
  const compiler = schemaCompilers[req.httpPart];
  if (!compiler) {
    throw new Error(`Missing compiler for ${req.httpPart}`);
  }
  return compiler.compile(req.schema);
});
```

For more information, see [Ajv Coercion](https://ajv.js.org/coercion.html).

#### Ajv Plugins

<a id="ajv-plugins"></a>

A list of plugins can be provided for use with the default `ajv` instance.
Ensure the plugin is **compatible with the Ajv version shipped within Fastify**.

> Refer to [`ajv options`](./Server.md#ajv) to check plugins format.

```js
const fastify = require('fastify')({
  ajv: {
    plugins: [require('ajv-merge-patch')],
  },
});

fastify.post('/', {
  handler(req, reply) {
    reply.send({ ok: 1 });
  },
  schema: {
    body: {
      $patch: {
        source: {
          type: 'object',
          properties: {
            q: {
              type: 'string',
            },
          },
        },
        with: [
          {
            op: 'add',
            path: '/properties/q',
            value: { type: 'number' },
          },
        ],
      },
    },
  },
});

fastify.post('/foo', {
  handler(req, reply) {
    reply.send({ ok: 1 });
  },
  schema: {
    body: {
      $merge: {
        source: {
          type: 'object',
          properties: {
            q: {
              type: 'string',
            },
          },
        },
        with: {
          required: ['q'],
        },
      },
    },
  },
});
```

#### Validator Compiler

<a id="schema-validator"></a>

The `validatorCompiler` is a function that returns a function to validate the
body, URL parameters, headers, and query string. The default `validatorCompiler`
returns a function that implements the [ajv](https://ajv.js.org/) validation
interface. Fastify uses it internally to speed up validation.

Fastify's [baseline ajv
configuration](https://github.com/fastify/ajv-compiler#ajv-configuration) is:

```js
{
  coerceTypes: 'array', // change data type of data to match type keyword
  useDefaults: true, // replace missing properties and items with the values from corresponding default keyword
  removeAdditional: true, // remove additional properties if additionalProperties is set to false, see: https://ajv.js.org/guide/modifying-data.html#removing-additional-properties
  uriResolver: require('fast-uri'),
  addUsedSchema: false,
  // Explicitly set allErrors to `false`.
  // When set to `true`, a DoS attack is possible.
  allErrors: false
}
```

Modify the baseline configuration by providing
[`ajv.customOptions`](./Server.md#factory-ajv) to the Fastify factory.

To change or set additional config options, create a custom instance and
override the existing one:

```js
const fastify = require('fastify')();
const Ajv = require('ajv');
const ajv = new Ajv({
  removeAdditional: 'all',
  useDefaults: true,
  coerceTypes: 'array',
  // any other options
  // ...
});
fastify.setValidatorCompiler(({ schema, method, url, httpPart }) => {
  return ajv.compile(schema);
});
```

> ℹ️ Note: When using a custom validator instance, add schemas to the validator
> instead of Fastify. Fastify's `addSchema` method will not recognize the custom
> validator.

##### Using other validation libraries

<a id="using-other-validation-libraries"></a>

The `setValidatorCompiler` function allows substituting `ajv` with other
JavaScript validation libraries like [joi](https://github.com/hapijs/joi/) or
[yup](https://github.com/jquense/yup/), or a custom one:

```js
const Joi = require('joi');

fastify.setValidatorCompiler(({ schema }) => {
  return (data) => {
    try {
      const { error, value } = schema.validate(data);
      if (error) {
        return { error }; // Return the error, do not throw it
      }
      return { value };
    } catch (e) {
      return { error: e }; // Catch any unexpected errors too
    }
  };
});

fastify.post(
  '/the/url',
  {
    schema: {
      body: Joi.object()
        .keys({
          hello: Joi.string().required(),
        })
        .required(),
    },
  },
  handler
);
```

```js
const yup = require('yup');
// Validation options to match ajv's baseline options used in Fastify
const yupOptions = {
  strict: false,
  abortEarly: false, // return all errors
  stripUnknown: true, // remove additional properties
  recursive: true,
};

fastify.post(
  '/the/url',
  {
    schema: {
      body: yup.object({
        age: yup.number().integer().required(),
        sub: yup
          .object()
          .shape({
            name: yup.string().required(),
          })
          .required(),
      }),
    },
    validatorCompiler: ({ schema, method, url, httpPart }) => {
      return function (data) {
        // with option strict = false, yup `validateSync` function returns the
        // coerced value if validation was successful, or throws if validation failed
        try {
          const result = schema.validateSync(data, yupOptions);
          return { value: result };
        } catch (e) {
          return { error: e };
        }
      };
    },
  },
  handler
);
```

##### Custom Validator Best Practices

When implementing custom validators, follow these patterns to ensure compatibility
with all Fastify features:

** Always return objects, never throw:**

```js
return { value: validatedData }; // On success
return { error: validationError }; // On failure
```

** Use try-catch for safety:**

```js
fastify.setValidatorCompiler(({ schema }) => {
  return (data) => {
    try {
      // Validation logic here
      const result = schema.validate(data);
      if (result.error) {
        return { error: result.error };
      }
      return { value: result.value };
    } catch (e) {
      // Catch any unexpected errors
      return { error: e };
    }
  };
});
```

This pattern ensures validators work correctly with both sync and async
`preValidation` hooks, preventing unhandled promise rejections that can crash
an application.

##### .statusCode property

All validation errors have a `.statusCode` property set to `400`, ensuring the
default error handler sets the response status code to `400`.

```js
fastify.setErrorHandler(function (error, request, reply) {
  request.log.error(error, `This error has status code ${error.statusCode}`);
  reply.status(error.statusCode).send(error);
});
```

##### Validation messages with other validation libraries

Fastify's validation error messages are tightly coupled to the default
validation engine: errors returned from `ajv` are eventually run through the
`schemaErrorFormatter` function which builds human-friendly error messages.
However, the `schemaErrorFormatter` function is written with `ajv` in mind.
This may result in odd or incomplete error messages when using other validation
libraries.

To circumvent this issue, there are two main options:

1. Ensure the validation function (returned by the custom `schemaCompiler`)
   returns errors in the same structure and format as `ajv`.
2. Use a custom `errorHandler` to intercept and format custom validation errors.

Fastify adds two properties to all validation errors to help write a custom
`errorHandler`:

- `validation`: the content of the `error` property of the object returned by
  the validation function (returned by the custom `schemaCompiler`)
- `validationContext`: the context (body, params, query, headers) where the
  validation error occurred

A contrived example of such a custom `errorHandler` handling validation errors
is shown below:

```js
const errorHandler = (error, request, reply) => {
  const statusCode = error.statusCode;
  let response;

  const { validation, validationContext } = error;

  // check if we have a validation error
  if (validation) {
    response = {
      // validationContext will be 'body', 'params', 'headers', or 'query'
      message: `A validation error occurred when validating the ${validationContext}...`,
      // this is the result of the validation library...
      errors: validation,
    };
  } else {
    response = {
      message: 'An error occurred...',
    };
  }

  // any additional work here, eg. log error
  // ...

  reply.status(statusCode).send(response);
};
```

### Serialization

<a id="serialization"></a>

Fastify uses [fast-json-stringify](https://www.npmjs.com/package/fast-json-stringify)
to send data as JSON if an output schema is provided in the route options. Using
an output schema can drastically increase throughput and help prevent accidental
disclosure of sensitive information.

Example:

```js
const schema = {
  response: {
    200: {
      type: 'object',
      properties: {
        value: { type: 'string' },
        otherValue: { type: 'boolean' },
      },
    },
  },
};

fastify.post('/the/url', { schema }, handler);
```

The response schema is based on the status code. To use the same schema for
multiple status codes, use `'2xx'` or `default`, for example:

```js
const schema = {
  response: {
    default: {
      type: 'object',
      properties: {
        error: {
          type: 'boolean',
          default: true,
        },
      },
    },
    '2xx': {
      type: 'object',
      properties: {
        value: { type: 'string' },
        otherValue: { type: 'boolean' },
      },
    },
    201: {
      // the contract syntax
      value: { type: 'string' },
    },
  },
};

fastify.post('/the/url', { schema }, handler);
```

A specific response schema can be defined for different content types.
For example:

```js
const schema = {
  response: {
    200: {
      description: 'Response schema that support different content types'
      content: {
        'application/json': {
          schema: {
            name: { type: 'string' },
            image: { type: 'string' },
            address: { type: 'string' }
          }
        },
        'application/vnd.v1+json': {
          schema: {
            type: 'array',
            items: { $ref: 'test' }
          }
        }
      }
    },
    '3xx': {
      content: {
        'application/vnd.v2+json': {
          schema: {
            fullName: { type: 'string' },
            phone: { type: 'string' }
          }
        }
      }
    },
    default: {
      content: {
        // */* is match-all content-type
        '*/*': {
          schema: {
            desc: { type: 'string' }
          }
        }
      }
    }
  }
}

fastify.post('/url', { schema }, handler)
```

#### Serializer Compiler

<a id="schema-serializer"></a>

The `serializerCompiler` returns a function that must return a string from an
input object. When defining a response JSON Schema, change the default
serialization method by providing a function to serialize each route.

```js
fastify.setSerializerCompiler(
  ({ schema, method, url, httpStatus, contentType }) => {
    return (data) => JSON.stringify(data);
  }
);

fastify.get('/user', {
  handler(req, reply) {
    reply.send({ id: 1, name: 'Foo', image: 'BIG IMAGE' });
  },
  schema: {
    response: {
      '2xx': {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
        },
      },
    },
  },
});
```

_To set a custom serializer in a specific part of the code, use
[`reply.serializer(...)`](./Reply.md#serializerfunc)._

### Error Handling

When schema validation fails for a request, Fastify will automatically return a
status 400 response including the result from the validator in the payload. For
example, if the following schema is used for a route:

```js
const schema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
    required: ['name'],
  },
};
```

If the request fails to satisfy the schema, the route will return a response
with the following payload:

```js
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "body should have required property 'name'"
}
```

To handle errors inside the route, specify the `attachValidation` option. If
there is a validation error, the `validationError` property of the request will
contain the `Error` object with the raw validation result as shown below:

```js
const fastify = Fastify();

fastify.post('/', { schema, attachValidation: true }, function (req, reply) {
  if (req.validationError) {
    // `req.validationError.validation` contains the raw validation error
    reply.code(400).send(req.validationError);
  }
});
```

#### `schemaErrorFormatter`

To format errors, provide a sync function that returns an error as the
`schemaErrorFormatter` option when instantiating Fastify. The context function
will be the Fastify server instance.

`errors` is an array of Fastify schema errors `FastifySchemaValidationError`.
`dataVar` is the currently validated part of the schema (params, body,
querystring, headers).

```js
const fastify = Fastify({
  schemaErrorFormatter: (errors, dataVar) => {
    // ... my formatting logic
    return new Error(myErrorMessage);
  },
});

// or
fastify.setSchemaErrorFormatter(function (errors, dataVar) {
  this.log.error({ err: errors }, 'Validation failed');
  // ... my formatting logic
  return new Error(myErrorMessage);
});
```

Use [setErrorHandler](./Server.md#seterrorhandler) to define a custom response
for validation errors such as:

```js
fastify.setErrorHandler(function (error, request, reply) {
  if (error.validation) {
    reply.status(422).send(new Error('validation failed'));
  }
});
```

For custom error responses in the schema, see
[`ajv-errors`](https://github.com/epoberezkin/ajv-errors). Check out the
[example](https://github.com/fastify/example/blob/HEAD/validation-messages/custom-errors-messages.js)
usage.

> Install version 1.0.1 of `ajv-errors`, as later versions are not compatible
> with AJV v6 (the version shipped by Fastify v3).

Below is an example showing how to add **custom error messages for each
property** of a schema by supplying custom AJV options. Inline comments in the
schema describe how to configure it to show a different error message for each
case:

```js
const fastify = Fastify({
  ajv: {
    customOptions: {
      jsonPointers: true,
      // ⚠ Warning: Enabling this option may lead to this security issue https://www.cvedetails.com/cve/CVE-2020-8192/
      allErrors: true,
    },
    plugins: [require('ajv-errors')],
  },
});

const schema = {
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        errorMessage: {
          type: 'Bad name',
        },
      },
      age: {
        type: 'number',
        errorMessage: {
          type: 'Bad age', // specify custom message for
          min: 'Too young', // all constraints except required
        },
      },
    },
    required: ['name', 'age'],
    errorMessage: {
      required: {
        name: 'Why no name!', // specify error message for when the
        age: 'Why no age!', // property is missing from input
      },
    },
  },
};

fastify.post('/', { schema }, (request, reply) => {
  reply.send({
    hello: 'world',
  });
});
```

To return localized error messages, see
[ajv-i18n](https://github.com/epoberezkin/ajv-i18n).

```js
const localize = require('ajv-i18n');

const fastify = Fastify();

const schema = {
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      age: {
        type: 'number',
      },
    },
    required: ['name', 'age'],
  },
};

fastify.setErrorHandler(function (error, request, reply) {
  if (error.validation) {
    localize.ru(error.validation);
    reply.status(400).send(error.validation);
    return;
  }
  reply.send(error);
});
```

### JSON Schema support

JSON Schema provides utilities to optimize schemas. Combined with Fastify's
shared schema, all schemas can be easily reused.

| Use Case                               | Validator | Serializer |
| -------------------------------------- | --------- | ---------- |
| `$ref` to `$id`                        | ️️✔️      | ✔️         |
| `$ref` to `/definitions`               | ✔️        | ✔️         |
| `$ref` to shared schema `$id`          | ✔️        | ✔️         |
| `$ref` to shared schema `/definitions` | ✔️        | ✔️         |

#### Examples

##### Usage of `$ref` to `$id` in same JSON Schema

```js
const refToId = {
  type: 'object',
  definitions: {
    foo: {
      $id: '#address',
      type: 'object',
      properties: {
        city: { type: 'string' },
      },
    },
  },
  properties: {
    home: { $ref: '#address' },
    work: { $ref: '#address' },
  },
};
```

##### Usage of `$ref` to `/definitions` in same JSON Schema

```js
const refToDefinitions = {
  type: 'object',
  definitions: {
    foo: {
      $id: '#address',
      type: 'object',
      properties: {
        city: { type: 'string' },
      },
    },
  },
  properties: {
    home: { $ref: '#/definitions/foo' },
    work: { $ref: '#/definitions/foo' },
  },
};
```

##### Usage `$ref` to a shared schema `$id` as external schema

```js
fastify.addSchema({
  $id: 'http://foo/common.json',
  type: 'object',
  definitions: {
    foo: {
      $id: '#address',
      type: 'object',
      properties: {
        city: { type: 'string' },
      },
    },
  },
});

const refToSharedSchemaId = {
  type: 'object',
  properties: {
    home: { $ref: 'http://foo/common.json#address' },
    work: { $ref: 'http://foo/common.json#address' },
  },
};
```

##### Usage `$ref` to a shared schema `/definitions` as external schema

```js
fastify.addSchema({
  $id: 'http://foo/shared.json',
  type: 'object',
  definitions: {
    foo: {
      type: 'object',
      properties: {
        city: { type: 'string' },
      },
    },
  },
});

const refToSharedSchemaDefinitions = {
  type: 'object',
  properties: {
    home: { $ref: 'http://foo/shared.json#/definitions/foo' },
    work: { $ref: 'http://foo/shared.json#/definitions/foo' },
  },
};
```

### Resources

<a id="resources"></a>

- [JSON Schema](https://json-schema.org/)
- [Understanding JSON
  Schema](https://spacetelescope.github.io/understanding-json-schema/)
- [fast-json-stringify
  documentation](https://github.com/fastify/fast-json-stringify)
- [Ajv documentation](https://github.com/epoberezkin/ajv/blob/master/README.md)
- [Ajv i18n](https://github.com/epoberezkin/ajv-i18n)
- [Ajv custom errors](https://github.com/epoberezkin/ajv-errors)
- Custom error handling with core methods with error file dumping
  [example](https://github.com/fastify/example/tree/main/validation-messages)

  **Table of contents**

- [Warnings](#warnings)
  - [Warnings In Fastify](#warnings-in-fastify)
  - [Fastify Warning Codes](#fastify-warning-codes)
    - [FSTWRN001](#FSTWRN001)
    - [FSTWRN002](#FSTWRN002)
  - [Fastify Deprecation Codes](#fastify-deprecation-codes)

## Warnings

### Warnings In Fastify

Fastify uses Node.js's [warning event](https://nodejs.org/api/process.html#event-warning)
API to notify users of deprecated features and coding mistakes. Fastify's
warnings are recognizable by the `FSTWRN` and `FSTDEP` prefixes. When
encountering such a warning, it is highly recommended to determine the cause
using the [`--trace-warnings`](https://nodejs.org/api/cli.html#--trace-warnings)
and [`--trace-deprecation`](https://nodejs.org/api/cli.html#--trace-deprecation)
flags. These produce stack traces pointing to where the issue occurs in the
application's code. Issues opened about warnings without this information will
be closed due to lack of details.

Warnings can also be disabled, though it is not recommended. If necessary, use
one of the following methods:

- Set the `NODE_NO_WARNINGS` environment variable to `1`
- Pass the `--no-warnings` flag to the node process
- Set `no-warnings` in the `NODE_OPTIONS` environment variable

For more information on disabling warnings, see [Node's documentation](https://nodejs.org/api/cli.html).

Disabling warnings may cause issues when upgrading Fastify versions. Only
experienced users should consider disabling warnings.

### Fastify Warning Codes

| Code                            | Description                                                                                                   | How to solve                         | Discussion                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| <a id="FSTWRN001">FSTWRN001</a> | The specified schema for a route is missing. This may indicate the schema is not well specified.              | Check the schema for the route.      | [#4647](https://github.com/fastify/fastify/pull/4647) |
| <a id="FSTWRN002">FSTWRN002</a> | The %s plugin being registered mixes async and callback styles, which will result in an error in `fastify@5`. | Do not mix async and callback style. | [#5139](https://github.com/fastify/fastify/pull/5139) |

### Fastify Deprecation Codes

Deprecation codes are supported by the Node.js CLI options:

- [--no-deprecation](https://nodejs.org/api/cli.html#--no-deprecation)
- [--throw-deprecation](https://nodejs.org/api/cli.html#--throw-deprecation)
- [--trace-deprecation](https://nodejs.org/api/cli.html#--trace-deprecation)

| Code | Description | How to solve | Discussion |
| ---- | ----------- | ------------ | ---------- |
