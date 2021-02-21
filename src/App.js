import React from 'react';

import { useJitsiMeetController } from './hooks';

export const App = () => {
  const { remoteTracksByUserId, localTracks } = useJitsiMeetController();

  console.log(12345678, remoteTracksByUserId, localTracks);

  return (
    <>
      Local:
      {localTracks.map((localTrack, idx) =>
        localTrack.getType() === 'video' ? (
          <video
            autoPlay={1}
            ref={(element) => element && localTrack.attach(element)}
            key={idx}
          />
        ) : (
          <audio
            autoPlay={1}
            ref={(element) => element && localTrack.attach(element)}
            key={idx}
          />
        )
      )}
      Remote:
      {Object.entries(remoteTracksByUserId).map(([userId, remoteTracks]) => (
        <div key={userId}>
          {remoteTracks.map((remoteTrack) => {
            const key = `remote-${userId}-${remoteTrack.getType()}`;

            return remoteTrack.getType() === 'video' ? (
              <video
                autoPlay={1}
                ref={(element) => element && remoteTrack.attach(element)}
                key={key}
              />
            ) : (
              <audio
                autoPlay={1}
                ref={(element) => element && remoteTrack.attach(element)}
                key={key}
              />
            );
          })}
        </div>
      ))}
    </>
  );
};
