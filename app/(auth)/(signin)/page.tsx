import { Metadata } from 'next';
import Link from 'next/link';
import UserAuthForm from '@/components/forms/user-auth-form';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// Import the font for Atlas V1
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
          {/* Centered and Maximized Icon with responsive sizes */}
          <Image
            src={'/atlas.png'}
            alt={'Atlas V1 Logo'}
            // Default size for large screens
            width={500}
            height={500}
            className="aspect-square rounded-md object-cover md:h-[300px] md:w-[300px] lg:h-[500px] lg:w-[500px]"
            style={{
              maxWidth: '100%',
              height: 'auto'
            }}
            priority={true}
          />
          {/* Improved title display */}
          <h2
            className={`mt-4 text-4xl font-bold lg:text-6xl ${spectral.className}`}
            style={{
              fontFamily: "'Spectral', serif"
            }}
          >
            <span className="block text-center text-white lg:text-left">
              Atlas V1
            </span>
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
      <div className="flex h-full flex-col items-center justify-center space-y-6 p-4 lg:p-8">
        {/* Enlarge Atlas logo and align to top for mobile */}
        <div className="flex flex-col items-center justify-center space-y-4 lg:hidden">
          <Image
            src={'/atlas.png'}
            alt={'Atlas V1 Logo'}
            // Consistent size for small and mobile screens
            width={200}
            height={200}
            className="aspect-square rounded-md object-cover"
            style={{
              maxWidth: '100%',
              height: 'auto'
            }}
            priority={true}
          />

          {/* Improved mobile title display */}
          <h2
            className={`text-3xl font-bold lg:text-5xl ${spectral.className}`}
            style={{
              fontFamily: "'Spectral', serif"
            }}
          >
            <span className="block text-center text-gray-800">Atlas V1</span>
          </h2>
        </div>

        {/* Authentication Form */}
        <div className="flex w-full max-w-sm flex-col justify-center space-y-6 text-center">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome to Atlas V1
            </h1>
            <p className="text-sm text-muted-foreground">
              Login as a guest or with your GitHub account
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
