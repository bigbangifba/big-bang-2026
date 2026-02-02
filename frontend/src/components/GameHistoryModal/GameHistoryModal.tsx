import React from 'react';
import '../../styles/styleGameHistoryModal.css';

export interface HistoricoJogada {
    rodada: number;
    nomeElemento: string; // Mantemos na interface caso precise no futuro, mas não exibimos no título
    imagemUrl: string;
    acertouDica: boolean;
    acertouPosicao: boolean;
    pontosGanhos: number;
    pontosDica: number;
    pontosPosicao: number;
}

interface GameHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    historico: HistoricoJogada[];
}

const GameHistoryModal: React.FC<GameHistoryModalProps> = ({ isOpen, onClose, historico }) => {
    if (!isOpen) return null;

    return (
        <div className="history-modal-overlay">
            <div className="history-modal-card">

                {/* Cabeçalho */}
                <div className="history-modal-header">
                    <h5 className="m-0 text-white">
                        <i className="bi bi-clock-history me-2"></i>Histórico
                    </h5>
                    <button className="btn-close-custom" onClick={onClose}>X</button>
                </div>

                {/* Corpo */}
                <div className="history-modal-body">
                    {historico.length === 0 ? (
                        <div className="history-empty">
                            <i className="bi bi-hourglass-split fs-1 d-block mb-3"></i>
                            <p>Nenhuma jogada registrada ainda.</p>
                        </div>
                    ) : (
                        <div className="history-list">
                            {historico.map((item, index) => (
                                <div key={index} className="history-item">
                                    {/* Imagem */}
                                    <div className="history-img-container">
                                        <img
                                            src={item.imagemUrl}
                                            alt={`Rodada ${item.rodada}`}
                                            className="history-img"
                                        />
                                    </div>

                                    {/* Conteúdo */}
                                    <div style={{ flexGrow: 1 }}>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            {/* Título SEM o nome do elemento */}
                                            <span className="history-item-title">
                                                {item.rodada}ª Rodada
                                            </span>

                                            {/* Badge de Pontos */}
                                            <span className={`badge ${item.pontosGanhos > 0 ? 'bg-success' : 'bg-danger'}`}>
                                                {item.pontosGanhos > 0 ? `+${item.pontosGanhos} pts` : '0 pts'}
                                            </span>
                                        </div>

                                        <div className="history-stats-row">
                                            {/* Dica */}
                                            <div className="history-stat-group">
                                                <span className="history-label">Dica</span>
                                                {item.pontosDica > 0 ? (
                                                    <span className="history-value-success">+{item.pontosDica}</span>
                                                ) : (
                                                    <span className="history-value-error">Errou</span>
                                                )}
                                            </div>

                                            {/* Posição */}
                                            <div className="history-stat-group">
                                                <span className="history-label">Posição na Tabela</span>
                                                {item.pontosPosicao > 0 ? (
                                                    <span className="history-value-success">+{item.pontosPosicao}</span>
                                                ) : (
                                                    <span className="history-value-error">Errou</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Rodapé */}
                <div className="history-modal-footer">
                    <button className="btn btn-secondary btn-sm px-4" onClick={onClose}>Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default GameHistoryModal;