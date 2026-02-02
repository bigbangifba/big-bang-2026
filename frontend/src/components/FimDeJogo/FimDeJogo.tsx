import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/styleJogoPage.css';

interface FimDeJogoProps {
    pontuacao: number;
    nivel: string;
    nomeJogador: string;
}

const FimDeJogo: React.FC<FimDeJogoProps> = ({ pontuacao, nivel, nomeJogador }) => {
    const navigate = useNavigate();

    return (
        <div className="tela-fim-jogo">

            {/* INFO BOXES */}
            <div className="fim-conteudo-central">
                <div className="fim-info-box">
                    Nível: {nivel}
                </div>
                <div className="fim-info-box">
                    Nome: {nomeJogador}
                </div>
                <div className="fim-info-box">
                    Pontuação: {pontuacao} pts
                </div>
            </div>

            {/* DECORAÇÃO */}
            <div className="fim-decoracao-container">
                <img src="/img/trofeu/trofeuRanking.png" alt="Troféu" className="img-trofeu trofeu-esquerda" />
                <img src="/img/finish.png" alt="Fim de Jogo" className="img-finish" />
                <img src="/img/trofeu/trofeuRanking.png" alt="Troféu" className="img-trofeu trofeu-direita" />
            </div>

            {/* BOTÕES */}
            <div className="botoes-fim-container">
                {/* Botão Ranking */}
                <button className="btn-icon-fim" onClick={() => navigate('/ranking')} title="Ver Ranking">
                    <img src="/img/ranking.webp" alt="Ranking" onError={(e) => e.currentTarget.style.display='none'} />
                    {/* Ícone de fallback caso a imagem falhe */}
                    <span style={{ position:'absolute', fontSize:'2rem', opacity: 0.5 }}></span>
                </button>

                {/* Botão Home */}
                <button className="btn-icon-fim" onClick={() => navigate('/')} title="Início">
                    <img src="/img/home.png" alt="Início" />
                </button>
            </div>
        </div>
    );
};

export default FimDeJogo;