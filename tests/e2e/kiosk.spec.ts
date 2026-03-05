import { expect, test, type Page } from '@playwright/test';

type StubOptions = {
  popupBlocked?: boolean;
};

async function installBrowserStubs(page: Page, options: StubOptions = {}): Promise<void> {
  await page.addInitScript(
    ({ popupBlocked }) => {
      let fullscreenTarget: Element | null = null;
      let spectatorClosed = false;
      const fakeSpectatorWindow = {
        get closed() {
          return spectatorClosed;
        },
        focus() {
          return undefined;
        },
        close() {
          spectatorClosed = true;
        }
      };

      Object.defineProperty(window, '__fs_called', {
        configurable: true,
        writable: true,
        value: false
      });

      Object.defineProperty(document, 'fullscreenEnabled', {
        configurable: true,
        get: () => true
      });

      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: () => fullscreenTarget
      });

      Object.defineProperty(Element.prototype, 'requestFullscreen', {
        configurable: true,
        writable: true,
        value: async function requestFullscreen(): Promise<void> {
          fullscreenTarget = document.documentElement;
          (window as Window & { __fs_called: boolean }).__fs_called = true;
        }
      });

      Object.defineProperty(document, 'exitFullscreen', {
        configurable: true,
        writable: true,
        value: async function exitFullscreen(): Promise<void> {
          fullscreenTarget = null;
        }
      });

      Object.defineProperty(navigator, 'wakeLock', {
        configurable: true,
        value: {
          request: async () => ({
            released: false,
            release: async () => undefined,
            addEventListener: () => undefined,
            removeEventListener: () => undefined
          })
        }
      });

      Object.defineProperty(window, 'open', {
        configurable: true,
        writable: true,
        value: () => (popupBlocked ? null : (fakeSpectatorWindow as unknown as Window))
      });
    },
    { popupBlocked: options.popupBlocked ?? false }
  );
}

test('attract renderiza e START dispara fullscreen + fluxo', async ({ page }) => {
  await installBrowserStubs(page);
  await page.goto('/?test=1&introMs=900');

  await expect(page.getByTestId('screen-attract')).toBeVisible();
  await page.getByTestId('start-session').click();

  await expect(page.locator('[data-testid="screen-intro"], [data-testid="screen-avatar"]').first()).toBeVisible();
  const fsCalled = await page.evaluate(() => Boolean((window as Window & { __fs_called?: boolean }).__fs_called));
  expect(fsCalled).toBeTruthy();
});

test('intro auto-avança para avatar no timeout', async ({ page }) => {
  await installBrowserStubs(page);
  await page.goto('/?test=1&introMs=400&idleMs=5000');

  await page.getByTestId('start-session').click();
  await expect(page.getByTestId('screen-avatar')).toBeVisible({ timeout: 2_000 });
});

test('result auto-reset volta para attract', async ({ page }) => {
  await installBrowserStubs(page);
  await page.goto('/?test=1&resultResetMs=500');

  await page.getByTestId('start-session').click();
  await page.keyboard.press('F10');
  await expect(page.getByTestId('screen-result')).toBeVisible({ timeout: 2_000 });
  await expect(page.getByTestId('screen-attract')).toBeVisible({ timeout: 2_500 });
});

test('idle reset retorna ao attract sem input', async ({ page }) => {
  await installBrowserStubs(page);
  await page.goto('/?test=1&idleMs=700&introMs=6000');

  await page.getByTestId('start-session').click();
  await expect(page.getByTestId('screen-intro')).toBeVisible();
  await expect(page.getByTestId('screen-attract')).toBeVisible({ timeout: 2_500 });
});

test('ações de teclado não causam erro em runtime', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await installBrowserStubs(page);
  await page.goto('/?test=1&introMs=900');
  await page.getByTestId('start-session').click();

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  expect(pageErrors).toEqual([]);
});

test('se pop-up bloquear, sessão continua e botão retry sinaliza aviso', async ({ page }) => {
  await installBrowserStubs(page, { popupBlocked: true });
  await page.goto('/?test=1&introMs=900');
  await page.getByTestId('start-session').click();

  await expect(page.locator('[data-testid="screen-intro"], [data-testid="screen-avatar"]').first()).toBeVisible();
  await expect(page.locator('#spectatorRetry')).toHaveClass(/warning/);
});
