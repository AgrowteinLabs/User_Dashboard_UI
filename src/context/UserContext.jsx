import { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import fetchUser from '../api/fetchuser';

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const data = await fetchUser();
      if (data && !data.error) {
        setUser(data);
      } else {
        // Fallback: at minimum show the stored email from login
        const email = localStorage.getItem('rememberedEmail') || '';
        setUser({ name: '', email });
      }
    };
    loadUser();
  }, []);

  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { UserContext, UserProvider };
