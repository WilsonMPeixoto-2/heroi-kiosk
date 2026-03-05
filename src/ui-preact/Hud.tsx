export function Hud() {
  return (
    <div class="hud">
      <div class="timer badge" id="timerBadge" aria-live="polite">
        <small>TEMPO</small>
        <span id="timerValue">02:30</span>
      </div>
      <div class="energy badge">
        <small>
          ENERGIA <strong id="energyValue">100%</strong>
        </small>
        <div class="track">
          <i id="energyFill" />
        </div>
      </div>
      <div class="hud-buttons">
        <button type="button" class="mini-btn" id="audioToggle">
          Som: ON
        </button>
        <button type="button" class="mini-btn" id="narrationMode">
          Narração: Legendas
        </button>
        <button type="button" class="mini-btn" id="narrationMute">
          Narração: ON
        </button>
        <button type="button" class="mini-btn" id="spectatorRetry">
          Abrir Tela do Público
        </button>
      </div>
    </div>
  );
}
