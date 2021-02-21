const domain = 'beta.meet.jit.si';

export const connectionOptions = {
  hosts: {
    domain: 'meet.jit.si',
    muc: 'conference.meet.jit.si',
    focus: 'focus.meet.jit.si',
  },
  externalConnectUrl: 'https://meet.jit.si/http-pre-bind',
  useStunTurn: true,
  bosh: `https://meet.jit.si/http-bind?room=liveroom`,
  websocket: 'wss://meet.jit.si/xmpp-websocket',
  clientNode: 'http://jitsi.org/jitsimeet',
};

export const initOptions = {
  disableAudioLevels: true,
};

export const conferenceOptions = {
  openBridgeChannel: true,
};
