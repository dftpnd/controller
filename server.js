const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PoweredUP = require("node-poweredup");
const poweredUP = new PoweredUP.PoweredUP();

const ANGLE_MAX = 63;
const LEFT = -1;
const STR = 0;
const RIGHT = 1;

const transformServoAngel = (angle) => angle * ANGLE_MAX ;

const statusPos = (axe) => {
  const posAngle = Math.round(transformServoAngel(axe));

  if(posAngle > 10){
    return RIGHT;
  }

  if(posAngle < -10){
    return LEFT;
  }

  return STR;
}

poweredUP.on("discover", async (hub) => { 
  console.log(`Discovered ${hub.name}!`);

  await hub.connect(); 

  console.log('batteryLevel:', hub.batteryLevel)

  const motorA = await hub.waitForDeviceAtPort("A"); 
  const motorB = await hub.waitForDeviceAtPort("B");
  const motorC = await hub.waitForDeviceAtPort("C");
  const lightD = await hub.waitForDeviceAtPort("D");
  
  console.log("All lego hub connected");

  motorC.on('absolute', ({angle})=>{
    console.log('motorC.on absolute', angle);
  });

  lightD.setBrightness(5);


  io.on('connection', async function(socket){
    console.log('io on connection')
    const state = {
      M1: false,
      M2: false,
      angle: STR,
    };


    socket.on('action', async function(args) {
      const { M1, M2, AXES } = args;
      const status = statusPos(AXES[0]);
      

        if(status === STR && state.angle !== STR){
          
          motorC.gotoAngle(0, 10)
          state.angle = status;

        }else if(status === LEFT && state.angle !== LEFT){

          motorC.gotoAngle(-60, 10)
          state.angle = status;

        }else if(status === RIGHT && state.angle !== RIGHT){

          motorC.gotoAngle(60, 10)
          state.angle = status;
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
