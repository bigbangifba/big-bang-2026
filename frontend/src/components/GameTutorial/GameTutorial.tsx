import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

interface GameTutorialProps {
    isActive: boolean;
    onClose: () => void;
}

const GameTutorial: React.FC<GameTutorialProps> = ({ isActive, onClose }) => {

    useEffect(() => {
        // Função que bloqueia qualquer clique fora do tutorial
        const preventGameClicks = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // 1. Se o clique foi dentro do popover do Tutorial (botões Próximo/Anterior), PERMITE.
            if (target.closest('.driver-popover')) {
                return;
            }

            // 2. Caso contrário (clicou no jogo, na tabela, nas opções), BLOQUEIA.
            e.stopPropagation();
            e.preventDefault();
        };

        if (isActive) {
            // ADICIONA O BLOQUEIO:
            document.addEventListener('click', preventGameClicks, true);

            const driverObj = driver({
                showProgress: true,
                animate: true,
                allowClose: true, // Se false, o usuário não pode fechar clicando fora

                doneBtnText: "Entendi, vamos jogar!",
                nextBtnText: "Próximo",
                prevBtnText: "Anterior",

                popoverClass: 'driverjs-theme',

                steps: [
                    {
                        element: '.question-title',
                        popover: {
                            title: 'BEM-VINDO AO DESAFIO! 🧪',
                            description: 'Seu objetivo é descobrir qual é o <b>Elemento Químico Oculto</b> e encontrá-lo na tabela.',
                            side: "bottom",
                            align: 'center'
                        }
                    },
                    {
                        element: '.tour-placar',
                        popover: {
                            title: 'SISTEMA DE PONTOS 🏆',
                            description: `Sua pontuação depende da sua eficiência:<br/><br/>
                            🟢 <b>5 Pontos:</b> Acertar com 1 dica.<br/>
                            🟡 <b>3 Pontos:</b> Acertar com 2 dicas.<br/>
                            🔴 <b>1 Ponto:</b> Acertar com 3 dicas.`,
                            side: "right",
                            align: 'start'
                        }
                    },
                    {
                        element: '.tour-btn-dica',
                        popover: {
                            title: 'COMO JOGAR 💡',
                            description: `<b>Clique aqui para INICIAR cada rodada!</b><br/><br/>
                            O jogo só começa quando você revela a primeira dica.<br/>`,
                            side: "left",
                            align: 'center'
                        }
                    },
                    {
                        element: '.tour-opcoes',
                        popover: {
                            title: 'RESPONDENDO 🔍',
                            description: 'Leu a dica e já sabe qual é? Clique na imagem correta do elemento nesta lista à direita.',
                            side: "left",
                            align: 'start'
                        }
                    },
                    {
                        element: '.tour-tabela',
                        popover: {
                            title: 'BÔNUS DE LOCALIZAÇÃO (+5) 🗺️',
                            description: 'Acertou o elemento? Não pare! Clique na <b>posição exata</b> dele na Tabela Periódica para ganhar pontos extras.',
                            side: "top",
                            align: 'start'
                        }
                    },
                    {
                        element: '.tour-ajudas',
                        popover: {
                            title: 'FERRAMENTAS DE APOIO 🧩',
                            description: `Os auxílios mudam conforme o nível:<br/><br/>
                            🟢 <b>Iniciante (5 Itens):</b> Diagrama de Linus Pauling, Subníveis, Numeração das Famílias, Dicas e Cerne do Gás Nobre.<br/><br/>
                            🟡 <b>Curioso (3 Itens):</b> Diagrama de Pauling, Numeração e Dicas.<br/><br/>
                            🔴 <b>Cientista (2 Itens):</b> Apenas Diagrama de Pauling e Dicas.`,
                            side: "right",
                            align: 'end'
                        }
                    },
                ],
                onDestroyStarted: () => {
                    // REMOVE O BLOQUEIO AO SAIR
                    document.removeEventListener('click', preventGameClicks, true);
                    onClose();
                    driverObj.destroy();
                },
            });

            driverObj.drive();
        }

        return () => {
            document.removeEventListener('click', preventGameClicks, true);
        };

    }, [isActive, onClose]);

    return null;
};


export default GameTutorial;
