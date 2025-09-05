// hooks/useMediaWithMediasoup.ts
import { useCallback } from 'react';
import { useMediaStream } from '@/contexts/MediaStreamContext';
import { useMediasoup } from '@/contexts/MediasoupContext';

export const useMediaWithMediasoup = () => {
  const mediaStream = useMediaStream();
  const mediasoup = useMediasoup();

  const publishMedia = useCallback(async () => {
    if (!mediaStream.stream) {
      await mediaStream.initMedia();
    }
    
    if (mediaStream.stream) {
      await mediasoup.publishStream(mediaStream.stream);
    }
  }, [mediaStream, mediasoup]);

  const unpublishMedia = useCallback(() => {
    mediaStream.stopMediaStream();
    mediasoup.unpublishStream();
  }, [mediaStream, mediasoup]);

  return {
    ...mediaStream,
    ...mediasoup,
    publishMedia,
    unpublishMedia
  };
};