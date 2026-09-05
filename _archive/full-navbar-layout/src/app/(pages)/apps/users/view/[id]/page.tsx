// Component Imports
import UserViewApp from '@/views/apps/users/view'

interface UserViewPageProps {
  params: Promise<{ id: string }>
}

const UserViewPage = async ({ params }: UserViewPageProps) => {
  const { id } = await params

  return <UserViewApp userId={id} />
}

export default UserViewPage
