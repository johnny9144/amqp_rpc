const amqp = require('amqp_rpc');
(async () => {
  await amqp.init({
    host : 'mq.dev.brandma.co',
    port : 5672,
    user : 'guest',
    pass : 'guest',
    vhost : '/'
  });

  const queueName = 'hello.word';
  amqp.onRPC( queueName, ( data, send) => {
    console.log( data);
    send( { value: 'consumer say hello to you' });
  });
})();
