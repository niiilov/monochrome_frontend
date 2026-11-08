import { notFound } from "next/navigation";
import { WorkspacePage } from "../dashboard";
import { dashboardSections, type DashboardSection } from "../sections";

type Props = { params: Promise<{ section: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(dashboardSections).map(section => ({ section }));
}

function validateSection(section: string): DashboardSection {
  if (!Object.hasOwn(dashboardSections, section)) notFound();
  return section as DashboardSection;
}

export async function generateMetadata({ params }: Props) {
  const section = validateSection((await params).section);
  return { title: "MONO · " + dashboardSections[section] };
}

export default async function DashboardSectionPage({ params }: Props) {
  return <WorkspacePage section={validateSection((await params).section)} />;
}
