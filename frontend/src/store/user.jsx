
import { createContext, useContext, useState } from 'react';

const Ctx = createContext({
  usuario: null,
  login: () => {},
  logout: () => {},
});

export function UserProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario') || 'null');
    } catch {
      return null;
    }
  });

  const login = (u) => {
    setUsuario(u);
    localStorage.setItem('usuario', JSON.stringify(u));
    
    
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  };

  return (
    <Ctx.Provider value={{ usuario, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useUser = () => useContext(Ctx);
