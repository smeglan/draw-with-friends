type Props = {
  connected: boolean;
};

export function ConnectionDot({ connected }: Props) {
  return (
    <div className={`h-2 w-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`} />
  );
}
