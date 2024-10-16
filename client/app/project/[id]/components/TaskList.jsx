"use client";

import React, { useCallback, useEffect, useState } from "react";

import { toast } from "sonner";

import RollbackButton from "./RollbackButton";
import TaskItem from "./TaskItem";
import { fetchTasks } from "../actions/fetchTasks";
import { rollbackDeployment } from "../actions/rollbackDeployment";
import { useProject } from "../Context/ProjectContext";
import { useTaskRefetch } from "../Context/TaskRefetchContext";

export default function TaskList({ projectId, currentUserId }) {
  const { project, refetchProject } = useProject();
  const { version } = useTaskRefetch();

  const [latestTask, setLatestTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [revertLoading, setRevertLoading] = useState(false);
  const [previousDeployment, setPreviousDeployment] = useState(null);

  const fetchTasksData = useCallback(
    async (startIndex, limit) => {
      setLoading(true);
      try {
        return await fetchTasks(projectId, startIndex, limit, currentUserId);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [projectId, currentUserId],
  );

  const findDeployments = useCallback((tasks) => {
    const completedTasks = tasks.filter((task) => task.status === "COMPLETED");
    if (completedTasks.length === 0) return { latest: null, previous: null };
    const latestCompleted = completedTasks[0];
    const previousCompleted =
      completedTasks.length > 1 ? completedTasks[1] : null;
    return { latest: latestCompleted, previous: previousCompleted };
  }, []);

  const handleRollback = async (taskId, type) => {
    setRevertLoading(true);
    try {
      const response = await rollbackDeployment(projectId, taskId, type);
      toast.success(response.message, { duration: 2000 });
    } catch (error) {
      console.error("Error during rollback:", error);
      toast.error("Could not rollback deployment", { duration: 2000 });
    } finally {
      setRevertLoading(false);
      refetchProject();
    }
  };

  const loadMoreTasks = useCallback(async () => {
    if (loading) return;
    const newTasks = await fetchTasksData(tasks.length + 1, 10);
    setTasks((prevTasks) => [...prevTasks, ...newTasks]);
    setHasMore(newTasks.length === 10);
  }, [loading, fetchTasksData, tasks.length]);

  useEffect(() => {
    const fetchInitialTasks = async () => {
      const fetchedTasks = await fetchTasksData(0, 11);
      if (fetchedTasks.length > 0) {
        setLatestTask(fetchedTasks[0]);
        setTasks(fetchedTasks.slice(1));
        setHasMore(fetchedTasks.length === 11);
      }
    };

    fetchInitialTasks();
  }, [fetchTasksData, version]);

  useEffect(() => {
    if (tasks.length > 0) {
      const { latest, previous } = findDeployments([latestTask, ...tasks]);
      setLatestTask(latest);
      setPreviousDeployment(previous);
    }
  }, [tasks, project.productionTaskId, findDeployments, latestTask]);

  return (
    <div className="mt-5 flex flex-col">
      <h2 className="mb-2.5 text-lg font-semibold">Other Deployment tasks</h2>
      <div className="flex flex-col border">
        {tasks.length === 0 && !loading ? (
          <div className="flex items-center px-4 py-2">No other tasks</div>
        ) : (
          <>
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col border-b last:border-b-0"
              >
                <TaskItem
                  projectId={projectId}
                  task={task}
                  prodTaskId={project.productionTaskId}
                />
                {task.id !== project.productionTaskId &&
                  (task.id === previousDeployment?.id ||
                    task.id === latestTask?.id) && (
                    <RollbackButton
                      task={task}
                      isLatest={task.id === latestTask?.id}
                      revertLoading={revertLoading}
                      handleRollback={handleRollback}
                    />
                  )}
              </div>
            ))}
          </>
        )}
        {loading && (
          <div className="flex items-center px-4 py-2">Loading...</div>
        )}
      </div>

      {hasMore && !loading && (
        <button
          onClick={loadMoreTasks}
          disabled={loading}
          className="mx-auto mt-4 bg-black px-3 py-1 text-xs font-medium text-white disabled:bg-gray-500"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
