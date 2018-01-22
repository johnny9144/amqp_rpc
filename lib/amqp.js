const debug = require('debug')('dev:libs:amqp');
const amqp = require('amqplib');
const uuid = require('node-uuid');
const Promise = require('bluebird');
const onRPCList = [];
let connection = false;
debug( 'load');

module.exports = {
  init: async function ( settings) {
    try {
      await getConnection(`amqp://${settings.user}:${settings.pass}@${settings.host}:${settings.port}/${settings.vhost}`);
      return;
    } catch ( e) {
      throw `amqp init error: ${e}`;
    }
  },
  callRPC: async function ( qName, data, timeout = 30) {
    let ch;
    try {
      if( !connection)
        throw 'connection_error';

      ch = await connection.createChannel();
      // 這邊如果沒有把 channel prototype 的 exception 接起來，會造成再上一個層級的 connection exception
      // 以致於 下面的 catch 就會失效
      ch.on( 'error', e => {
        debug( e);
      });
      debug( qName);
      await ch.checkQueue( qName).catch(()=> {
        throw 'un_exists_queue';
      });
      const qok = await ch.assertQueue( '', { exclusive: true, autoDelete: true });
      const backObj = await new Promise( async ( resolve, reject) => {
        await ch.consume( qok.queue, msg => {
          if( !msg)
            return reject( 'amqp_got_null_return');

          if( ch)
            ch.close();
          resolve( JSON.parse( msg.content.toString()));
        }, { noAck: true });
        ch.sendToQueue( qName, Buffer.from( JSON.stringify( data)), { correlationId: uuid(), replyTo: qok.queue });
      })
        .timeout( 1000 * timeout, `Queue: ${qName} timeout`)  
        .catch( Promise.TimeoutError, e => {
          ch.close();
          throw e;
        });
      return backObj;
    } catch( e) {
      throw `callRPC error: ${e}`;
    }
  },
  onRPC: async function ( qName, callback) {
    onRPCList.push( { qName, callback }); 
    onRPC( qName, callback);
  }
};

async function onRPC ( qName, callback) {
  let ch;
  try {
    if( !connection)
      throw 'connection_error';

    ch = await connection.createChannel();
    await ch.assertQueue( qName, {
      durable: false, 
      auto_delete:true 
    });
    ch.prefetch( 10);
    debug( `onRPC ${qName}`);
    ch.consume( qName, msg => {
      const data = JSON.parse( msg.content.toString());
      return callback(
        data,
        out => {
          ch.sendToQueue( msg.properties.replyTo,
            Buffer.from( JSON.stringify( out)),
            { correlationId: msg.properties.correlationId });
          ch.ack( msg);
        }
      );
    });
  } catch ( e) {
    debug( `AMQP.onRPC error ${e}`);
    debug( e.stack);
  }
}
async function getConnection( url) {
  debug( 'connect to mq');
  const conn = await amqp.connect( url);
  debug( 'connection build');
  connection = conn;
  conn.on('close', () => {
    connection = false;
    debug( 'AMQP connection close !');
    setTimeout( async () => {
      await getConnection( url);
      Promise.each( onRPCList, item => {
        onRPC( item.qName, item.callback);
      });
    }, 1000 * 5);
  });

  conn.on('error', err => {
    debug( err);
  });
}
