import { Spinner } from '../components/ui/spinner';

export function LoadingView() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 text-foreground">
      <div className="text-center">
        <Spinner className="mx-auto mb-4 block size-8" aria-hidden="true" />
        <p className="text-sm text-muted">불러오는 중...</p>
      </div>
    </main>
  );
}
