export function LoadingState() { return <p role="status">Loading your workspace…</p>; }
export function EmptyState({ title = 'Nothing to show yet', body = 'This area will show data once it is available from Apex Framework.' }: { title?: string; body?: string }) { return <section><h2>{title}</h2><p>{body}</p></section>; }
export function ErrorState({ message }: { message: string }) { return <section role="alert"><h2>We could not load this page</h2><p>{message}</p></section>; }
