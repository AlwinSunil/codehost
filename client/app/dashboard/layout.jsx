import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import Ribbon from "@/app/components/Ribbon";

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect("/");
  }

  return (
    <>
      {/* <Ribbon /> */}
      <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-1 px-4 py-3 md:px-10">
        {children}
      </div>
    </>
  );
}
