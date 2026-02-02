import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHistoryModal, { type HistoricoJogada } from '../GameHistoryModal/GameHistoryModal';
import '../../styles/styleJogoPage.css';

interface FimDeJogoProps {
    pontuacao: number;
    nivel: string;
    nomeJogador: string;
    historico: HistoricoJogada[];
}

const FimDeJogo: React.FC<FimDeJogoProps> = ({ pontuacao, nivel, nomeJogador, historico }) => {
    const navigate = useNavigate();
    const [showHistorico, setShowHistorico] = useState(false);

    return (
        <>
            <div className="tela-fim-jogo">

                {/* INFO BOXES */}
                <div className="fim-conteudo-central">
                    <div className="fim-info-box">
                        Nível: {nivel}
                    </div>
                    <div className="fim-info-box">
                        Nome: {nomeJogador}
                    </div>

                    {/* A caixa de pontuação volta ao normal */}
                    <div className="fim-info-box">
                        Pontuação: {pontuacao} pts
                    </div>

                    {/* BOTÃO VER DETALHES (Agora fora da caixa verde) */}
                    <button
                        onClick={() => setShowHistorico(true)}
                        title="Ver histórico de jogadas"
                        style={{
                            background: 'transparent',
                            border: '1px solid #15d2a3', // Cor Ciano/Verde do tema
                            color: '#15d2a3',
                            borderRadius: '20px',
                            padding: '8px 24px', // Um pouco maior para facilitar o clique
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            marginTop: '10px', // Espaço para separar da caixa de cima
                            textTransform: 'uppercase',
                            fontWeight: 'bold',
                            boxShadow: '0 0 10px rgba(21, 210, 163, 0.1)' // Um brilho leve
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(21, 210, 163, 0.1)'; // Fundo leve ao passar o mouse
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        Ver detalhes
                    </button>
                </div>

                {/* DECORAÇÃO */}
                <div className="fim-decoracao-container">
                    <img src="/img/trofeu/trofeuRanking.png" alt="Troféu" className="img-trofeu trofeu-esquerda" />
                    <img src="/img/finish.png" alt="Fim de Jogo" className="img-finish" />
                    <img src="/img/trofeu/trofeuRanking.png" alt="Troféu" className="img-trofeu trofeu-direita" />
                </div>

                {/* BOTÕES DE NAVEGAÇÃO */}
                <div className="botoes-fim-container">
                    {/* Botão Ranking */}
                    <button className="btn-icon-fim" onClick={() => navigate('/ranking')} title="Ver Ranking">
                        <img src="/img/ranking.webp" alt="Ranking" onError={(e) => e.currentTarget.style.display='none'} />
                        <span style={{ position:'absolute', fontSize:'2rem', opacity: 0.5 }}></span>
                    </button>

                    {/* Botão Home */}
                    <button className="btn-icon-fim" onClick={() => navigate('/')} title="Início">
                        <img src="/img/home.png" alt="Início" />
                    </button>
                </div>
            </div>

            {/* MODAL DE HISTÓRICO */}
            <GameHistoryModal
                isOpen={showHistorico}
                onClose={() => setShowHistorico(false)}
                historico={historico}
            />
        </>
    );
};

export default FimDeJogo;