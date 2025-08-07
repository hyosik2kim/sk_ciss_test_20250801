// src/app/layout.tsx (수정될 부분)

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Data Analysis System',
  description: 'Integrated platform for charger data analysis.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="flex min-h-screen bg-gray-50">
          {/* 좌측 사이드바 */}
          <aside className="w-64 bg-gray-800 text-white flex flex-col p-4 shadow-lg">
            {/* DAS / DataAnalysisSystem 로고/타이틀 */}
            <div className="mb-8 text-center">
              <h1 className="text-xl font-bold mb-2">DAS</h1>
              <p className="text-sm text-gray-400">DataAnalysisSystem</p>
            </div>

            {/* 메뉴 목록 */}
            <nav className="flex-grow">
              <ul>
                <li className="mb-2">
                  {/* 여기가 핵심입니다: href를 /error 경로로 설정 */}
                  <a href="/errors" className="block p-2 rounded-md hover:bg-gray-700 transition-colors">
                    <span className="mr-2">📊</span>Error Analysis
                  </a>
                </li>
                <li className="mb-2">
                  <a href="/chargingData" className="block p-2 rounded-md hover:bg-gray-700 transition-colors">
                    <span className="mr-2">⚡</span>Charging Data Analysis
                  </a>
                </li>
                 <li className="mb-3">
                  <a href="/sessionData" className="block p-2 rounded-md hover:bg-gray-700 transition-colors">
                    <span className="mr-2">||</span>Sesstion Data Analysis
                  </a>
                </li>
                  <li className="mb-4">
                  <a href="/SCARAnalysis" className="block p-2 rounded-md hover:bg-gray-700 transition-colors">
                    <span className="mr-2">||</span>SCAR 시스템 로그 기반 분석 툴
                  </a>
                </li>
                {/* 추가 메뉴 항목 */}
              </ul>
            </nav>
          </aside>

          {/* 우측 메인 컨텐츠 영역 */}
          <main className="flex-grow p-6">
            {children} {/* 현재 라우트에 해당하는 페이지 컨텐츠가 렌더링됩니다 */}
          </main>
        </div>
      </body>
    </html>
  );
}