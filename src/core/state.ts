export class StateMachine<TState extends string> {
  private currentState: TState;
  private readonly listeners = new Set<(next: TState, previous: TState) => void>();

  constructor(initial: TState) {
    this.currentState = initial;
  }

  get current(): TState {
    return this.currentState;
  }

  onChange(listener: (next: TState, previous: TState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  transition(next: TState): void {
    if (next === this.currentState) {
      return;
    }

    const previous = this.currentState;
    this.currentState = next;
    this.listeners.forEach((listener) => listener(next, previous));
  }
}
