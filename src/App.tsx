import React, { useState } from 'react';
import YouTubeEmbed from './YouTubeEmbed';
import './App.css'; // 개선된 CSS 파일을 임포트합니다.

// 로컬 스토리지에 저장될 링크들의 타입을 정의합니다.
type SavedLink = string;

function App() {
  // 현재 활성화된 탭을 관리하는 상태 (기본값은 'add' - 새 링크 추가 탭)
  const [activeTab, setActiveTab] = useState<'add' | 'view'>('add');
  // YouTube 링크 입력 필드의 값을 관리하는 상태
  const [youtubeLinkInput, setYoutubeLinkInput] = useState<string>('');
  // 로컬 스토리지에 저장된 링크들을 관리하는 상태
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>(() => {
    // 컴포넌트가 처음 렌더링될 때 로컬 스토리지에서 데이터를 불러옵니다.
    const storedLinks = localStorage.getItem('youtubeSavedLinks');
    return storedLinks ? JSON.parse(storedLinks) : [];
  });

  // YouTube 링크에서 비디오 ID를 추출하는 함수
  const getEmbedIdFromLink = (link: string): string => {
    // YouTube 비디오 ID (11자리 영숫자)를 추출하는 정규 표현식
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/;
    const match = link.match(regExp);
    return (match && match[1]) ? match[1] : '';
  };

  // 입력 필드 값 변경 핸들러
  const handleLinkInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeLinkInput(e.target.value);
  };

  // "저장" 버튼 클릭 핸들러
  const handleSaveLink = () => {
    const embedId = getEmbedIdFromLink(youtubeLinkInput);

    // 1. 입력된 링크가 비어있지 않고
    // 2. 유효한 YouTube 비디오 ID가 추출되었으며
    // 3. 이미 저장된 링크가 아닌 경우에만 저장
    if (youtubeLinkInput && embedId && !savedLinks.includes(youtubeLinkInput)) {
      const newSavedLinks = [...savedLinks, youtubeLinkInput]; // 새 링크를 기존 목록에 추가
      setSavedLinks(newSavedLinks); // savedLinks 상태 업데이트
      localStorage.setItem('youtubeSavedLinks', JSON.stringify(newSavedLinks)); // 로컬 스토리지에 저장
      setYoutubeLinkInput(''); // 입력 필드 초기화
      setActiveTab('view'); // 링크 저장 후 자동으로 '저장된 비디오' 탭으로 전환
    } else if (youtubeLinkInput && !embedId) {
      alert('유효한 YouTube 링크가 아닙니다. 링크 형식을 확인해주세요.');
    } else if (youtubeLinkInput && savedLinks.includes(youtubeLinkInput)) {
      alert('이미 저장된 링크입니다.');
    }
  };

  // "삭제" 버튼 클릭 핸들러
  const handleDeleteLink = (linkToDelete: string) => {
    // 삭제할 링크를 제외하고 새로운 배열을 생성
    const filteredLinks = savedLinks.filter(link => link !== linkToDelete);
    setSavedLinks(filteredLinks); // savedLinks 상태 업데이트
    localStorage.setItem('youtubeSavedLinks', JSON.stringify(filteredLinks)); // 로컬 스토리지에 저장
  };

  return (
    <div className="app-container">
      {/* 앱 헤더 */}
      <header className="app-header">
        <h1>YouTube 즐겨찾기</h1>
        {/* 탭 네비게이션 */}
        <nav className="tab-nav">
          <button
            className={activeTab === 'add' ? 'active' : ''}
            onClick={() => setActiveTab('add')}
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

      {/* 메인 콘텐츠 영역 */}
      <main className="app-main">
        {/* '새 링크 추가' 탭 내용 (activeTab이 'add'일 때만 렌더링) */}
        {activeTab === 'add' && (
          <section className="add-link-section">
            <h2>새 YouTube 링크 추가</h2>
            <div className="input-group">
              <input
                type="text"
                placeholder="YouTube 링크를 입력하세요 (예: https://www.youtube.com/embed/19g66ezsKAg6)"
                value={youtubeLinkInput}
                onChange={handleLinkInputChange}
              />
              <button onClick={handleSaveLink}>저장</button>
            </div>
          </section>
        )}

        {/* '저장된 비디오' 탭 내용 (activeTab이 'view'일 때만 렌더링) */}
        {activeTab === 'view' && (
          <section className="view-links-section">
            <h2>저장된 비디오 목록</h2>
            {savedLinks.length === 0 ? (
              <p className="empty-message">아직 저장된 링크가 없습니다. '새 링크 추가' 탭에서 링크를 저장해주세요.</p>
            ) : (
              <div className="video-grid">
                {savedLinks.map((link, index) => {
                  const embedId = getEmbedIdFromLink(link);
                  return embedId ? (
                    <div key={index} className="video-item">
                      <YouTubeEmbed embedId={embedId} width="100%" height="100%" />
                      <div className="video-info">
                        {/* 이 부분을 "YouTube 영상" 텍스트로 변경 */}
                        <a
                          href={link} // 실제 YouTube 링크를 href에 넣습니다.
                          target="_blank" // 새 탭에서 열기
                          rel="noopener noreferrer" // 보안을 위한 권장 속성
                          className="video-link-anchor" // CSS 스타일링을 위한 클래스
                        >
                          YouTube에서 보기
                        </a>
                        <button className="delete-button" onClick={() => handleDeleteLink(link)}>삭제</button>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* 앱 푸터 */}
      <footer className="app-footer">
        <p>© 2025 My YouTube Saver</p>
      </footer>
    </div>
  );
}

export default App;