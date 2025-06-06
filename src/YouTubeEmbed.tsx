import React from 'react';
import YouTube, { type YouTubeProps } from 'react-youtube'; // react-youtube 임포트

// YouTubeEmbed 컴포넌트의 props 타입을 정의합니다.
interface YouTubeEmbedProps {
  embedId: string; // YouTube 비디오 ID (필수)
  width?: string;   // 플레이어 너비 (기본값 '360')
  height?: string;  // 플레이어 높이 (기본값 '202.5')
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ embedId, width = '360', height = '202.5' }) => {
  // embedId가 없으면 아무것도 렌더링하지 않습니다.
  if (!embedId) {
    return null;
  }

  // YouTube 플레이어 옵션을 설정합니다.
  // 이 옵션들은 YouTube IFrame Player API의 playerVars와 동일합니다.
  const playerOptions: YouTubeProps['opts'] = {
    height: height,
    width: width,
    playerVars: {
      autoplay: 0,         // 자동 재생 끄기 (대부분의 브라우저에서 막히므로 수동 재생 권장)
      controls: 1,         // 플레이어 컨트롤 표시
      rel: 0,              // 관련 동영상 표시 안 함
      modestbranding: 1,   // YouTube 로고 간소화 (플레이어 컨트롤 바에서만 표시)
    },
  };

  // 플레이어가 준비되었을 때 호출되는 콜백 함수 (선택 사항)
  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    // `event.target`을 통해 YouTube Player 인스턴스에 접근하여 제어할 수 있습니다.
    // 예: event.target.pauseVideo(); // 비디오 일시정지
    console.log(`비디오 준비 완료: ${event.target.getVideoData().title}`);
  };

  // 플레이어 상태 변경 시 호출되는 콜백 함수 (선택 사항)
  const onPlayerStateChange: YouTubeProps['onStateChange'] = (_event) => {
    // console.log('플레이어 상태 변경:', event.data);
    // YT.PlayerState.PLAYING (1): 재생 중
    // YT.PlayerState.PAUSED (2): 일시정지
    // YT.PlayerState.ENDED (0): 종료
  };

  // 플레이어에서 에러 발생 시 호출되는 콜백 함수 (선택 사항)
  const onPlayerError: YouTubeProps['onError'] = (error) => {
    console.error('YouTube 플레이어 에러 발생:', error);
  };

  return (
    <div className="youtube-player-container">
      <YouTube
        videoId={embedId}         // YouTube 비디오 ID (필수)
        opts={playerOptions}      // 위에 정의한 플레이어 옵션
        onReady={onPlayerReady}   // 플레이어 준비 완료 시 콜백
        onStateChange={onPlayerStateChange} // 플레이어 상태 변경 시 콜백
        onError={onPlayerError}   // 에러 발생 시 콜백
      />
    </div>
  );
};

export default YouTubeEmbed;