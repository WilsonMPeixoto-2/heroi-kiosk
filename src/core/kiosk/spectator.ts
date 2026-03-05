export interface SpectatorStatus {
  opened: boolean;
  popupBlocked: boolean;
}

export class SpectatorWindowController {
  private spectatorWindow: Window | null = null;

  open(): SpectatorStatus {
    const opened = window.open(
      '/spectator.html',
      'heroi-spectator',
      'popup,width=1280,height=720,left=40,top=40'
    );

    if (!opened) {
      return {
        opened: false,
        popupBlocked: true
      };
    }

    this.spectatorWindow = opened;
    this.spectatorWindow.focus();

    return {
      opened: true,
      popupBlocked: false
    };
  }

  retry(): SpectatorStatus {
    return this.open();
  }

  close(): void {
    if (this.spectatorWindow && !this.spectatorWindow.closed) {
      this.spectatorWindow.close();
    }
    this.spectatorWindow = null;
  }
}
