# node-amqp-rpc( Promise )
![Version](http://img.shields.io/npm/v/node_amqp_rpc.svg) &nbsp;
![License](http://img.shields.io/npm/l/node_amqp_rpc.svg) &nbsp;
![Download Stats](https://img.shields.io/npm/dm/node_amqp_rpc.svg)

Library to help you use amqp RPC on easy way.

## Installation

To install randomstring, use [npm](http://github.com/npm/npm):

```
npm install node_amqp_rpc
```

## Usage
### Quick Start
```javascript
const amqp_api = require('node_amqp_rpc');
(async () => {
	const amqp = await amqp_api.quickStart( 'amqp://guest:guest@localhost:5672/');
	const queueName = 'hello.word';
	amqp.onRPC( queueName, ( data, send) => {
		console.log( data);
		// { value: 'hello world' }
		send( { value: 'consumer say hello to you' });
	});
	
	const data = { value: 'hello world' };
	const result = await amqp.callRPC( queueName, data);
	console.log( result);
	// { value: 'consumer say hello to you' }
})();

```
### producer
```javascript
const amqp_api = require('node_amqp_rpc');
(async () => {
	const amqp = new amqp_api({
		host : 'localhost',
		port : 5672,
		user : 'guest',
		password : 'guest',
		vhost : '/'
	});
	await amqp.init();
	
	const queueName = 'hello.word';
	const data = { value: 'hello world' };
	const result = await amqp.callRPC( queueName, data);
	console.log( result);
	// { value: 'consumer say hello to you' }
})();
```
### consumer

```javascript
const amqp_api = require('node_amqp_rpc');
(async () => {
	const amqp = new amqp_api({
		host : 'localhost',
		port : 5672,
		user : 'guest',
		password : 'guest',
		vhost : '/'
	});
	await amqp.init();
	
	const queueName = 'hello.word';
	amqp.onRPC( queueName, ( data, send) => {
		console.log( data);
		// { value: 'hello world' }
		send( { value: 'consumer say hello to you' });
	});
})();
```

## API

 - constructor ( Object | String )
 	- `Object`
 		- host - Your amqp server address ( Type: String || default: localhost)
    	- port - AMQP server port( Type: Integer || default: 5672 )
    	- user - The amqp account which you want to login ( Type: String )
    	- password - password ( Type: String )
    	- vhost - Virtual Hosts( Type: String || default: / )
    - `String`
    	- amqp[s]://[user:password@]hostname[:port][/vhost]
    	- ex. amqp://guest:guest@localhost:5672/
 - `init` ()
 	- Need to be execute before callRPC and onRPC
 - `callRPC` ( QueueName, Data, Timeout )
 	- `QueueName` ( String | Required )
 		- queue name  
 	- `Data` ( Object | Required )
 		- data you want to send 
 	- `Timeout` ( Integer | Option | Default: 30 )
 		- timeout seconds
 - `onRPC` ( QueueName, DoSomething )
	- `QueueName` ( String | Required )
 		- queue name
	- `DoSomething` ( Function | Required )
		- Receives the following arguments
			- data ( Object )
			- send ( Function )
 - `quickStart` ( Object | String )
   - `Object`
 		- host - Your amqp server address ( Type: String || default: localhost)
    	- port - AMQP server port( Type: Integer || default: 5672 )
    	- user - The amqp account which you want to login ( Type: String )
    	- password - password ( Type: String )
    	- vhost - Virtual Hosts( Type: String || default: / )
    - `String`
    	- amqp[s]://[user:password@]hostname[:port][/vhost]
    	- ex. amqp://guest:guest@localhost:5672/
 - `callPublish` ( exchange, routingKey, Data)
 	- `exchange` ( String | Required )
 	- `routingKey` ( String | Required )
 	- `Data` ( Object | Required )
 		- data you want to send 
 - `close` ()
 	- Close amqp connection
	
## HISTORY
- v1.0.0
	- Publish.
- v2.0.0
	- Turn library in to ES6 Classes. 
	- Connection config field 'pass' rename to 'password'.
	- Set default value for field ( host, port ).
- v2.1.0
	- Add quickStart method.
	- Add connection close method.
	- accept amqp url to start connection.
- v2.2.0
	- Support multi connection 
- v2.3.0
	- Add callPublish method.

## LICENSE

node\_amqp\_rpc is licensed under the MIT license.
