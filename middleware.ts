// middleware.ts

import { withAuth } from 'next-auth/middleware';

// Protect the '/dashboard' route and its sub-routes
export default withAuth({
  pages: {
    signIn: '/' // Redirect here if not authenticated
  }
});

// Configure the matcher to specify which routes should be protected
export const config = {
  matcher: ['/dashboard/:path*']
};
