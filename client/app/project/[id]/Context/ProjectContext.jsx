"use client";

import React, { createContext, useContext } from "react";

const ProjectContext = createContext(null);

export const ProjectProvider = ({ project, children }) => {
  return (
    <ProjectContext.Provider value={project}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
