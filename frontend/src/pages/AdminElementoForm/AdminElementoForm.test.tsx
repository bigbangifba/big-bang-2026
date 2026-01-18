import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminElementoForm from './AdminElementoForm';
import toast from 'react-hot-toast';

// --- MOCKS ---

// 1. React Router
const mockedNavigate = vi.fn();
const mockedParams = { id: undefined as string | undefined };

vi.mock('react-router-dom', async () => {
    const atual = await vi.importActual('react-router-dom');
    return {
        ...atual,
        useNavigate: () => mockedNavigate,
        useParams: () => mockedParams,
    };
});

// 2. Axios
const mockApi = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
}));

vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => mockApi),
    },
}));

// 3. Toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

// 4. URL.createObjectURL
globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake-url');

// 5. Mock do PrimeReact AutoComplete (ESSENCIAL PARA O TESTE PASSAR)
// Substituímos o componente complexo por um input simples controlado
vi.mock('primereact/autocomplete', () => ({
    AutoComplete: ({ value, onChange, placeholder, disabled, id }: any) => (
        <div data-testid="mock-autocomplete-container">
            <input
                data-testid="mock-autocomplete-input"
                placeholder={placeholder}
                // Se for objeto, mostra o nome. Se for string, mostra a string.
                value={value && typeof value === 'object' ? value.n : value || ''}
                onChange={(e) => {
                    // Simula digitar texto (limpa a seleção de objeto)
                    onChange({ value: e.target.value });
                }}
                disabled={disabled}
                id={id}
            />
            {/* Botão para simular que o usuário clicou em "Ferro" na lista */}
            <button
                type="button"
                data-testid="btn-simular-selecao"
                onClick={() => onChange({ value: { s: 'Fe', n: 'Ferro' } })}
            >
                Simular Seleção Ferro
            </button>
        </div>
    )
}));

// --- DADOS MOCKADOS ---
const mockElementoExistente = {
    nome: 'Oxigênio',
    simbolo: 'O',
    nivel: 1,
    dicas: ['É um gás', 'Essencial para vida', 'Combustão'],
    imagemUrl: '/img/o.png',
    imgDistribuicao: '/img/dist/o.png'
};

describe('Página AdminElementoForm', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        mockedParams.id = undefined;
        sessionStorage.setItem('token', 'fake-token');
        vi.useFakeTimers({ shouldAdvanceTime: true });

        // Mock padrão para a lista de elementos já cadastrados
        mockApi.get.mockResolvedValue({ data: [] });
    });

    afterEach(() => {
        vi.useRealTimers();
        sessionStorage.clear();
    });

    const renderComponent = () => render(
        <BrowserRouter>
            <AdminElementoForm />
        </BrowserRouter>
    );

    // =========================================================================
    // 1. RENDERIZAÇÃO
    // =========================================================================

    it('Deve renderizar formulário vazio no modo "Novo Elemento"', async () => {
        mockedParams.id = undefined;
        renderComponent();

        expect(screen.getByText('Novo Elemento')).toBeInTheDocument();

        // Verifica se o nosso Mock do AutoComplete foi renderizado
        const inputAutoComplete = screen.getByTestId('mock-autocomplete-input');
        expect(inputAutoComplete).toBeInTheDocument();
        expect(inputAutoComplete).toHaveValue('');

        // Verifica inputs readonly
        expect(screen.getByPlaceholderText('Nome confirmado')).toHaveValue('');
        expect(screen.getByPlaceholderText('Símbolo')).toHaveValue('');
    });

    it('Deve carregar dados e preencher formulário no modo "Editar"', async () => {
        mockedParams.id = '8';

        // Mock específico para o GET do ID 8
        mockApi.get.mockImplementation((url) => {
            if (url === '/elementos/8') {
                return Promise.resolve({ data: mockElementoExistente });
            }
            return Promise.resolve({ data: [] });
        });

        renderComponent();

        expect(screen.getByText(/Editar:/)).toBeInTheDocument();

        await waitFor(() => {
            // Verifica se o Mock do AutoComplete recebeu o valor correto
            const inputAutoComplete = screen.getByTestId('mock-autocomplete-input');
            expect(inputAutoComplete).toHaveValue('Oxigênio');

            // NÃO VERIFICAR 'Nome confirmado' aqui, pois ele não existe na edição!

            // Verifica se as dicas foram carregadas
            expect(screen.getByDisplayValue('É um gás')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // 2. HAPPY PATH
    // =========================================================================

    it('Deve criar um NOVO elemento com sucesso', async () => {
        mockedParams.id = undefined;
        mockApi.post.mockResolvedValueOnce({ data: { success: true } });

        renderComponent();

        // 1. Simula a seleção usando o botão do nosso Mock
        fireEvent.click(screen.getByTestId('btn-simular-selecao'));

        // Verifica se os inputs readonly foram preenchidos (efeito colateral da seleção)
        expect(screen.getByPlaceholderText('Nome confirmado')).toHaveValue('Ferro');
        expect(screen.getByPlaceholderText('Símbolo')).toHaveValue('Fe');

        // 2. Preenche Dicas
        const inputsDica = screen.getAllByPlaceholderText(/Dica \d/);
        fireEvent.change(inputsDica[0], { target: { value: 'Metal' } });
        fireEvent.change(inputsDica[1], { target: { value: 'Magnético' } });
        fireEvent.change(inputsDica[2], { target: { value: 'Hematita' } });

        // 3. Salvar
        const btnSalvar = screen.getByText('Salvar');
        fireEvent.click(btnSalvar);

        await waitFor(() => {
            // Verifica o FormData enviado.
            // Nota: O componente normaliza strings (lowercase/nfd), então esperamos 'ferro' e 'fe'
            expect(mockApi.post).toHaveBeenCalledWith('/elementos', expect.any(FormData), expect.anything());
            expect(toast.success).toHaveBeenCalledWith('Criado com sucesso!');
        });

        act(() => { vi.advanceTimersByTime(500); });
        expect(mockedNavigate).toHaveBeenCalledWith('/admin/elementos');
    });

    it('Deve atualizar um elemento EXISTENTE com sucesso', async () => {
        mockedParams.id = '8';
        mockApi.get.mockImplementation((url) => {
            if (url === '/elementos/8') return Promise.resolve({ data: mockElementoExistente });
            return Promise.resolve({ data: [] });
        });
        mockApi.put.mockResolvedValueOnce({ data: { success: true } });

        renderComponent();
        await waitFor(() => screen.getByTestId('mock-autocomplete-input'));

        // Simula mudança de valor (selecionando Ferro em vez de Oxigênio)
        fireEvent.click(screen.getByTestId('btn-simular-selecao'));

        fireEvent.click(screen.getByText('Salvar'));

        await waitFor(() => {
            expect(mockApi.put).toHaveBeenCalledWith('/elementos/8', expect.any(FormData), expect.anything());
            expect(toast.success).toHaveBeenCalledWith('Editado com sucesso!');
        });
    });

    // =========================================================================
    // 3. UNHAPPY PATH
    // =========================================================================

    it('Deve impedir envio se campos obrigatórios estiverem vazios', () => {
        renderComponent();

        // Não clicamos no botão de seleção do mock, então o input está vazio

        const btnSalvar = screen.getByText('Salvar');
        fireEvent.click(btnSalvar);

        expect(toast.error).toHaveBeenCalledWith('Selecione um elemento válido.');
        expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('Deve impedir envio se as dicas não estiverem completas', () => {
        renderComponent();

        // Seleciona elemento
        fireEvent.click(screen.getByTestId('btn-simular-selecao'));

        // Preenche só uma dica
        const inputsDica = screen.getAllByPlaceholderText(/Dica \d/);
        fireEvent.change(inputsDica[0], { target: { value: 'Metal' } });

        fireEvent.click(screen.getByText('Salvar'));

        expect(toast.error).toHaveBeenCalledWith('Preencha as 3 dicas.');
        expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('Deve exibir erro se falhar ao carregar dados na edição', async () => {
        mockedParams.id = '999';
        // Simula erro no GET
        mockApi.get.mockRejectedValueOnce(new Error('Network Error'));

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Erro ao carregar dados.')).toBeInTheDocument();
        });
    });
});