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
