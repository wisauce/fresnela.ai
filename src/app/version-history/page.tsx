import { redirect } from "next/navigation";

export default function VersionHistoryRedirectPage() {
  redirect("/workspaces");
}
