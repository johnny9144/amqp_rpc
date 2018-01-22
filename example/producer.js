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
  const data = { value: 'hello world' };
  const result = await amqp.callRPC( queueName, data);
  console.log( result);
})();
