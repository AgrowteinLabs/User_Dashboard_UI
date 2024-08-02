// src/context/UserContext.js

import React, { createContext, useState, useEffect } from 'react';
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

export { UserContext, UserProvider };
