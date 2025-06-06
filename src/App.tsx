import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import './App.css';

type SavedLinkData = {
  link: string;
  title?: string;
};

function App() {
  const [activeTab, setActiveTab] = useState<'add' | 'view'>('add');
  const [youtubeLinkInput, setYoutubeLinkInput] = useState<string>('');
  const [savedLinks, setSavedLinks] = useState<SavedLinkData[]>(() => {
    const storedLinks = localStorage.getItem('youtubeSavedLinks');
    if (storedLinks) {
      try {
        const parsed = JSON.parse(storedLinks);
        if (Array.isArray(parsed) && parsed.every((item: any) => typeof item === 'string')) {
          return parsed.map((link: string) => ({ link: link, title: '' }));
        }
        return parsed;
      } catch (error) {
        console.error("Failed to parse saved links from localStorage:", error);
        return [];
      }
    }
    return [];
  });

  // 순차 재생을 위한 새로운 상태
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState<boolean>(false); // '모두 재생' 상태
  const playerRef = useRef<any>(null); // YouTube 플레이어 인스턴스 참조

  const getEmbedIdFromLink = (link: string): string => {
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/;
    const match = link.match(regExp);
    return (match && match[1]) ? match[1] : '';
  };

  const handleLinkInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeLinkInput(e.target.value);
  };

  const fetchAndSaveVideoInfo = async (link: string) => {
    const embedId = getEmbedIdFromLink(link);
    if (!embedId) {
      alert('유효한 YouTube 링크가 아닙니다. 링크 형식을 확인해주세요.');
      return;
    }

    const isAlreadySaved = savedLinks.some(item => item.link === link);
    if (isAlreadySaved) {
      alert('이미 저장된 링크입니다.');
      return;
    }

    const noEmbedUrl = `https://noembed.com/embed?url=${encodeURIComponent(link)}`;
    try {
      const response = await fetch(noEmbedUrl);
      const data = await response.json();

      if (data && data.title) {
        const newLinkData: SavedLinkData = {
          link: link,
          title: data.title,
        };

        const updatedSavedLinks = [...savedLinks, newLinkData];
        setSavedLinks(updatedSavedLinks);
        localStorage.setItem('youtubeSavedLinks', JSON.stringify(updatedSavedLinks));
        setYoutubeLinkInput('');
        setActiveTab('view');
        // 새로운 비디오 추가 시, '모두 재생' 상태가 아니면 expandedVideos 상태는 필요 없습니다.
        // 하지만 혹시 개별 펼치기 기능을 따로 유지하고 싶다면 이 부분은 이전처럼 두셔도 됩니다.
        // 현재는 '모두 재생' 시에는 개별 펼치기를 사용하지 않도록 설계합니다.
      } else {
        alert('YouTube 영상 정보를 가져오지 못했습니다. 링크를 확인해주세요.');
      }
    } catch (error) {
      console.error('Error fetching video info:', error);
      alert('비디오 정보를 가져오는 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
    }
  };

  const handleSaveLink = () => {
    fetchAndSaveVideoInfo(youtubeLinkInput);
  };

  const handleDeleteLink = (linkToDelete: string) => {
    const filteredLinks = savedLinks.filter(item => item.link !== linkToDelete);
    setSavedLinks(filteredLinks);
    localStorage.setItem('youtubeSavedLinks', JSON.stringify(filteredLinks));

    // 삭제된 비디오가 현재 재생 중이었다면 재생을 멈춥니다.
    if (isPlayingAll) {
      const deletedIndex = savedLinks.findIndex(item => item.link === linkToDelete);
      if (currentPlayingIndex !== null && deletedIndex === currentPlayingIndex) {
        setIsPlayingAll(false);
        setCurrentPlayingIndex(null);
      } else if (currentPlayingIndex !== null && deletedIndex < currentPlayingIndex) {
        // 현재 재생 중인 영상보다 앞에 있는 영상이 삭제되면 인덱스 조정
        setCurrentPlayingIndex(prevIndex => prevIndex! - 1);
      }
    }
  };

  // '모두 재생' 시작
  const handlePlayAll = () => {
    if (savedLinks.length > 0) {
      setIsPlayingAll(true);
      setCurrentPlayingIndex(0); // 첫 번째 영상부터 재생 시작
      // 모든 개별 펼침 상태를 초기화
      // setExpandedVideos({}); // 이 상태는 이제 '모두 재생'과 충돌 가능성이 있어 사용하지 않습니다.
    } else {
      alert('재생할 비디오가 없습니다.');
    }
  };

  // '모두 재생' 중지
  const handleStopPlayingAll = () => {
    setIsPlayingAll(false);
    setCurrentPlayingIndex(null);
    if (playerRef.current && playerRef.current.internalPlayer) {
      playerRef.current.internalPlayer.pauseVideo(); // 현재 재생 중인 영상 일시 정지
    }
  };

  // 비디오 재생이 끝났을 때 호출되는 콜백 함수
  const handleVideoEnd = () => {
    if (isPlayingAll && currentPlayingIndex !== null) {
      const nextIndex = currentPlayingIndex + 1;
      if (nextIndex < savedLinks.length) {
        setCurrentPlayingIndex(nextIndex); // 다음 영상 재생
      } else {
        // 마지막 영상 재생 완료: 처음으로 돌아가거나 재생 중지
        alert('모든 비디오 재생이 완료되었습니다. 다시 처음부터 재생합니다.');
        setCurrentPlayingIndex(0); // 처음부터 다시 재생
        // 또는 setIsPlayingAll(false); 로 재생 중지
      }
    }
  };

  // YouTube 플레이어 옵션
  const playerOptions = {
    height: '315',
    width: '100%',
    playerVars: {
      autoplay: 1,           // 자동 재생 (순차 재생 시 필요)
      modestbranding: 1,
      rel: 0,
      controls: 1,           // 플레이어 컨트롤 표시 (일시정지, 볼륨 등)
    },
  };

  // 컴포넌트 마운트 시, 저장된 링크 중 제목이 없는 경우 제목을 가져오도록 시도
  useEffect(() => {
    savedLinks.forEach(item => {
      if (!item.title) {
        const embedId = getEmbedIdFromLink(item.link);
        if (embedId) {
          const noEmbedUrl = `https://noembed.com/embed?url=${encodeURIComponent(item.link)}`;
          fetch(noEmbedUrl)
            .then(res => res.json())
            .then(data => {
              if (data && data.title) {
                setSavedLinks(prevLinks =>
                  prevLinks.map(prevItem =>
                    prevItem.link === item.link ? { ...prevItem, title: data.title } : prevItem
                  )
                );
              }
            })
            .catch(error => console.error('Error fetching title for saved link:', item.link, error));
        }
      }
    });
  }, []);

  // currentPlayingIndex가 변경될 때마다 자동 재생
  useEffect(() => {
    if (isPlayingAll && currentPlayingIndex !== null && playerRef.current) {
      // YouTube 플레이어 인스턴스가 준비되었을 때만 playVideo 호출
      if (playerRef.current.internalPlayer) {
        playerRef.current.internalPlayer.loadVideoById(
          getEmbedIdFromLink(savedLinks[currentPlayingIndex].link)
        );
      }
    }
  }, [currentPlayingIndex, isPlayingAll, savedLinks]); // savedLinks 변경 시에도 useEffect 재실행

  // 개별 비디오 펼치기/접기 기능은 '모두 재생' 상태와 분리하여 처리
  // '모두 재생' 중일 때는 개별 비디오 컨트롤이 보이지 않으므로 이 상태는 필요 없습니다.
  // const [expandedVideos, setExpandedVideos] = useState<{ [key: string]: boolean }>({});
  // const handleToggleExpand = (embedId: string) => {
  //   setExpandedVideos(prev => ({
  //     ...prev,
  //     [embedId]: !prev[embedId]
  //   }));
  // };


  return (
    <div className="app-container">
      <header className="app-header">
        <h1>YouTube 즐겨찾기</h1>
        <nav className="tab-nav">
          <button
            className={activeTab === 'add' ? 'active' : ''}
            onClick={() => {
              setActiveTab('add');
              handleStopPlayingAll(); // 탭 전환 시 순차 재생 중지
            }}
          >
            새 링크 추가
          </button>
          <button
            className={activeTab === 'view' ? 'active' : ''}
            onClick={() => setActiveTab('view')}
          >
            저장된 비디오
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'add' && (
          <section className="add-link-section">
            <h2>새 YouTube 링크 추가</h2>
            <div className="input-group">
              <input
                type="text"
                placeholder="YouTube 링크를 입력하세요 (예: https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
                value={youtubeLinkInput}
                onChange={handleLinkInputChange}
              />
              <button onClick={handleSaveLink}>저장</button>
            </div>
          </section>
        )}

        {activeTab === 'view' && (
          <section className="view-links-section">
            <h2>저장된 비디오 목록</h2>
            {savedLinks.length === 0 ? (
              <p className="empty-message">아직 저장된 링크가 없습니다. '새 링크 추가' 탭에서 링크를 저장해주세요.</p>
            ) : (
              <>
                {/* '모두 재생' 컨트롤 */}
                <div className="playlist-controls">
                  {isPlayingAll ? (
                    <button onClick={handleStopPlayingAll} className="stop-play-all-button">
                      ⏹️ 모두 재생 중지
                    </button>
                  ) : (
                    <button onClick={handlePlayAll} className="play-all-button">
                      ▶️ 모두 재생
                    </button>
                  )}
                  {isPlayingAll && currentPlayingIndex !== null && savedLinks.length > 0 && (
                    <p className="now-playing-info">
                      현재 재생 중: {savedLinks[currentPlayingIndex]?.title || '제목 없음'} (
                      {currentPlayingIndex + 1}/{savedLinks.length})
                    </p>
                  )}
                </div>

                {/* '모두 재생' 상태일 때만 단일 플레이어 렌더링 */}
                {isPlayingAll && currentPlayingIndex !== null && savedLinks[currentPlayingIndex] && (
                  <div className="main-player-container video-item expanded">
                    <div className="youtube-player-container">
                      <YouTube
                        videoId={getEmbedIdFromLink(savedLinks[currentPlayingIndex].link)}
                        opts={playerOptions}
                        onEnd={handleVideoEnd} // 영상이 끝났을 때 다음 영상 재생
                        ref={playerRef} // 플레이어 인스턴스 참조
                      />
                    </div>
                    {/* 푸터 정보는 필요에 따라 추가 */}
                     <div className="video-footer-info">
                        <h3 className="video-collapsed-title">
                          {savedLinks[currentPlayingIndex]?.title || '제목 없음'}
                        </h3>
                        <div className="video-actions">
                            <a
                              href={savedLinks[currentPlayingIndex].link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="video-link-anchor"
                            >
                              YouTube에서 보기
                            </a>
                            <button className="delete-button" onClick={() => handleDeleteLink(savedLinks[currentPlayingIndex].link)}>삭제</button>
                        </div>
                         {/* 순차 재생 중에는 접기/펼치기 버튼은 필요 없음 */}
                     </div>
                  </div>
                )}

                {/* '모두 재생' 상태가 아닐 때만 개별 비디오 목록 렌더링 */}
                {!isPlayingAll && (
                  <div className="video-grid">
                    {savedLinks.map((item, index) => {
                      const embedId = getEmbedIdFromLink(item.link);
                      const videoTitle = item.title || `YouTube 영상 (${embedId ? embedId.substring(0, 5) + '...' : 'ID 없음'})`;

                      return embedId ? (
                        <div key={index} className="video-item"> {/* 개별 아이템은 항상 접힌 상태로 표시 */}
                           {/* 개별 아이템에서는 플레이어는 없고, 정보만 표시 */}
                            <div className="video-info-only"> {/* 새로운 클래스 추가 */}
                                <h3 className="video-collapsed-title">{videoTitle}</h3>
                            </div>

                            {/* 비디오 푸터 정보 (개별 항목용) */}
                            <div className="video-footer-info">
                                <div className="video-actions">
                                    <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="video-link-anchor"
                                    >
                                    YouTube에서 보기
                                    </a>
                                    <button className="delete-button" onClick={() => handleDeleteLink(item.link)}>삭제</button>
                                </div>
                                {/* 개별 항목에서는 펼치기/접기 버튼을 사용하지 않고, 클릭하면 바로 재생 시작 */}
                                <button className="toggle-button play-individual-button" onClick={() => {
                                  // 개별 재생 버튼 클릭 시 해당 영상부터 '모두 재생' 시작
                                  setIsPlayingAll(true);
                                  setCurrentPlayingIndex(index);
                                }}>
                                    ▶️ 이 영상부터 재생
                                </button>
                            </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>© 2025 My YouTube Saver</p>
      </footer>
    </div>
  );
}

export default App;