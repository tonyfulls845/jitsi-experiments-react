import { useState, useEffect, useCallback, useRef } from 'react';
import JitsiMeetJS from 'lib-jitsi-meet-dist';

import {
  conferenceOptions,
  connectionOptions,
  initOptions,
} from '../constants';

JitsiMeetJS.init(initOptions);

export const useJitsiMeetController = () => {
  const { current: connection } = useRef(
    new JitsiMeetJS.JitsiConnection(null, null, connectionOptions)
  );
  const roomRef = useRef(null);
  const localTracksRef = useRef([]);
  const joinedRef = useState(false);
  const [localTracks, setLocalTracks] = useState([]);
  const [remoteTracksByUserId, setRemoteTracksByUserId] = useState({});

  const onConferenceJoined = useCallback(() => {
    console.log(123456, 'conference joined!');
    joinedRef.current = true;

    localTracksRef.current.forEach((localTrack) => {
      console.log(123456, 'add track to room from localTracks', localTrack);
      roomRef.current.addTrack(localTrack);
    });
  }, []);

  const onRemoteTrack = useCallback(
    (track) => {
      if (track.isLocal()) {
        return;
      }
      console.log(123456, 'remoteTrack: ', track);

      const userId = track.getParticipantId();

      const newRemoteTracksByUserId = {
        ...remoteTracksByUserId,
        [userId]: [...(remoteTracksByUserId[userId] || []), track],
      };
      setRemoteTracksByUserId(newRemoteTracksByUserId);
    },
    [remoteTracksByUserId, setRemoteTracksByUserId]
  );
  const onRemoveTrack = useCallback((track) => {
    console.log(123456, 'track removed: ', track);
  }, []);

  const onLocalTracks = useCallback(
    (tracks) => {
      console.log(123456, 'localTracks', tracks);
      localTracksRef.current = tracks;
      setLocalTracks(tracks);

      if (joinedRef.current) {
        console.log(123456, 'add tracks to room from localTracks', tracks);
        tracks.forEach((track) => roomRef.current.addTrack(track));
      }
    },
    [setLocalTracks, localTracks]
  );

  const onUserJoin = useCallback(
    (userId) => {
      console.log(123456, 'user join: ', userId);

      setRemoteTracksByUserId({
        ...remoteTracksByUserId,
        [userId]: [],
      });
    },
    [remoteTracksByUserId]
  );

  const onUserLeft = useCallback(
    (userId) => {
      console.log(123456, 'user left: ', userId);

      if (!remoteTracksByUserId[userId]) {
        return;
      }

      const {
        [userId]: userTracks,
        ...newRemoteTracksByUserId
      } = remoteTracksByUserId;
      setRemoteTracksByUserId(newRemoteTracksByUserId);
    },
    [remoteTracksByUserId]
  );

  const onConnectionSuccess = useCallback(() => {
    console.log(123456, 'onConnectionSuccess');

    roomRef.current = connection.initJitsiConference(
      'conference2001',
      conferenceOptions
    );

    startRoomListeners();

    roomRef.current.join();
  }, [onRemoteTrack]);
  const onConnectionFailed = useCallback(() => {
    console.log(123456, 'onConnectionFailed');
  }, []);

  const startConnectionListeners = useCallback(() => {
    connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      onConnectionSuccess
    );
    connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_FAILED,
      onConnectionFailed
    );
  }, [onConnectionSuccess, onConnectionFailed]);
  const stopConnectionListeners = useCallback(() => {
    connection.removeEventListener(
      JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      onConnectionSuccess
    );
    connection.removeEventListener(
      JitsiMeetJS.events.connection.CONNECTION_FAILED,
      onConnectionFailed
    );
  }, [onConnectionSuccess, onConnectionFailed]);

  const startRoomListeners = useCallback(() => {
    const { current: room } = roomRef;

    if (room) {
      console.log(123456, 'setup room events');
      room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
      room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, onRemoveTrack);
      room.on(
        JitsiMeetJS.events.conference.CONFERENCE_JOINED,
        onConferenceJoined
      );
      room.on(JitsiMeetJS.events.conference.USER_JOINED, onUserJoin);
      room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    }
  }, [
    onRemoteTrack,
    onRemoveTrack,
    onConferenceJoined,
    onUserJoin,
    onUserLeft,
  ]);
  const stopRoomListeners = useCallback(() => {
    const { current: room } = roomRef;

    if (room) {
      console.log(123456, 'setup room events');
      room.off(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
      room.off(JitsiMeetJS.events.conference.TRACK_REMOVED, onRemoveTrack);
      room.off(
        JitsiMeetJS.events.conference.CONFERENCE_JOINED,
        onConferenceJoined
      );
      room.off(JitsiMeetJS.events.conference.USER_JOINED, onUserJoin);
      room.off(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    }
  }, [
    onRemoteTrack,
    onRemoveTrack,
    onConferenceJoined,
    onUserJoin,
    onUserLeft,
  ]);

  // Manage connection listeners
  useEffect(() => {
    startConnectionListeners();

    return stopConnectionListeners;
  }, [startConnectionListeners, stopConnectionListeners]);

  // Manage room listeners
  useEffect(() => {
    startRoomListeners();

    return stopRoomListeners;
  }, [startRoomListeners]);

  // Manage init and unload
  useEffect(() => {
    connection.connect();

    JitsiMeetJS.createLocalTracks({ devices: ['audio', 'video', 'desktop'] })
      .then(onLocalTracks)
      .catch((error) => {
        throw error;
      });

    return () => {
      localTracksRef.current.forEach((localTrack) => localTrack.dispose());
      if (roomRef.current) {
        roomRef.current.leave();
      }

      connection.disconnect();
    };
  }, []);

  // Manage init room
  useEffect(() => {
    const { current: room } = roomRef;
    console.log(123456, 'join room', room);

    if (room) {
      room.join();
    }
  }, [roomRef.current]);

  return { remoteTracksByUserId, localTracks };
};
