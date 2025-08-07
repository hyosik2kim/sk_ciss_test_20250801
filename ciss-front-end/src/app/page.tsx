// app/page.tsx (또는 src/app/page.tsx)
import { redirect } from 'next/navigation'; // next/navigation에서 redirect를 임포트

export default function HomePage() {
  // 루트 경로 (/)로 접속하면 /error 경로로 리다이렉트합니다.
  redirect('/errors');

  // 이 부분은 사실상 도달하지 않지만, 컴포넌트가 무언가를 반환해야 하므로 빈 JSX를 반환합니다.
  // TypeScript가 반환 타입을 추론할 때 필요할 수 있습니다.
  return null; // 또는 <div>Redirecting...</div>
}