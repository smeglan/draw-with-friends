type Props = {
  message: string | null;
};

export function ErrorBanner({ message }: Props) {
  if (!message) return null;

  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-400">
      {message}
    </div>
  );
}
