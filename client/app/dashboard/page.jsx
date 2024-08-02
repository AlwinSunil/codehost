import { getServerSession } from "next-auth";

export default async function Dashboard() {
  const session = await getServerSession();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Hello {session?.user?.name}</p>
    </div>
  );
}
