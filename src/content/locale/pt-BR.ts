import type { ContentDataset } from '../schema';

export const PT_BR_CONTENT: ContentDataset = {
  locale: 'pt-BR',
  screens: {
    attract: {
      pill: 'Dinâmica Sensorial + Tecnológica',
      title: {
        common: ['MÓDULO DOS SONHOS: OFFLINE', 'A CIDADE APAGOU. VOCÊ NÃO.'],
        rare: ['SEM SINAL. COM MISSÃO.'],
        legendary: ['O FUTURO ENTROU EM ALERTA MÁXIMO.']
      },
      subtitle: {
        common: [
          'A cidade caiu no modo automático. Você decide o próximo passo.',
          'Quando todo mundo só rola feed, alguém precisa religar o sonho.'
        ],
        rare: ['Pouco tempo. Impacto real.'],
        legendary: ['Hoje você vira a chave da cidade.']
      },
      ctaStart: {
        common: ['APERTE START', 'INICIAR MISSÃO'],
        rare: ['BORA REATIVAR'],
        legendary: ['ATIVAR MODO LENDÁRIO']
      },
      ctaSpectator: 'Abrir Tela do Público'
    },
    intro: {
      title: {
        common: ['Distopia curta. Ação imediata.'],
        rare: ['Contexto rápido. Escolha forte.']
      },
      line1: {
        common: [
          'Quando tudo vira feed, o sonho vira ruído.',
          'A cidade entrou em modo economia de imaginação.'
        ],
        rare: ['Sem conexão humana, o sistema colapsa.']
      },
      line2: {
        common: ['Você é a exceção. Bora reparar.', 'Agora é decisão em tempo real.'],
        rare: ['Sem desculpa. Só ação.'],
        legendary: ['Seu clique pode reacender bairros inteiros.']
      },
      continueCta: 'Continuar'
    },
    avatar: {
      title: 'Escolha seu estilo de herói',
      subtitle: 'Monte rápido e confirma. A missão não espera.',
      backCta: 'Voltar',
      confirmCta: 'Confirmar Avatar'
    },
    toolkit: {
      title: 'Mala de Ferramentas',
      subtitle: 'Escolha 3 ferramentas. Sem desculpa. Só ação.',
      selectedHint: 'Selecionadas',
      backCta: 'Voltar',
      startRepairCta: 'Iniciar Reparo',
      tooltips: {
        'escuta-ativa': 'Escuta antes de agir.',
        imaginacao: 'Transforma ideia em solução.',
        empatia: 'Entende a dor real da cidade.',
        foco: 'Segura o plano até o fim.',
        cooperacao: 'Soma força com o time.',
        criatividade: 'Abre caminho novo.'
      }
    },
    repair: {
      title: 'Conserto do Módulo dos Sonhos',
      subtitle: 'Ative ferramentas e recupere 3 núcleos.',
      initialFeedback: 'Escolha uma ferramenta e aplique em um núcleo.',
      needTool: {
        common: ['Selecione uma ferramenta antes de aplicar.', 'Sem ferramenta ativa ainda.'],
        rare: ['Arma a ferramenta e manda.']
      },
      alreadyStable: {
        common: ['{slot} já está estável.', '{slot} já ficou online.']
      },
      progressLabel: 'Núcleos ativos',
      comboLabel: 'Combo',
      backCta: 'Voltar',
      finishCta: 'Finalizar Missão',
      hit: {
        common: ['Sinal recuperado.', 'Conexão restabelecida.', 'Boa. Continua.'],
        rare: ['Acerto limpo.'],
        legendary: ['Precisão de elite.']
      },
      miss: {
        common: ['Quase lá. Ajusta e tenta de novo.', 'Essa combinação não travou. Troca e segue.'],
        rare: ['Tentativa válida. Próxima vem forte.']
      },
      combo: {
        common: ['Fluxo x{combo}. Mantém o ritmo.', 'Combo x{combo}. Cidade reagindo.'],
        rare: ['Sequência quente x{combo}.']
      },
      timeout: {
        common: ['Tempo curto. Impacto real. De novo?', 'Parte restaurada. Já conta.'],
        rare: ['Fim de tempo, progresso garantido.']
      },
      winPartial: {
        common: ['Já deu luz. Agora é manter aceso.', 'Recuperação parcial. Sistema respirando de novo.'],
        rare: ['Parcial forte. Base reativada.']
      },
      winFull: {
        common: ['Módulo estabilizado. A cidade voltou a sonhar.', 'Núcleo online. Missão completa.'],
        rare: ['Restauração quase perfeita.'],
        legendary: ['Sincronização lendária. Cidade em brilho máximo.']
      },
      slotNames: {
        comunicacao: 'Comunicação',
        criatividade: 'Criatividade',
        coragem: 'Coragem',
        cooperacao: 'Cooperação'
      },
      slotComplete: {
        comunicacao: {
          common: ['Comunicação: online.', 'Comunicação: reconectada.']
        },
        criatividade: {
          common: ['Criatividade: reacendida.', 'Criatividade: desbloqueada.']
        },
        coragem: {
          common: ['Coragem: online.', 'Coragem: firme no sistema.']
        },
        cooperacao: {
          common: ['Cooperação: desbloqueada.', 'Cooperação: em rede total.']
        }
      }
    },
    result: {
      full: {
        title: {
          common: ['Missão concluída com excelência', 'Cidade reativada'],
          rare: ['Conquista de alto impacto'],
          legendary: ['Missão lendária desbloqueada']
        },
        message: {
          common: [
            'A cidade voltou a respirar. Você puxou a faísca.',
            'Núcleos restaurados. O futuro ganhou cor de novo.'
          ],
          rare: ['Restauração completa. Referência de missão.'],
          legendary: ['Sequência rara ativada. Brilho máximo confirmado.']
        }
      },
      partial: {
        title: {
          common: ['Missão concluída com recuperação parcial', 'Sistema estabilizado parcialmente']
        },
        message: {
          common: [
            'Você já trouxe luz para o sistema. Próxima rodada acelera o restante.',
            'Parte crítica restaurada. A cidade já sente a diferença.'
          ],
          rare: ['Parcial sólido. Base para virada total.']
        }
      },
      timeout: {
        title: {
          common: ['Tempo encerrado. Missão válida.', 'Janela de missão encerrada']
        },
        message: {
          common: [
            'Tempo curto. Impacto real. Quer tentar mais uma?',
            'Você deixou progresso no sistema. A próxima rodada continua daqui.'
          ],
          rare: ['Fim de janela com dados valiosos para o próximo ciclo.']
        }
      },
      playAgainCta: 'Jogar novamente',
      goMemoryCta: 'Ir para Jogo da Memória',
      summaryLabels: {
        toolsUsed: 'Ferramentas usadas',
        restoredSlots: 'Núcleos restaurados',
        energyLeft: 'Energia restante',
        maxCombo: 'Combo máximo',
        heroBadge: 'Selo do Herói'
      }
    }
  },
  spectator: {
    title: 'Tela do Público',
    waiting: 'Aguardando jogador...',
    screenLabel: {
      ATTRACT: 'Chamando público',
      INTRO: 'Contexto em andamento',
      AVATAR: 'Construção do protagonista',
      TOOLKIT: 'Escolha da mala',
      REPAIR: 'Reparo do Módulo dos Sonhos',
      RESULT: 'Resultado da missão'
    },
    progressByThreshold: [
      { threshold: 0, line: 'Sem núcleo ativo ainda.' },
      { threshold: 0.25, line: 'Primeiro núcleo respondendo.' },
      { threshold: 0.5, line: 'Metade do módulo já reacendeu.' },
      { threshold: 0.75, line: 'Cidade quase em retomada total.' },
      { threshold: 1, line: 'Módulo estável. Sonhos online.' }
    ],
    energyLabel: 'Energia restante',
    moduleLabel: 'Progresso do módulo',
    activeBagLabel: 'Mala ativa'
  }
};
