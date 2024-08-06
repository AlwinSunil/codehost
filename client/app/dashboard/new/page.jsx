export default function NewProject() {
  return (
    <div className="py-4">
      <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
      <span className="font-sans text-gray-500">
        To deploy a new Project, enter existing github repo url and select a
        branch.
      </span>

      <div className="mt-5 max-w-96">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="repo" className="text-sm font-medium">
              Github Repo
            </label>
            <input
              type="text"
              id="repo"
              className="h-10 border border-gray-300 px-3 py-1.5 font-sans text-sm text-gray-800 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-200 focus:ring-offset-2"
              placeholder="Enter Github Repo URL"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="branch" className="text-sm font-medium">
              Branch
            </label>
            <select
              name=""
              id=""
              className="h-10 border border-gray-300 px-2 py-1.5 font-sans text-sm text-gray-800 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-200 focus:ring-offset-2"
            >
              <option value="">Select a branch</option>
              <option value="main">main</option>
              <option value="develop">develop</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="inline-flex justify-center border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
