# node-amqp-rpc

Library to help you use amqp RPC on easy way.

## Installation

To install randomstring, use [npm](http://github.com/npm/npm):

```
npm install amqp_rpc
```

## Usage

### producer
```javascript
const amqp = require('amqp_rpc');
(async () => {
	await amqp.init({
		host : 'localhost',
		port : 5672,
		user : 'guest',
		pass : 'guest',
		vhost : '/'
	});
	
	const queueName = 'hello.word';
	const data = { value: 'hello world' };
	const result = await amqp.callRPC( queueName, data);
	console.log( result);
	// { value: 'consumer say hello to you' }
})();
```
### consumer

```javascript
const amqp = require('amqp_rpc');
(async () => {
	await amqp.init({
		host : 'localhost',
		port : 5672,
		user : 'guest',
		pass : 'guest',
		vhost : '/'
	});
	
	const queueName = 'hello.word';
	amqp.onRPC( queueName, ( data, send) => {
		console.log( data);
		// { value: 'hello world' }
		send( { value: 'consumer say hello to you' });
	});
})();
```

## API

`amqp.`

 - `init`
 	- `Object`
 		- host - Your amqp server address ( Type: String )
    	- port - AMQP server port( Type: Integer || default: 5672 )
    	- user - The amqp account which you want to login ( Type: String )
    	- pass - password ( Type: String )
    	- vhost - Virtual Hosts( Type: String || default: / )
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

## LICENSE

node-randomstring is licensed under the MIT license.