var NR = require(__dirname + "/../index.js")
  , schedule = require('node-schedule')
  , connectionDetails = {
    pkg:   'ioredis',
    host:      '127.0.0.1',
    password:  null,
    port:      6379,
    database:  3,
    namespace: 'resque-bug'
  }
  , queue

var jobs = {
  add: {
    plugins: ['delayQueueLock'],
    perform: function (a, b, callback) {
      var answer = a + b
      console.log('*** THE ANSWER IS ' + answer + ' ***')

      queue.enqueueIn(3 * 1000, 'math', 'add', [a, b], function () {
        callback(null, answer)
      })
    }
  }
}

// Queue with plugins
queue = new NR.queue({connection: connectionDetails}, jobs)
queue.on('error', function (error){ console.log(error); })
queue.connect(function(){ })

var multiWorker = new NR.multiWorker({
  connection: connectionDetails,
  queues: ['math'],
  timeout: 500,
  minTaskProcessors: 1,
  maxTaskProcessors: 50,
  checkTimeout: 1000,
  maxEventLoopDelay: 10,
  toDisconnectProcessors: true
}, jobs);

multiWorker.start(function () {

})

multiWorker.on('error', function () {
  console.log('err', arguments)
})

var scheduler = new NR.scheduler({connection: connectionDetails}, jobs)
scheduler.connect(function () {
  scheduler.start()
})

// On demand queue -- no plugins
var queue2 = new NR.queue({connection: connectionDetails})
queue2.on('error', function(error){ console.log(error); })

queue2.connect(function(){
  console.log('enqueue on queue connect')
  // queue.enqueue('squeegee', wob.widget.type, [dashboardId, wob._id])
  queue2.enqueue('math', 'add', [1, 2])
  queue2.enqueue('math', 'add', [1, 2])
  queue2.enqueue('math', 'add', [1, 2])
  queue2.enqueue('math', 'add', [1, 2])
})

// setInterval(function () {
//   queue2.connection.redis.
// }, 5)

var shutdown = function(){
  scheduler.end(function(){
    multiWorker.end(function(){
      console.log('bye.');
      process.exit();
    });
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
