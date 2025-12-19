export class UniqueStack<T = any> {
  private list: T[];
  private set: Set<T>;
  private limit: number;

  constructor(items: T[] = [], limit: number = Infinity) {
    this.list = [];
    this.set = new Set<T>();
    this.limit = limit;

    // IMPORTANT: replay items from oldest → newest
    [...items].reverse().forEach((i) => this.add(i));
  }

  add(value: T): void {
    if (this.set.has(value)) {
      this.list = this.list.filter((v) => v !== value);
    } else {
      this.set.add(value);
    }

    // newest always at front
    this.list.unshift(value);

    // enforce limit → remove oldest
    if (this.list.length > this.limit) {
      const removed = this.list.pop();
      if (removed !== undefined) {
        this.set.delete(removed);
      }
    }
  }

  values(): T[] {
    return this.list;
  }
}
