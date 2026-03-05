export type ScreenId = 'ATTRACT' | 'INTRO' | 'AVATAR' | 'TOOLKIT' | 'REPAIR' | 'RESULT';

export interface AvatarState {
  skin: number;
  hair: number;
  eyes: number;
  outfit: number;
  accessory: number;
}

export interface ToolItem {
  id: string;
  icon: string;
  label: string;
  summary: string;
}

export interface DreamSlot {
  id: string;
  label: string;
  acceptedTools: string[];
}

export interface RepairState {
  armedTool: string | null;
  slotProgress: Record<string, number>;
  feedback: string;
}

export interface GameModel {
  screen: ScreenId;
  missionMsLeft: number;
  avatar: AvatarState;
  toolkit: string[];
  repair: RepairState;
  comboStreak: number;
  maxCombo: number;
  sessionStarted: boolean;
  resultTitle: string;
  resultMessage: string;
  resultBadge: string;
}

export interface SpectatorPublicState {
  screen: ScreenId;
  missionMsLeft: number;
  avatar: AvatarState;
  toolkit: string[];
  repair: {
    completed: number;
    total: number;
    slotProgress: Record<string, number>;
  };
}

export const MISSION_TOTAL_MS = 150_000;

export const SKIN_COLORS = ['#f4c7a1', '#c48f68', '#925c3f', '#5e3523'];
export const HAIR_COLORS = ['#281c16', '#8c6239', '#1a1a1a', '#d4a45f'];
export const EYE_COLORS = ['#263238', '#0d47a1', '#1b5e20', '#4e342e'];
export const OUTFIT_COLORS = ['#25c9ff', '#7d6bff', '#26c281', '#ff7a59'];
export const ACCESSORIES = ['Sem Acessório', 'Viseira', 'Pulseira Tech', 'Capa de Missão'];

export const TOOLS: ToolItem[] = [
  {
    id: 'escuta-ativa',
    icon: '🎧',
    label: 'Escuta Ativa',
    summary: 'Conectar pessoas e reconstruir comunicação.'
  },
  {
    id: 'imaginacao',
    icon: '✨',
    label: 'Imaginação Aplicada',
    summary: 'Transformar ideias em soluções para a cidade.'
  },
  {
    id: 'empatia',
    icon: '💙',
    label: 'Empatia',
    summary: 'Entender necessidades reais antes de agir.'
  },
  {
    id: 'foco',
    icon: '🎯',
    label: 'Foco',
    summary: 'Manter atenção no que importa.'
  },
  {
    id: 'cooperacao',
    icon: '🤝',
    label: 'Cooperação',
    summary: 'Trabalhar junto para ir mais longe.'
  },
  {
    id: 'criatividade',
    icon: '🎨',
    label: 'Criatividade',
    summary: 'Inventar caminhos novos para velhos desafios.'
  }
];

export const DREAM_SLOTS: DreamSlot[] = [
  {
    id: 'comunicacao',
    label: 'Comunicação',
    acceptedTools: ['escuta-ativa', 'cooperacao']
  },
  {
    id: 'criatividade',
    label: 'Criatividade',
    acceptedTools: ['imaginacao', 'criatividade']
  },
  {
    id: 'coragem',
    label: 'Coragem',
    acceptedTools: ['foco', 'empatia']
  },
  {
    id: 'cooperacao',
    label: 'Cooperação',
    acceptedTools: ['cooperacao', 'escuta-ativa']
  }
];

export function createInitialModel(): GameModel {
  return {
    screen: 'ATTRACT',
    missionMsLeft: MISSION_TOTAL_MS,
    avatar: {
      skin: 0,
      hair: 0,
      eyes: 0,
      outfit: 0,
      accessory: 0
    },
    toolkit: [],
    repair: {
      armedTool: null,
      slotProgress: {},
      feedback: 'Selecione uma ferramenta e aplique em um núcleo.'
    },
    comboStreak: 0,
    maxCombo: 0,
    sessionStarted: false,
    resultTitle: 'Missão pronta para começar',
    resultMessage: 'Aperte START para liderar o resgate do Módulo dos Sonhos.',
    resultBadge: 'Selo Inicial'
  };
}

export function createInitialSlotProgress(): Record<string, number> {
  return DREAM_SLOTS.reduce<Record<string, number>>((acc, slot) => {
    acc[slot.id] = 0;
    return acc;
  }, {});
}
