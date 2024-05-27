// Importando o contextAPI do react:
import {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

// Importando a API:
import { api } from '../services/api';

export const AuthContext = createContext({});

function AuthProvider({ children }) {
  // Criando um state para salvar os dados:
  const [data, setData] = useState({});

  const [loading, setLoading] = useState(false);

  // Login:
  async function signIn({ email, password }) {
    try {
      setLoading(true);
      // Fazendo a requisição pro Backend:
      const response = await api.post('/sessions', {
        email,
        password,
      });

      // Obtendo apenas o user e o token de dentro da resposta vindo do api
      const { user, token } = response.data;

      // Armazenando no localStorage o usuário e o token;
      // Localstorage só aceita texto e, como user é um objeto, é preciso convertê-lo -> JSON.stringify(user):
      localStorage.setItem(
        '@foodexplorer:user',
        JSON.stringify(user)
      );
      localStorage.setItem('@foodexplorer:token', token);

      // Inserindo o token no cabeçalho de todas as requisições:
      api.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${token}`;

      // Armazenando no state o usuário e seu token
      setData({ user, token });

      setLoading(false);
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert('Não foi possível entrar.');
      }

      setLoading(false);
    }
  }

  // Logout:
  function signOut() {
    // Deletando as infos que estão no localstorage:
    localStorage.removeItem('@foodexplorer:token');
    localStorage.removeItem('@foodexplorer:user');

    // Voltando o state para vazio:
    setData({});
  }

  // Atualizando informações:
  async function updateProfile({ user, avatarFile }) {
    try {
      if (avatarFile) {
        // Fazendo o envio para o backend como se fosse o multiform do insomnia:
        setLoading(true);
        const fileUploadForm = new FormData();
        fileUploadForm.append('avatar', avatarFile);

        const response = await api.patch(
          '/users/avatar',
          fileUploadForm
        );
        user.avatar = response.data.avatar;
      }

      // Alterando no banco de dados (método put é para atualizar):
      await api.put('/users', user);

      // Atualizando os dados no localstorage:
      localStorage.setItem(
        '@foodexplorer:user',
        JSON.stringify(user)
      );

      setData({ user, token: data.token });
      alert('Perfil atualizado com sucesso!');

      setLoading(false);
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert('Não foi possível atualizar o perfil.');
      }

      setLoading(false);
    }
  }

  useEffect(() => {
    // Buscando as informações que estão no localstorage:
    const token = localStorage.getItem('@foodexplorer:token');
    const user = localStorage.getItem('@foodexplorer:user');

    // Caso token e user estejam armazenados no localstorage:
    if (token && user) {
      // Inserindo o token no cabeçalho de todas as requisições:
      api.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${token}`;

      // Armazenando no state o usuário e seu token:
      setData({
        token,
        // Voltando o que estava em formato de texto no localstorage para formato de objeto json:
        user: JSON.parse(user),
      });
    }
  }, []);

  return (
    // Aqui iremos compartilhar a função de signIn, signOut e o usuário com todos os Childrens (Rotas):
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        loading,
        setLoading,
        updateProfile,
        user: data.user,
      }}>
      {/* o CHILDREN vai ser o Routes do main.jsx */}
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);

  return context;
}

export { AuthProvider, useAuth };
