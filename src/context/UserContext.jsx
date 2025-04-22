import { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import userData from '../mockData/userData';

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Simulate fetching user data
    setTimeout(() => {
      setUser(userData);
    }, 1000);
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
