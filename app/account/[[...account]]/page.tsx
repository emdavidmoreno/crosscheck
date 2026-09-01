import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function AccountPage() {
  await auth.protect();

  return (
    <main className="flex flex-1 justify-center px-6 py-12">
      <UserProfile />
    </main>
  );
}
