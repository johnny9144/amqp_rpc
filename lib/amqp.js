const debug = require('debug')('dev:libs:amqp');
const amqp = require('amqplib');
const uuid = require('node-uuid');
const _ = require('lodash');
const Promise = require('bluebird');
const onRPCList = [];
let connection = false;
debug( 'load');

class RPC {
  constructor ( settings) {
    if( !_.get( settings, 'user') || !_.get( settings, 'password'))
      throw 'config_error';

    this.config = settings;
  }

  async init() {
    await getConnection(`amqp://${this.config.user}:${this.config.password}@${ _.get( this, 'config.host', 'localhost')}:${ _.get( this, 'config.port', 5672)}/${_.get( this, 'config.vhost', '')}`);
  }

  async callRPC ( qName, data, timeout = 30) {
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
      return new Promise( async ( resolve, reject) => {
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
    } catch( e) {
      throw `callRPC error: ${e}`;
    }
  }

  async onRPC ( qName, callback) {
    onRPCList.push( { qName, callback }); 
    onRPC( qName, callback);
  }
}

module.exports = RPC;

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
