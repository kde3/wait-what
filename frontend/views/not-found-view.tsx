'use client';

import { Button } from '../components/ui/button';
import { Home } from 'pixelarticons/react';

export function NotFoundView() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 text-foreground">
      <section className="max-w-md text-center" aria-labelledby="not-found-title">
        <p className="mb-2 font-mono text-sm font-bold tracking-widest text-primary">404</p>
        <h1 id="not-found-title" className="text-3xl font-bold">페이지를 찾을 수 없어요</h1>
        <p className="mt-3 text-sm text-muted">주소가 잘못되었거나 페이지가 이동되었을 수 있어요.</p>
        <Button className="mt-6" onClick={() => window.location.assign('/')}>
          <Home className="size-4" aria-hidden="true" />
          메인으로 돌아가기
        </Button>
      </section>
    </main>
  );
}
