function _onLocalMessageReceived(event) {
    console.log(`Remote message received by local: ${event.data}`);
    this.localMessages += event.data + '\n';
}

function  _onRemoteDataChannel(event) {
    console.log(`onRemoteDataChannel: ${JSON.stringify(event)}`);
    window.remoteChannel = this._remoteChannel = event.channel;
    this._remoteChannel.binaryType = 'arraybuffer';
    this._remoteChannel.addEventListener('message', this._onRemoteMessageReceived.bind(this));
    this._remoteChannel.addEventListener('close', () => {
      console.log('Remote channel closed!');
      this.connected = false;
    });
}

function  _onRemoteMessageReceived(event) {
    console.log(`Local message received by remote: ${event.data}`);
    this.remoteMessages += event.data + '\n';
}

async function connect() {
    console.log('connect!');
    
    try {
    const dataChannelParams = {ordered: true};
    window.localConnection = this._localConnection = new RTCPeerConnection();
    this._localConnection.addEventListener('icecandidate', async e => {
        console.log('local connection ICE candidate: ', e.candidate);
        await this._remoteConnection.addIceCandidate(e.candidate);
    });
    window.remoteConnection = this._remoteConnection = new RTCPeerConnection();
    this._remoteConnection.addEventListener('icecandidate', async e => {
        console.log('remote connection ICE candidate: ', e.candidate);
        await this._localConnection.addIceCandidate(e.candidate);
    });

    window.localChannel = this._localChannel = this._localConnection
        .createDataChannel('messaging-channel', dataChannelParams);
    this._localChannel.binaryType = 'arraybuffer';
    this._localChannel.addEventListener('open', () => {
        console.log('Local channel open!');
        this.connected = true;
    });
    this._localChannel.addEventListener('close', () => {
        console.log('Local channel closed!');
        this.connected = false;
    });
    this._localChannel.addEventListener('message', this._onLocalMessageReceived.bind(this));

    this._remoteConnection.addEventListener('datachannel', this._onRemoteDataChannel.bind(this));

    const initLocalOffer = async () => {
        const localOffer = await this._localConnection.createOffer();
        console.log(`Got local offer ${JSON.stringify(localOffer)}`);
        const localDesc = this._localConnection.setLocalDescription(localOffer);
        const remoteDesc = this._remoteConnection.setRemoteDescription(localOffer);
        return Promise.all([localDesc, remoteDesc]);
    };

    const initRemoteAnswer = async () => {
        const remoteAnswer = await this._remoteConnection.createAnswer();
        console.log(`Got remote answer ${JSON.stringify(remoteAnswer)}`);
        const localDesc = this._remoteConnection.setLocalDescription(remoteAnswer);
        const remoteDesc = this._localConnection.setRemoteDescription(remoteAnswer);
        return Promise.all([localDesc, remoteDesc]);
    };

    await initLocalOffer();
    await initRemoteAnswer();
    } catch (e) {
    console.log(e);
    }
}