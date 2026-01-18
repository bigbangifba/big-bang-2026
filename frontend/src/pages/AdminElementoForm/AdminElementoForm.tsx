import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

// Importação do PrimeReact e Estilos
import { AutoComplete } from 'primereact/autocomplete';
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

// --- DADOS ---
const TABELA_PERIODICA_FIXA = [
    { s: 'H', n: 'Hidrogênio' }, { s: 'He', n: 'Hélio' }, { s: 'Li', n: 'Lítio' }, { s: 'Be', n: 'Berílio' },
    { s: 'B', n: 'Boro' }, { s: 'C', n: 'Carbono' }, { s: 'N', n: 'Nitrogênio' }, { s: 'O', n: 'Oxigênio' },
    { s: 'F', n: 'Flúor' }, { s: 'Ne', n: 'Neônio' }, { s: 'Na', n: 'Sódio' }, { s: 'Mg', n: 'Magnésio' },
    { s: 'Al', n: 'Alumínio' }, { s: 'Si', n: 'Silício' }, { s: 'P', n: 'Fósforo' }, { s: 'S', n: 'Enxofre' },
    { s: 'Cl', n: 'Cloro' }, { s: 'Ar', n: 'Argônio' }, { s: 'K', n: 'Potássio' }, { s: 'Ca', n: 'Cálcio' },
    { s: 'Sc', n: 'Escândio' }, { s: 'Ti', n: 'Titânio' }, { s: 'V', n: 'Vanádio' }, { s: 'Cr', n: 'Cromo' },
    { s: 'Mn', n: 'Manganês' }, { s: 'Fe', n: 'Ferro' }, { s: 'Co', n: 'Cobalto' }, { s: 'Ni', n: 'Níquel' },
    { s: 'Cu', n: 'Cobre' }, { s: 'Zn', n: 'Zinco' }, { s: 'Ga', n: 'Gálio' }, { s: 'Ge', n: 'Germânio' },
    { s: 'As', n: 'Arsênio' }, { s: 'Se', n: 'Selênio' }, { s: 'Br', n: 'Bromo' }, { s: 'Kr', n: 'Criptônio' },
    { s: 'Rb', n: 'Rubídio' }, { s: 'Sr', n: 'Estrôncio' }, { s: 'Y', n: 'Ítrio' }, { s: 'Zr', n: 'Zircônio' },
    { s: 'Nb', n: 'Nióbio' }, { s: 'Mo', n: 'Molibdênio' }, { s: 'Tc', n: 'Tecnécio' }, { s: 'Ru', n: 'Rutênio' },
    { s: 'Rh', n: 'Ródio' }, { s: 'Pd', n: 'Paládio' }, { s: 'Ag', n: 'Prata' }, { s: 'Cd', n: 'Cádmio' },
    { s: 'In', n: 'Índio' }, { s: 'Sn', n: 'Estanho' }, { s: 'Sb', n: 'Antimônio' }, { s: 'Te', n: 'Telúrio' },
    { s: 'I', n: 'Iodo' }, { s: 'Xe', n: 'Xenônio' }, { s: 'Cs', n: 'Césio' }, { s: 'Ba', n: 'Bário' },
    { s: 'La', n: 'Lantânio' }, { s: 'Ce', n: 'Cério' }, { s: 'Pr', n: 'Praseodímio' }, { s: 'Nd', n: 'Neodímio' },
    { s: 'Pm', n: 'Promécio' }, { s: 'Sm', n: 'Samário' }, { s: 'Eu', n: 'Európio' }, { s: 'Gd', n: 'Gadolínio' },
    { s: 'Tb', n: 'Térbio' }, { s: 'Dy', n: 'Disprósio' }, { s: 'Ho', n: 'Hólmio' }, { s: 'Er', n: 'Érbio' },
    { s: 'Tm', n: 'Túlio' }, { s: 'Yb', n: 'Itérbio' }, { s: 'Lu', n: 'Lutécio' }, { s: 'Hf', n: 'Háfnio' },
    { s: 'Ta', n: 'Tântalo' }, { s: 'W', n: 'Tungstênio' }, { s: 'Re', n: 'Rênio' }, { s: 'Os', n: 'Ósmio' },
    { s: 'Ir', n: 'Irídio' }, { s: 'Pt', n: 'Platina' }, { s: 'Au', n: 'Ouro' }, { s: 'Hg', n: 'Mercúrio' },
    { s: 'Tl', n: 'Tálio' }, { s: 'Pb', n: 'Chumbo' }, { s: 'Bi', n: 'Bismuto' }, { s: 'Po', n: 'Polônio' },
    { s: 'At', n: 'Astato' }, { s: 'Rn', n: 'Radônio' }, { s: 'Fr', n: 'Frâncio' }, { s: 'Ra', n: 'Rádio' },
    { s: 'Ac', n: 'Actínio' }, { s: 'Th', n: 'Tório' }, { s: 'Pa', n: 'Protactínio' }, { s: 'U', n: 'Urânio' },
    { s: 'Np', n: 'Netúnio' }, { s: 'Pu', n: 'Plutônio' }, { s: 'Am', n: 'Amerício' }, { s: 'Cm', n: 'Cúrio' },
    { s: 'Bk', n: 'Berquélio' }, { s: 'Cf', n: 'Califórnio' }, { s: 'Es', n: 'Einstênio' }, { s: 'Fm', n: 'Férmio' },
    { s: 'Md', n: 'Mendelévio' }, { s: 'No', n: 'Nobélio' }, { s: 'Lr', n: 'Laurêncio' }, { s: 'Rf', n: 'Rutherfórdio' },
    { s: 'Db', n: 'Dúbnio' }, { s: 'Sg', n: 'Seabórgio' }, { s: 'Bh', n: 'Bóhrio' }, { s: 'Hs', n: 'Hássio' },
    { s: 'Mt', n: 'Meitnério' }, { s: 'Ds', n: 'Darmstádio' }, { s: 'Rg', n: 'Roentgênio' }, { s: 'Cn', n: 'Copernício' },
    { s: 'Nh', n: 'Nihônio' }, { s: 'Fl', n: 'Fleróvio' }, { s: 'Mc', n: 'Moscóvio' }, { s: 'Lv', n: 'Livermório' },
    { s: 'Ts', n: 'Tenesso' }, { s: 'Og', n: 'Oganessônio' }
];

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const api = axios.create({ baseURL: `${BASE_URL}/api` });

interface ElementoTabela {
    s: string;
    n: string;
}

const AdminElementoForm: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Estados
    const [nome, setNome] = useState('');
    const [simbolo, setSimbolo] = useState('');
    const [nivel, setNivel] = useState('1');
    const [dicas, setDicas] = useState<string[]>(['', '', '']);
    const [imagemAtualUrl, setImagemAtualUrl] = useState('');
    const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [distAtualUrl, setDistAtualUrl] = useState('');
    const [distArquivo, setDistArquivo] = useState<File | null>(null);
    const [distPreview, setDistPreview] = useState('');

    // AutoComplete
    const [valorSelecionado, setValorSelecionado] = useState<string | ElementoTabela>('');
    const [sugestoesFiltradas, setSugestoesFiltradas] = useState<ElementoTabela[]>([]);

    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (id) {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            api.get(`/elementos/${id}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                    const dados = res.data;
                    setNome(dados.nome);
                    setSimbolo(dados.simbolo);
                    setNivel(String(dados.nivel));
                    setValorSelecionado({ s: dados.simbolo, n: dados.nome });
                    const dicasBackend = dados.dicas || [];
                    setDicas([dicasBackend[0] || '', dicasBackend[1] || '', dicasBackend[2] || '']);
                    if (dados.imagemUrl) setImagemAtualUrl(`${BASE_URL}${dados.imagemUrl}`);
                    if (dados.imgDistribuicao) setDistAtualUrl(`${BASE_URL}${dados.imgDistribuicao}`);
                })
                .catch(err => { console.error(err); setErro('Erro ao carregar dados.'); })
                .finally(() => setLoading(false));
        }
    }, [id]);

    const search = (event: any) => {
        const query = (event.query || '').toLowerCase();
        const resultados = TABELA_PERIODICA_FIXA.filter(elemento => {
            if (!query.trim()) {
                return true;
            }
            return elemento.n.toLowerCase().includes(query) ||
                   elemento.s.toLowerCase().includes(query);
        });
        setSugestoesFiltradas(resultados);
    };

    const aoMudarValor = (e: any) => {
        const value = e.value ?? '';
        setValorSelecionado(value);

        if (typeof value === 'object' && value !== null) {
            setNome(value.n);
            setSimbolo(value.s);
        } else {
            if (!value) {
                setNome('');
                setSimbolo('');
            }
        }
    };

    const itemTemplate = (item: ElementoTabela) => {
        return (
            <div className="flex align-items-center" style={{ height: '40px', display: 'flex', alignItems: 'center', padding: '0 10px', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontWeight: 'bold', color: '#15d2a3', minWidth: '40px' }}>{item.s}</span>
                <span style={{ color: '#333' }}>{item.n}</span>
            </div>
        );
    };

    const handleDicaChange = (index: number, value: string) => {
        const novas = [...dicas]; novas[index] = value; setDicas(novas);
    };
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) { setImagemArquivo(e.target.files[0]); setPreviewUrl(URL.createObjectURL(e.target.files[0])); }
    };
    const handleDistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) { setDistArquivo(e.target.files[0]); setDistPreview(URL.createObjectURL(e.target.files[0])); }
    };

    const normalizeString = (str: string) => {
        if (!str) return '';
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    };

    const handleSalvar = async () => {
        setErro('');
        if (!nome || !simbolo) return toast.error('Selecione um elemento válido.');
        if (dicas.some(d => d.trim() === '')) return toast.error('Preencha as 3 dicas.');

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('nome', normalizeString(nome));
            formData.append('simbolo', normalizeString(simbolo));
            formData.append('nivel', nivel);
            formData.append('dicas', JSON.stringify(dicas));
            if (imagemArquivo) formData.append('imagem', imagemArquivo);
            if (nivel === '1' && distArquivo) formData.append('imagemDistribuicao', distArquivo);

            const token = sessionStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };

            if (id) {
                await api.put(`/elementos/${id}`, formData, config);
                toast.success('Editado com sucesso!');
            } else {
                await api.post('/elementos', formData, config);
                toast.success('Criado com sucesso!');
            }
            setTimeout(() => navigate('/admin/elementos'), 500);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Erro ao salvar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4 text-white" style={{ maxWidth: '900px', paddingBottom: '150px' }}>
            <style>{`
                .custom-autocomplete .p-inputtext {
                    padding-top: 1rem;
                    padding-bottom: 1rem;
                    font-size: 1.1rem;
                }
                .custom-autocomplete .p-autocomplete-dropdown {
                    width: 3rem;
                }
                .p-autocomplete-panel {
                    background-color: white !important;
                    border: 1px solid #ddd !important;
                }
            `}</style>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>{id ? `Editar: ${nome}` : 'Novo Elemento'}</h2>
            </div>
            {erro && <div className="alert alert-danger">{erro}</div>}

            <div className="row" style={{ overflow: 'visible' }}>
                <div className="col-md-4 mb-4">
                    <div className="text-center mb-4">
                        <label className="form-label fw-bold">Imagem Principal</label>
                        <div style={{ width: '100%', height: '200px', backgroundColor: '#222', border: '2px dashed #15d2a3', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {previewUrl ? <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                                imagemAtualUrl ? <img src={imagemAtualUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                                    <div className="text-muted"><i className="bi bi-image fs-1"></i></div>}
                        </div>
                        <input type="file" className="form-control mt-2" accept="image/*" onChange={handleImageChange} />
                    </div>
                    {nivel === '1' && (
                        <div className="text-center p-3 border border-warning rounded bg-dark">
                            <label className="form-label fw-bold text-warning">Cerne do Gás Nobre</label>
                            <div style={{ width: '100%', height: '150px', backgroundColor: '#333', border: '2px dashed #ffc107', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {distPreview ? <img src={distPreview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> :
                                    distAtualUrl ? <img src={distAtualUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> :
                                        <div className="text-muted small">Img Distribuição</div>}
                            </div>
                            <input type="file" className="form-control mt-2 form-control-sm" accept="image/*" onChange={handleDistChange} />
                        </div>
                    )}
                </div>

                <div className="col-md-8" style={{ overflow: 'visible' }}>
                    <div className="mb-4" style={{ position: 'relative', zIndex: 100 }}>
                        <label className="form-label text-warning">
                            {id ? 'Elemento (Leitura)' : 'Pesquisar Elemento'}
                        </label>
                        
                        <AutoComplete
                            value={valorSelecionado}
                            suggestions={sugestoesFiltradas}
                            completeMethod={search}
                            field="n"
                            dropdown
                            dropdownMode="blank"
                            scrollHeight="300px"
                            onChange={aoMudarValor}
                            itemTemplate={itemTemplate}
                            placeholder="Digite o nome ou símbolo (ex: Au)"
                            disabled={!!id}
                            className="w-100 custom-autocomplete"
                            inputClassName="w-100"
                            virtualScrollerOptions={{ itemSize: 41 }}
                            appendTo={document.body}
                        />
                        
                        {!id && <small className="text-muted d-block mt-2">Comece a digitar ou clique na seta para ver a lista.</small>}
                    </div>

                    {!id && (
                        <div className="row mb-3">
                            <div className="col-9">
                                <input type="text" className="form-control bg-secondary text-white border-0" value={nome} readOnly placeholder="Nome confirmado" />
                            </div>
                            <div className="col-3">
                                <input type="text" className="form-control bg-secondary text-white border-0 text-center fw-bold" value={simbolo} readOnly placeholder="Símbolo" />
                            </div>
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="form-label">Nível</label>
                        <select className="form-select form-select-lg" value={nivel} onChange={e => setNivel(e.target.value)}>
                            <option value="1">1 - Iniciante</option>
                            <option value="2">2 - Curioso</option>
                            <option value="3">3 - Cientista</option>
                        </select>
                    </div>

                    <div className="card bg-dark border-secondary p-4">
                        <h5 className="text-info mb-3">Dicas (3 Obrigatórias)</h5>
                        {[0, 1, 2].map(idx => (
                            <div className="mb-2" key={idx}>
                                <input type="text" className="form-control" placeholder={`Dica ${idx + 1}`} value={dicas[idx]} onChange={(e) => handleDicaChange(idx, e.target.value)} />
                            </div>
                        ))}
                    </div>

                    <div className="d-flex justify-content-end gap-3 mt-4">
                        <button className="btn btn-secondary" onClick={() => navigate('/admin/elementos')} disabled={loading}>Voltar</button>
                        <button className="btn btn-success px-5" onClick={handleSalvar} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminElementoForm;