const RollbackButton = ({ task, isLatest, revertLoading, handleRollback }) => {
  const taskLabel = isLatest
    ? "Instant rollback to the latest successful task"
    : "Rollback active deployment to this task";
  const rollbackType = isLatest ? "latest" : "previous";

  return (
    <>
      <hr className="mx-4 mb-3" />
      <div className="mx-4 mb-3 mt-0 flex w-fit items-center gap-3 pl-3 font-sans text-xs">
        <p className="font-medium">{taskLabel}</p>
        <span className="text-gray-700">#{task.id.slice(0, 10)}</span>
        <button
          className="flex gap-1.5 bg-black px-2 py-1 text-white disabled:bg-gray-500"
          disabled={revertLoading}
          onClick={() => handleRollback(task.id, rollbackType)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
          </svg>{" "}
          {revertLoading ? "Loading..." : "Instant rollback"}
        </button>
      </div>
    </>
  );
};

export default RollbackButton;
