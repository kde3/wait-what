export function LoadingPageView() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 text-foreground">
      <div className="text-center">
        <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-muted border-t-primary" aria-hidden="true" />
        <p className="text-sm text-muted">불러오는 중...</p>
      </div>
    </main>
  );
}
