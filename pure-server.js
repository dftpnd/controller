const PoweredUP = require('node-poweredup');
const poweredUP = new PoweredUP.PoweredUP();

poweredUP.on('discover', async (hub) => {
    console.log(`Discovered ${hub.name}!`);

    await hub.connect();

    console.log('batteryLevel:', hub.batteryLevel);

    const motorA = await hub.waitForDeviceAtPort('A');

    console.log('All lego hub connected');

    // lightD.setBrightness(5);

    motorA.setPower(100);
});

console.log('poweredUP.scan...');
poweredUP.scan();
