import { ACCESSORIES, DREAM_SLOTS, TOOLS } from '../core/types';
import { getContentDataset } from '../content/copy';
import { useGameStore } from './useGameStore';

const content = getContentDataset();

export function BagPanel() {
  const snapshot = useGameStore();
  const view = snapshot.uiView;

  if (!view) {
    return <aside class="panel bag" />;
  }

  const model = view.model;
  const toolkitNames = model.toolkit.length
    ? model.toolkit.map((id) => TOOLS.find((tool) => tool.id === id)?.label ?? id).join(', ')
    : `${content.screens.toolkit.selectedHint} 3`;
  const slotCount = DREAM_SLOTS.filter((slot) => (model.repair.slotProgress[slot.id] ?? 0) >= 2).length;

  return (
    <aside class="panel bag">
      <h3>🎒 Mala de Ferramentas</h3>
      <ul>
        <li>
          <strong>Avatar:</strong> skin {model.avatar.skin + 1}, cabelo {model.avatar.hair + 1}, olhos {model.avatar.eyes + 1}
        </li>
        <li>
          <strong>Acessório:</strong> {ACCESSORIES[model.avatar.accessory]}
        </li>
        <li>
          <strong>Ferramentas:</strong> {toolkitNames}
        </li>
        <li>
          <strong>Módulo:</strong> {slotCount}/4 núcleos online
        </li>
        <li>
          <strong>Combo Máx:</strong> x{model.maxCombo}
        </li>
      </ul>
      <div class={`module-status ${slotCount >= 3 ? 'ok' : ''}`}>
        {slotCount >= 3 ? 'Módulo dos Sonhos estabilizado.' : 'Módulo em recuperação.'}
      </div>
    </aside>
  );
}

