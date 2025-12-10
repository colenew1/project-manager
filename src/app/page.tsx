import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function HomePage() {
  // Check if mobile based on user agent
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // Redirect to todos on mobile, projects on desktop
  redirect(isMobile ? '/todos' : '/projects');
}
