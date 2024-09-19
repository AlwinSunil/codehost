"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

const TaskRefetchContext = createContext();

export const TaskRefetchProvider = ({ children }) => {
  const [version, setVersion] = useState(0);

  const refetchTasks = useCallback(() => {
    setVersion((prevVersion) => prevVersion + 1);
  }, []);

  return (
    <TaskRefetchContext.Provider value={{ version, refetchTasks }}>
      {children}
    </TaskRefetchContext.Provider>
  );
};

export const useTaskRefetch = () => useContext(TaskRefetchContext);
