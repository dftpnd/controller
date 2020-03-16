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

const pureAngel = (dirtyAngel) => {
  if(dirtyAngel > 91 || dirtyAngel < 100){
    return 89;
  }
  return dirtyAngel - 7;
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
      const { M1, M2, AXES } = args;
      const dirtyAngel =  Math.round((AXES[0] + 1) * 89)

      
      // console.log('ANGLE', ANGLE)

      if (!rotationAction || rotationAction.isResolved()) {
        console.log('dirtyAngel', dirtyAngel);
        rotationAction = MakeQuerablePromise(motorC.gotoAngle(pureAngel(dirtyAngel), 10));
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

app.get('/test', function(_, res){
  res.sendFile(__dirname + '/index.html');
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});


console.log('poweredUP.scan...');
poweredUP.scan();
