# node-amqp-rpc( Promise )
![Version](http://img.shields.io/npm/v/node_amqp_rpc.svg) &nbsp;
![License](http://img.shields.io/npm/l/node_amqp_rpc.svg) &nbsp;
![Monthly downloads](http://img.shields.io/npm/dm/node_amqp_rpc.svg) &nbsp;
[![Download Stats](https://img.shields.io/npm/dm/node_amqp_rpc.svg)](https://github.com/johnny9144/amqp_rpc)

Library to help you use amqp RPC on easy way.

## Installation

To install randomstring, use [npm](http://github.com/npm/npm):

```
npm install node_amqp_rpc
```

## Usage
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

 - constructor 
 	- `Object`
 		- host - Your amqp server address ( Type: String || default: localhost)
    	- port - AMQP server port( Type: Integer || default: 5672 )
    	- user - The amqp account which you want to login ( Type: String )
    	- password - password ( Type: String )
    	- vhost - Virtual Hosts( Type: String || default: / )
 - `init`
 	- Need to be execute before callRPC and onRPC
 - `callRPC`
 	- `String`
 		- queue name  
 	- `Object`
 	- `Integer`
 		- timeout ( seconds, default: 30s)
 - `onRPC`
	- `String`
		- queue name 
	- `Function`( data, send) 	

	
## HISTORY
- v1.0.0
	- Publish.
- v1.2.0
	- Turn library in to ES6 Classes. 
	- Connection config field 'pass' rename to 'password'.
	- Set default value for field ( host, port ).

## LICENSE

node\_amqp\_rpc is licensed under the MIT license.