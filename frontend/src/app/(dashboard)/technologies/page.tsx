import { TechnologiesManager } from "@/features/technologies/components/technologies-manager";
import { getSessionRole, SYSADMIN_ROLE } from "@/lib/auth/session";

export default async function TechnologiesPage() {
  const role = await getSessionRole();
  return <TechnologiesManager canDelete={role === SYSADMIN_ROLE} />;
}
