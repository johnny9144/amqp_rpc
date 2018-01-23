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
