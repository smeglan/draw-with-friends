import DrawingBoard from "@/canvas/components/canvas/DrawingBoard";

export function HomeTemplate() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#1f2937_0%,#0b1120_38%,#050816_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <section className="flex min-h-0 flex-1">
          <DrawingBoard />
        </section>
      </div>
    </main>
  );
}
