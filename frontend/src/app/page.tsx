import { redirect } from 'next/navigation'

// Root page: redirect to login
// After auth, middleware will redirect to /dashboard
export default function RootPage() {
  redirect('/login')
}
