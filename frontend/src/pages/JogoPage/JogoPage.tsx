import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TabelaPeriodicaInterativa from '../../components/TabelaPeriodicaInterativa/TabelaPeriodicaInterativa.tsx';
import FimDeJogo from "../../components/FimDeJogo/FimDeJogo.tsx";
import GameTutorial from '../../components/GameTutorial/GameTutorial.tsx';
import GameHistoryModal, { type HistoricoJogada } from '../../components/GameHistoryModal/GameHistoryModal.tsx';
import '../../styles/styleJogoPage.css';

// Configuração da URL da API
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_BASE_URL = `${BASE_URL}/api/jogo`;

// --- Interfaces (Tipos) ---
interface OpcaoElemento {
    nome: string;
    simbolo: string;
    imgUrl: string;
    imgDistribuicao?: string | null;
}

interface RodadaQuestao {
    nomeElemento: string;
    posicaoElemento: string;
    dicas: string[];
}
interface JogoData {
    listaOpcoes: OpcaoElemento[];
    rodadas: RodadaQuestao[];
}

// --- Constantes do Jogo ---
const PONTOS_POR_POSICAO = 5;
const MAX_RODADAS = 8;

const JogoPage: React.FC = () => {
    const { codNivel } = useParams<{ codNivel: string }>();
    const navigate = useNavigate();

    // Dados do Jogador
    const playerName = localStorage.getItem('playerName') || 'Jogador';
    const playerAvatarId = localStorage.getItem('playerAvatarId') || '1';
    const nivelId = codNivel ? parseInt(codNivel, 10) : 1;

    // --- Estados Principais ---
    const [jogoData, setJogoData] = useState<JogoData | null>(null);
    const [pontuacaoAtual, setPontuacaoAtual] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados de Controle do Jogo
    const [jogoEncerrado, setJogoEncerrado] = useState(false);
    const [rodadaAtualIndex, setRodadaAtualIndex] = useState(0);

    const [bloqueado, setBloqueado] = useState(false);

    // Estados de Mensagem e Feedback Visual
    const [mensagem, setMensagem] = useState('');
    type FeedbackType = 'neutro' | 'acerto' | 'erro';
    const [feedbackType, setFeedbackType] = useState<FeedbackType>('neutro');
    const feedbackTimerRef = useRef<number | null>(null);

    // Estados da Rodada
    const [dicasExibidas, setDicasExibidas] = useState<string[]>([]);
    const [pontosDestaDica, setPontosDestaDica] = useState(0);
    type GameStage = 'precisaDica' | 'adivinhandoElemento' | 'posicionandoElemento';
    const [gameStage, setGameStage] = useState<GameStage>('precisaDica');

    // Seleções do Usuário
    const [elementoSelecionado, setElementoSelecionado] = useState<OpcaoElemento | null>(null);
    const [opcoesUsadas, setOpcoesUsadas] = useState<string[]>([]);
    const [posicoesUsadas, setPosicoesUsadas] = useState<string[]>([]);
    const [isPaulingVisible, setIsPaulingVisible] = useState(false);

    // Controlar tutorial
    const [tutorialAtivo, setTutorialAtivo] = useState(false);

    // --- NOVO: Estados do Histórico e Balão de Dica ---
    const [historico, setHistorico] = useState<HistoricoJogada[]>([]);
    const [showHistorico, setShowHistorico] = useState(false);
    const [showDetailHint, setShowDetailHint] = useState(false);

    // --- FUNÇÕES DE ÁUDIO ---
    const tocarSomDica = () => {
        const audio = new Audio('/musica/choose-player.wav');
        audio.volume = 0.5;
        audio.play().catch(e => console.warn("Erro som dica:", e));
    };

    const tocarSomAcerto = () => {
        const audio = new Audio('/musica/acerto.wav');
        audio.volume = 0.5;
        audio.play().catch(e => console.warn("Erro som acerto:", e));
    };

    const tocarSomErro = () => {
        const audio = new Audio('/musica/erro.wav');
        audio.volume = 0.5;
        audio.play().catch(e => console.warn("Erro som erro:", e));
    };

    // --- FUNÇÃO AUXILIAR PARA O BALÃO ---
    const triggerDetailHint = () => {
        setShowDetailHint(true);
        setTimeout(() => {
            setShowDetailHint(false);
        }, 5000);
    };

    useEffect(() => {
        const jaViu = localStorage.getItem('bigbang_tutorial_v5');
        if (!jaViu) {
            setTutorialAtivo(true);
        }
    }, []);

    const mostrarFeedback = (texto: string, tipo: FeedbackType, resetDelay = 2000) => {
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);

        setMensagem(texto);
        setFeedbackType(tipo);

        if (tipo !== 'neutro') {
            feedbackTimerRef.current = setTimeout(() => {
                setFeedbackType('neutro');
            }, resetDelay);
        }
    };

    const fecharTutorial = () => {
        setTutorialAtivo(false);
        localStorage.setItem('bigbang_tutorial_v5', 'true');
    };

    const abrirAjuda = () => {
        setTutorialAtivo(true);
    };

    useEffect(() => {
        const permissao = sessionStorage.getItem('jogo_ativo');
        if (!permissao) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        document.body.classList.add('niveis-page-body');
        return () => document.body.classList.remove('niveis-page-body');
    }, []);

    useEffect(() => {
        if (!jogoEncerrado) return;
        setMensagem(`🎉 NÍVEL CONCLUÍDO! Pontuação final: ${pontuacaoAtual}`);
        submeterPontuacao();
    }, [jogoEncerrado]);

    useEffect(() => {
        const fetchJogoData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/questao/${nivelId}`);
                if (!response.ok) throw new Error(`Falha na API: Status ${response.status}`);
                const data: JogoData = await response.json();
                if (!data || !Array.isArray(data.rodadas) || data.rodadas.length === 0 || !Array.isArray(data.listaOpcoes)) {
                    throw new Error('A API retornou dados em um formato inesperado.');
                }
                setJogoData(data);
                // Mensagem inicial mais limpa
                setMensagem('Clique em DICAS para começar!');
            } catch (err: unknown) {
                console.error('Erro no fetchJogoData:', err);
                let errorMessage = 'Erro ao carregar dados.';
                if (err instanceof Error) errorMessage = `Erro: ${err.message}`;
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchJogoData();
    }, [nivelId]);

    const submeterPontuacao = async () => {
        try {
            const nivelNome = nivelId === 1 ? 'INICIANTE' : nivelId === 2 ? 'CURIOSO' : 'CIENTISTA';
            await fetch(`${API_BASE_URL}/submeter-pontuacao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario: playerName,
                    pontuacao: pontuacaoAtual,
                    nivel: nivelNome
                })
            });
            setMensagem(prev => prev + ' | Pontuação salva!');
        } catch (err) {
            setMensagem('Erro ao salvar pontuação.');
            console.error('Falha ao submeter pontuação:', err);
        }
    }

    const registrarHistorico = (
        nomeElemento: string,
        acertouDica: boolean,
        acertouPosicao: boolean,
        pontos: number,
        pontosDica: number,
        pontosPosicao: number
    ) => {
        const opcao = jogoData?.listaOpcoes.find(op => op.nome === nomeElemento);
        const imgUrl = opcao ? getImagemUrl(opcao.imgUrl, opcao.nome) : '';
        const novaJogada: HistoricoJogada = {
            rodada: rodadaAtualIndex + 1,
            nomeElemento,
            imagemUrl: imgUrl,
            acertouDica,
            acertouPosicao,
            pontosGanhos: pontos,
            pontosDica,
            pontosPosicao
        };
        setHistorico(prev => [novaJogada, ...prev]);
    };

    const proximaRodada = () => {
        if (jogoEncerrado || !jogoData) return;
        setDicasExibidas([]);
        setElementoSelecionado(null);
        setPontosDestaDica(0);
        setGameStage('precisaDica');
        setBloqueado(false);

        const proximoIndex = rodadaAtualIndex + 1;
        if (proximoIndex >= MAX_RODADAS || proximoIndex >= jogoData.rodadas.length) {
            setJogoEncerrado(true);
        } else {
            setRodadaAtualIndex(proximoIndex);
            // ALTERADO: Removemos "Rodada X." do texto da mensagem, pois já existe o título fixo
            mostrarFeedback(`Clique em DICAS!`, 'neutro');
        }
    };

    const usarDica = () => {
        if (bloqueado || jogoEncerrado || gameStage === 'posicionandoElemento' || !jogoData) return;
        const rodada = jogoData.rodadas[rodadaAtualIndex];
        if (!rodada || !Array.isArray(rodada.dicas)) {
            setMensagem('Erro: Dados da rodada estão incompletos.');
            return;
        }
        const dicasJaUsadas = dicasExibidas.length;
        if (dicasJaUsadas >= rodada.dicas.length) {
            setMensagem('Todas as dicas já foram usadas para este elemento!');
            return;
        }
        tocarSomDica();
        setDicasExibidas(prev => [...prev, rodada.dicas[dicasJaUsadas]]);
        if (dicasJaUsadas === 0) setPontosDestaDica(5);
        else if (dicasJaUsadas === 1) setPontosDestaDica(3);
        else setPontosDestaDica(1);
        setGameStage('adivinhandoElemento');
        mostrarFeedback(`Dica ${dicasJaUsadas + 1} revelada!`, 'neutro');
    };

    const handleElementoClick = (opcao: OpcaoElemento) => {
        if (bloqueado || gameStage !== 'adivinhandoElemento' || !jogoData) return;
        const rodada = jogoData.rodadas[rodadaAtualIndex];
        if (!rodada || typeof rodada.nomeElemento !== 'string') return;

        if (opcao.nome === rodada.nomeElemento) {
            tocarSomAcerto();
            setShowDetailHint(false);
            setPontuacaoAtual(prev => prev + pontosDestaDica);
            mostrarFeedback(`🎉 ACERTOU!!! (+${pontosDestaDica} pts) Agora clique na posição correta!`, 'acerto');
            setElementoSelecionado(opcao);
            setOpcoesUsadas(prev => [...prev, opcao.nome]);
            setGameStage('posicionandoElemento');
        } else {
            setBloqueado(true);
            tocarSomErro();
            triggerDetailHint();
            registrarHistorico(rodada.nomeElemento, false, false, 0, 0, 0);
            mostrarFeedback(`❌ ERROU! Indo para a próxima...`, 'erro');
            setGameStage('precisaDica');
            setTimeout(() => { proximaRodada(); }, 2000);
        }
    };

    const handlePosicaoClick = (posicaoValor: string) => {
        if (bloqueado || gameStage !== 'posicionandoElemento' || !jogoData || !elementoSelecionado) {
            if (!bloqueado && !elementoSelecionado) setMensagem('Selecione um elemento da lista da direita primeiro.');
            return;
        }
        const rodada = jogoData.rodadas[rodadaAtualIndex];
        if (!rodada || typeof rodada.posicaoElemento !== 'string') {
            setMensagem('Erro de dados.');
            return;
        }
        setBloqueado(true);
        setGameStage('precisaDica');

        if (posicaoValor === rodada.posicaoElemento) {
            tocarSomAcerto();
            setShowDetailHint(false);
            setPontuacaoAtual(prev => prev + PONTOS_POR_POSICAO);
            registrarHistorico(rodada.nomeElemento, true, true, pontosDestaDica + PONTOS_POR_POSICAO, pontosDestaDica, PONTOS_POR_POSICAO);
            mostrarFeedback(`🎉 POSIÇÃO CORRETA! (+${PONTOS_POR_POSICAO} pts)`, 'acerto');
            setPosicoesUsadas(prev => [...prev, posicaoValor]);
        } else {
            tocarSomErro();
            triggerDetailHint();
            registrarHistorico(rodada.nomeElemento, true, false, pontosDestaDica, pontosDestaDica, 0);
            mostrarFeedback(`❌ Posição incorreta!`, 'erro');
        }
        setTimeout(() => { proximaRodada(); }, 2000);
    };

    const getImagemUrl = (url: string | undefined | null, nomeElemento: string) => {
        if (url && url.startsWith('/uploads')) { return `${BASE_URL}${url}`; }
        if (url && (url.startsWith('/img') || url.startsWith('http'))) { return url; }
        return `/img/elementos/${nomeElemento}.jpg`;
    };

    const getDistribuicaoUrl = (url: string | undefined | null, nomeElemento: string) => {
        if (url && url.startsWith('/uploads')) { return `${BASE_URL}${url}`; }
        return `/img/distribuicao/${nomeElemento.toLowerCase()}.png`;
    };

    if (loading) return <div className="text-center mt-5 text-white">Carregando Jogo...</div>;
    if (error) return <div className="text-center mt-5 text-danger">{error}</div>;

    if (jogoEncerrado) {
        const nomeNivel = codNivel === '1' ? 'INICIANTE' : codNivel === '2' ? 'CURIOSO' : 'CIENTISTA';
        return (
            <FimDeJogo
                pontuacao={pontuacaoAtual}
                nivel={nomeNivel}
                nomeJogador={playerName}
                historico={historico}
            />
        );
    }

    if (!jogoData) return <div className="text-center mt-5 text-white">Sem dados.</div>;
    const rodadaInfo = jogoData.rodadas[rodadaAtualIndex];
    if (!rodadaInfo) return <div className="text-center mt-5 text-white">Erro na rodada.</div>;

    return (
        <>
            <GameTutorial isActive={tutorialAtivo} onClose={fecharTutorial} />

            <div className="game-layout-container">
                <div className="game-sidebar-left">
                    <div className="player-info-fixed-top tour-placar">
                        <p className="level-info">NÍVEL: {codNivel === '1' ? 'INICIANTE' : codNivel === '2' ? 'CURIOSO' : 'CIENTISTA'}</p>
                        <img src={`/img/avatar/monstrinho${playerAvatarId}.png`} alt="Avatar" className="player-avatar" />
                        <h4 className="player-name">{playerName}</h4>

                        {/* --- PONTUAÇÃO E BOTÃO "VER DETALHES" --- */}
                        <p className="player-score" style={{ marginBottom: '8px' }}>
                            Pontos: {pontuacaoAtual}
                        </p>

                        {/* Wrapper posicionado no CSS, muito mais limpo */}
                        <div className="botao-detalhes-wrapper">

                            <button
                                onClick={() => {
                                    setShowHistorico(true);
                                    setShowDetailHint(false);
                                }}
                                title="Ver histórico de acertos e erros"
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #15d2a3',
                                    color: '#15d2a3',
                                    borderRadius: '20px',
                                    padding: '4px 16px',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'block'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#15d2a3';
                                    e.currentTarget.style.color = '#111';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#15d2a3';
                                }}
                            >
                                Ver detalhes
                            </button>

                            {/* O Hint agora é controlado por classes CSS no arquivo externo */}
                            <div className={`hint-tooltip ${showDetailHint ? 'visible' : ''}`}>
                                Ver mais detalhes.
                            </div>

                        </div>
                    </div>

                    {/* --- CAIXA DE MENSAGEM ATUALIZADA --- */}
                    {/* Agora tem o título da rodada fixo em cima */}
                    <div className={`status-message-box ${feedbackType}`}>
                        <span className="titulo-rodada">
                            RODADA {rodadaAtualIndex + 1}
                        </span>
                        <p className="texto-mensagem" style={{ whiteSpace: 'pre-wrap' }}>{mensagem}</p>
                    </div>

                    <div className="tour-ajudas">
                        {isPaulingVisible ? (
                            <div className="pauling-display-area">
                                <button className="pauling-voltar-btn" onClick={() => setIsPaulingVisible(false)}>
                                    &lt;
                                </button>
                                <img src="/img/diagrama_verde.png" alt="Diagrama de Linus Pauling" className="pauling-diagram-img" />
                            </div>
                        ) : (
                            <div className="pauling-content-area">
                                <button className="pauling-diagram-btn" onClick={() => setIsPaulingVisible(true)}>
                                    DIAGRAMA DE PAULING
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ... (Resto do conteúdo: Tabela e Sidebar Direita) ... */}
                <div className="game-main-content tour-tabela">
                    <h1 className="question-title">Tabela Periódica</h1>
                    <TabelaPeriodicaInterativa
                        onPosicaoClick={handlePosicaoClick}
                        posicoesCorretas={posicoesUsadas}
                        codNivel={nivelId}
                    />
                    <div className="dicas-container-central">
                        {dicasExibidas.map((dica, index) => (
                            <h6 key={index} style={{ color: 'white', fontWeight: 'bold' }}>
                                {index + 1} - {dica}
                            </h6>
                        ))}
                    </div>
                </div>

                <div className="game-sidebar-right">
                    <div className="elements-grid tour-opcoes">
                        {jogoData?.listaOpcoes.map((opcao) => (
                            <button
                                key={opcao.nome}
                                className="element-option-btn"
                                onClick={() => handleElementoClick(opcao)}
                                disabled={opcoesUsadas.includes(opcao.nome) || jogoEncerrado || bloqueado}
                            >
                                <img
                                    src={getImagemUrl(opcao.imgUrl, opcao.nome)}
                                    alt={opcao.nome}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (target.src.includes('.jpg') && !target.src.includes('/uploads/')) {
                                            target.src = target.src.replace('.jpg', '.png');
                                        }
                                    }}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="selected-element-info">
                        {elementoSelecionado ? (
                            <>
                                <p>Elemento selecionado:</p>
                                <img
                                    src={getImagemUrl(elementoSelecionado.imgUrl, elementoSelecionado.nome)}
                                    alt={elementoSelecionado.nome}
                                    className="img-elemento-destaque"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (target.src.includes('.jpg') && !target.src.includes('/uploads/')) {
                                            target.src = target.src.replace('.jpg', '.png');
                                        }
                                    }}
                                />
                                {nivelId === 1 && (
                                    <>
                                        <div className="pauling-gas-nobre">CERNE DO GÁS NOBRE</div>
                                        <img
                                            src={getDistribuicaoUrl(elementoSelecionado.imgDistribuicao, elementoSelecionado.nome)}
                                            alt="Distribuição"
                                            className="img-distribuicao"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </>
                                )}
                            </>
                        ) : null}
                    </div>

                    <div className="dicas-area">
                        <button
                            className="btn-dica tour-btn-dica"
                            onClick={usarDica}
                            disabled={
                                gameStage === 'posicionandoElemento' ||
                                (rodadaInfo.dicas && dicasExibidas.length >= rodadaInfo.dicas.length) ||
                                jogoEncerrado ||
                                bloqueado
                            }
                        >
                            DICAS
                        </button>
                    </div>

                    <div className="home-button">
                        <button onClick={() => navigate('/')}>
                            <img src="/img/home.png" alt="Home" className="home-icon" />
                        </button>

                        <button onClick={abrirAjuda} className="btn-ajuda-manual" title="Como Jogar" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            <img src="/img/duvida.png" alt="Ajuda" className="home-icon" />
                        </button>
                    </div>
                </div>
            </div>

            <GameHistoryModal
                isOpen={showHistorico}
                onClose={() => setShowHistorico(false)}
                historico={historico}
            />
        </>
    );
};

export default JogoPage;