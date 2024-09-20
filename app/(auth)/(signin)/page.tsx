import { Metadata } from 'next';
import Link from 'next/link';
import UserAuthForm from '@/components/forms/user-auth-form';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// Import the font for Atlas II
import { Spectral } from 'next/font/google';

const spectral = Spectral({
  subsets: ['latin'],
  weight: '200'
});

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Authentication forms built using the components.'
};

export default function AuthenticationPage() {
  return (
    <div className="relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href="/examples/authentication"
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute right-4 top-4 hidden md:right-8 md:top-8'
        )}
      >
        Login
      </Link>

      {/* Icon section on larger screens */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="gradient-animation absolute inset-0" />
        <div className="relative flex h-full flex-col items-center justify-center">
          {/* Centered and Maximized Icon */}
          <Image
            src={'/atlas.png'}
            alt={'Atlas II Logo'} // Improved alt text for better accessibility
            width={350} // Size for large screens
            height={350} // Size for large screens
            loading="lazy"
            className="aspect-square rounded-md object-cover"
            layout="responsive" // Makes image responsive
          />
          <h2
            className={`mt-4 text-5xl font-bold ${spectral.className}`}
            style={{
              fontFamily: "'Spectral', serif" // Spectral for a Greek-inspired look
            }}
          >
            Atlas II
          </h2>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Welcome to Atlas; the best platform for building your next
              big idea&rdquo;
            </p>
            <footer className="text-sm">- John Doe</footer>
          </blockquote>
        </div>
      </div>

      {/* This section handles mobile layout */}
      <div className="flex h-full flex-col items-center justify-start space-y-6 p-4 lg:p-8">
        {/* Enlarge Atlas logo and align to top for mobile */}
        <div className="flex flex-col items-center justify-center space-y-4 lg:hidden">
          <Image
            src={'/atlas.png'}
            alt={'Atlas II Logo'}
            width={350} // Define only the aspect ratio
            height={350} // Define only the aspect ratio (1:1 square)
            loading="lazy"
            className="aspect-square rounded-md object-cover"
            layout="responsive" // Responsive layout for scaling the image
          />

          <h2
            className={`text-4xl font-bold lg:text-5xl ${spectral.className}`} // Added responsive font sizing
            style={{
              fontFamily: "'Spectral', serif" // Spectral for a Greek-inspired look
            }}
          >
            Atlas II
          </h2>
        </div>

        {/* Authentication Form */}
        <div className="flex w-full max-w-sm flex-col justify-center space-y-6 text-center">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email below to create your account
            </p>
          </div>
          <UserAuthForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{' '}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
