import { ACTIONS, type Action } from './actions';
import type { InputManager } from './inputManager';
import { replaceActionMapping, saveMapping } from './mapping';

const WIZARD_ACTIONS: Action[] = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'CONFIRM', 'CANCEL', 'START', 'SKIP'];

interface RemapWizardOptions {
  onCompleted?: () => void;
}

export class RemapWizard {
  private readonly input: InputManager;
  private readonly options: RemapWizardOptions;
  private readonly overlay: HTMLDivElement;
  private readonly title: HTMLHeadingElement;
  private readonly detail: HTMLParagraphElement;
  private active = false;
  private index = 0;

  constructor(input: InputManager, options: RemapWizardOptions = {}) {
    this.input = input;
    this.options = options;
    this.overlay = document.createElement('div');
    this.overlay.className = 'remap-overlay';
    this.overlay.hidden = true;

    const panel = document.createElement('div');
    panel.className = 'remap-panel';

    this.title = document.createElement('h3');
    this.detail = document.createElement('p');

    const hint = document.createElement('small');
    hint.textContent = 'Pressione tecla ou botão. ESC cancela.';

    panel.append(this.title, this.detail, hint);
    this.overlay.append(panel);
    document.body.append(this.overlay);

    window.addEventListener('keydown', this.onKeyDown);
  }

  isActive(): boolean {
    return this.active;
  }

  open(): void {
    if (this.active) {
      return;
    }

    this.active = true;
    this.index = 0;
    this.overlay.hidden = false;
    this.renderStep();
  }

  close(): void {
    this.active = false;
    this.overlay.hidden = true;
  }

  tick(): void {
    if (!this.active) {
      return;
    }

    const button = this.input.readAnyPressedGamepadButton();
    if (button === null) {
      return;
    }

    this.capture({ source: 'gamepad', button });
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (!this.active) {
      return;
    }

    if (event.code === 'Escape') {
      this.close();
      return;
    }

    event.preventDefault();
    this.capture({ source: 'keyboard', code: event.code });
  };

  private capture(entry: { source: 'keyboard'; code: string } | { source: 'gamepad'; button: number }): void {
    const action = WIZARD_ACTIONS[this.index];
    const updated = replaceActionMapping(this.input.getMapping(), action, entry);
    this.input.replaceMapping(updated);
    saveMapping(updated);

    this.index += 1;
    if (this.index >= WIZARD_ACTIONS.length) {
      this.title.textContent = 'Mapeamento salvo';
      this.detail.textContent = 'Configuração aplicada com sucesso.';
      this.options.onCompleted?.();
      window.setTimeout(() => this.close(), 700);
      return;
    }

    this.renderStep();
  }

  private renderStep(): void {
    const action = WIZARD_ACTIONS[this.index];
    this.title.textContent = 'Calibração da Bancada';
    this.detail.textContent = `Defina a ação ${action}`;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    this.overlay.remove();
  }
}

export function isValidAction(action: string): action is Action {
  return (ACTIONS as readonly string[]).includes(action);
}
