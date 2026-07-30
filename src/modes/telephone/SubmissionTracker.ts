export class SubmissionTracker {
  private submissions = new Set<string>();

  add(playerId: string): boolean {
    this.submissions.add(playerId);
    return this.allSubmitted;
  }

  reset(): void {
    this.submissions = new Set();
  }

  has(playerId: string): boolean {
    return this.submissions.has(playerId);
  }

  delete(playerId: string): void {
    this.submissions.delete(playerId);
  }

  get allSubmitted(): boolean {
    return this.submissions.size >= this.requiredCount;
  }

  get size(): number {
    return this.submissions.size;
  }

  get submittedIds(): string[] {
    return Array.from(this.submissions);
  }

  constructor(private requiredCount: number) {}

  updateRequiredCount(count: number): void {
    this.requiredCount = count;
  }
}
