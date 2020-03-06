var express = require('express')
var http = require('http')
var net = require('net');
var child = require('child_process');

var app = express();
var httpServer = http.createServer(app);

app.get('/', function (req, res) {
    var date = new Date();

    res.writeHead(200, {
        'Date': date.toUTCString(),
        'Connection': 'close',
        'Cache-Control': 'private',
        'Content-Type': 'video/webm',
        'Server': 'CustomStreamer/0.0.1',
    });

    var tcpServer = net.createServer(function (socket) {
        socket.on('data', function (data) {
            res.write(data);
        });
        socket.on('close', function (had_error) {
            res.end();
        });
    });

    tcpServer.maxConnections = 1;

    tcpServer.listen(function () {
        var cmd = 'gst-launch-1.0';
        var args =
            ['autovideosrc',
                '!', 'video/x-raw,framerate=30/1,width=320,height=240',
                '!', 'videoconvert',
                '!', 'queue', 'leaky=1',
                '!', 'vp8enc',
                '!', 'queue', 'leaky=1',
                '!', 'm.', 'autoaudiosrc',
                '!', 'queue', 'leaky=1',
                '!', 'audioconvert',
                '!', 'vorbisenc',
                '!', 'queue', 'leaky=1',
                '!', 'm.', 'webmmux', 'name=m', 'streamable=true',
                '!', 'queue', 'leaky=1',
                '!', 'tcpclientsink', 'host=localhost',
                'port=' + tcpServer.address().port];

            var args2 =
            ['nvarguscamerasrc',
                '!', 'video/x-raw(memory:NVMM),width=3820, height=2464, framerate=21/1, format=NV12',
                '!', 'tcpclientsink', 'host=localhost', 'port=' + tcpServer.address().port];
    

        //gst-launch-1.0 nvarguscamerasrc ! 'video/x-raw(memory:NVMM),width=3820, height=2464, framerate=21/1, format=NV12' ! nvvidconv flip-method=0 ! 'video/x-raw,width=960, height=616' ! nvvidconv ! nvegltransform ! 
        /**
         * 
         *  gst-launch-1.0 nvarguscamerasrc 
         * ! 'video/x-raw(memory:NVMM),width=3820, height=2464, framerate=21/1, format=NV12'
         * ! nvvidconv flip-method=0
         * ! 'video/x-raw,width=960, height=616'
         * ! nvvidconv
         * ! nvegltransform ! 
         */
        // var args2 =
        // ['nvarguscamerasrc',
        //     '!', 'video/x-raw(memory:NVMM),width=3820, height=2464, framerate=21/1, format=NV12',
        //     '!', 'nvvidconv flip-method=0',
        //     '!', 'video/x-raw,width=960, height=616',
        //     '!', 'nvvidconv',
        //     '!', 'nvegltransform',
        //     '!', 'tcpclientsink', ' host=localhost', ' port=' + tcpServer.address().port];

        /**
         * 
         * 
         * tcpclientsink host=localhost port=9001
         * 
            $ gst-launch-1.0 nvarguscamerasrc ! 'video/x-raw(memory:NVMM),width=3820, height=2464, framerate=21/1' ! nvvidconv flip-method=0 ! nvvidconv ! nvegltransform ! tcpclientsink host=localhost port=9001
         */

        var gstMuxer = child.spawn(cmd, args2);

        gstMuxer.stderr.on('data', onSpawnError);
        gstMuxer.on('exit', onSpawnExit);

        res.connection.on('close', function () {
            gstMuxer.kill();
        });
    });
});

httpServer.listen(9001);

function onSpawnError(data) {
    console.log(data.toString());
}

function onSpawnExit(code) {
    if (code != null) {
        console.log('GStreamer error, exit code ' + code);
    }
}

process.on('uncaughtException', function (err) {
    console.log(err);
});