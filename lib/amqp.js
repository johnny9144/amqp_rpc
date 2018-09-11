const debug = require('debug')('dev:libs:amqp');
const amqp = require('amqplib');
const uuid = require('node-uuid');
const _ = require('lodash');
const Promise = require('bluebird');
debug( 'load');

class RPC {
  constructor ( settings) {
    if( _.isString( settings))
      this.config = settings;
    else {
      if( !_.get( settings, 'user') || !_.get( settings, 'password'))
        throw 'config_error';

      this.config = `amqp://${settings.user}:${settings.password}@${_.get( settings, 'host', 'localhost')}:${_.get( settings, 'port', 5672)}${_.get( settings, 'vhost', '')}`;
    }
    this.connection = false;
  }

  async init() {
    try {
      debug( 'connect to mq');
      this.connection = await amqp.connect( this.config);
      this.closeTag = false;
      this.onRPCList = [];
      debug( 'connection build');
      this.connection.on('close', () => {
        this.connection = false;
        debug( 'connection close!');
        if( this.closeTag)
          return;

        setTimeout( async () => {
          this.connection = await amqp.connect( this.config);
          debug( 'connection reconnect!');
          Promise.each( this.onRPCList, item => {
            this.onRPC( item.qName, item.callback);
          });
        }, 1000 * 5);
      });

      this.connection.on('error', err => {
        debug( err);
      });
      this.ch = await this.connection.createChannel();
      this.ch.on( 'error', e => {
        debug( e);
      });
    } catch ( e) {
      throw `connection error: ${e}`;
    }
  }

  async close() {
    try {
      this.closeTag = true;
      await this.connection.close();
    } catch ( e) {
      throw `connection error: ${e}`;
    }
  }

  async callRPC ( qName, data, timeout = 30) {
    let ch;
    try {
      if( !this.connection)
        throw 'connection_not_init';

      ch = await this.connection.createChannel();
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

  async callPublish ( exName, qName, data) {
    try {
      if( !this.connection)
        throw 'connection_not_init';

      if( !this.ch) {
        this.ch = await this.connection.createChannel();
        // 這邊如果沒有把 channel prototype 的 exception 接起來，會造成再上一個層級的 connection exception
        // 以致於 下面的 catch 就會失效
        this.ch.on( 'error', e => {
          debug( e);
        });
      }

      this.ch.publish( exName, qName, Buffer.from( JSON.stringify( data)));
    } catch ( e) {
      throw `callPublish error: ${e}`;
    }
  }

  async onRPC ( qName, callback) {
    this.onRPCList.push( { qName, callback }); 
    onRPC( this.connection, qName, callback);
  }

  static async quickStart( settings) {
    const conn = new RPC( settings);
    await conn.init();
    return conn;
  }
}

module.exports = RPC;

async function onRPC ( connection, qName, callback) {
  let ch;
  try {
    if( !connection)
      throw 'connection_not_init';

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
