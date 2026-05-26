import DrawingBoard from "@/canvas/components/canvas/DrawingBoard";

export function HomeTemplate() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top,#1f2937_0%,#0b1120_38%,#050816_100%)] text-white">
      <div className="flex min-h-[100dvh] w-full">
        <DrawingBoard />
      </div>
    </main>
  );
}
