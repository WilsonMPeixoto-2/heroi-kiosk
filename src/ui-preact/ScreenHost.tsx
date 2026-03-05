import { memo } from 'preact/compat';

function ScreenHostInner() {
  return (
    <section class="panel stage">
      <nav class="steps" id="steps" />
      <div id="vfxHost" class="vfx-host" />
      <div id="screenRoot" />
    </section>
  );
}

export const ScreenHost = memo(ScreenHostInner);
