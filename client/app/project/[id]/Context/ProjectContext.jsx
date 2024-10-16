"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { getProject } from "../actions/getProject";

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children, id }) => {
  const router = useRouter();

  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);

  const fetchProject = useCallback(async () => {
    try {
      const response = await getProject(id);
      if (response.success === true) {
        setProject(response.project);
      } else {
        setError(response.message);
      }
      setError(null);
    } catch (error) {
      console.error("Error fetching project:", error);
      setError("Failed to fetch project details");
    }
  }, [id]);

  const refetchProject = useCallback(async () => {
    if (project && project.id) {
      await fetchProject();
    }
  }, [project, fetchProject, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return (
    <ProjectContext.Provider value={{ project, error, refetchProject }}>
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
