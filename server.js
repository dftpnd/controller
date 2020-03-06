const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PoweredUP = require("node-poweredup");
const poweredUP = new PoweredUP.PoweredUP();

function MakeQuerablePromise(promise) {
  // Don't create a wrapper for promises that can already be queried.
  if (promise.isResolved) return promise;

  var isResolved = false;
  var isRejected = false;

  // Observe the promise, saving the fulfillment in a closure scope.
  var result = promise.then(
     function(v) { isResolved = true; return v; }, 
     function(e) { isRejected = true; throw e; });
  result.isFulfilled = function() { return isResolved || isRejected; };
  result.isResolved = function() { return isResolved; }
  result.isRejected = function() { return isRejected; }
  return result;
}

poweredUP.on("discover", async (hub) => { 
  console.log(`Discovered ${hub.name}!`);
  // hub.batteryLevel
  console.log('batteryLevel:', hub.batteryLevel)
  await hub.connect(); 
  const motorA = await hub.waitForDeviceAtPort("A"); 
  const motorB = await hub.waitForDeviceAtPort("B");
  const motorC = await hub.waitForDeviceAtPort("C");


  // const lightD = await hub.waitForDeviceAtPort("D");
  
  console.log("Lego hub connected");


  // lightD.setBrightness(100);
  // motorC.gotoAngle(120);

  let rotationAction;


  io.on('connection', function(socket){
    console.log('io on connection')
    const state = {
      M1: false,
      M2: false,
    };

    socket.on('action', function(args) {
      const { M1, M2 } = args;
      console.log('M1', M1)
      const ANGLE = Math.round((args.AXES[0] + 1) * 89);

      if (!rotationAction || rotationAction.isResolved()) {
        console.log('ANGLE', ANGLE);
        rotationAction = MakeQuerablePromise(
          motorC.gotoAngle(ANGLE, 10)
          );
      }

      if (M1 !== 0 && !state.M1) {
        state.M1 = M1;
        motorA.setPower(100);
        motorB.setPower(100);
      } else if (M1 === 0 && state.M1) {
        state.M1 = false;
        motorA.brake();
        motorB.brake();
      }
      
      if (M2 !== 0 && !state.M2) {
        state.M2 = M2;
        motorA.setPower(-100);
        motorB.setPower(-100);
      } else if (M2 === 0 && state.M2) {
        state.M2 = false;
        motorA.brake();
        motorB.brake();
      }
    });
  });
});

app.use(express.static('public'))

app.get('/', function(_, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/webrtc', function(_, res){
  res.sendFile(__dirname + '/webrtc.html');
});

app.get('/client', function(_, res){
  res.sendFile(__dirname + '/client.html');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

poweredUP.scan();
