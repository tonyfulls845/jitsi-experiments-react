interface JitsiMeetJSNamespace {
  JitsiConnection: Class;
  init: () => void;
  events: any;
}

declare module 'lib-jitsi-meet-dist' {
  const namespace: JitsiMeetJSNamespace;
  export default namespace;
}
