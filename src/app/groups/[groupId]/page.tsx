import { redirect } from 'next/navigation'

export default async function GroupIndexPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  redirect(`/groups/${groupId}/vorschlaege`)
}
