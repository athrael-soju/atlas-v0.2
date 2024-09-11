import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getUserData } from '@/lib/service/mongodb';
import { RerankResponseResultsItem } from 'cohere-ai/api/types/RerankResponseResultsItem';
import { ProfileSettings } from '@/types/settings';
import { countryOptions, languageOptions } from '@/constants/profile';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: 'accurate' | 'normal';
  } = {}
) {
  const { decimals = 0, sizeType = 'normal' } = opts;

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const accurateSizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === 'accurate' ? accurateSizes[i] ?? 'Bytest' : sizes[i] ?? 'Bytes'
  }`;
}

export function composeEventHandlers<E>(
  originalEventHandler?: (event: E) => void,
  ourEventHandler?: (event: E) => void,
  { checkForDefaultPrevented = true } = {}
) {
  return function handleEvent(event: E) {
    originalEventHandler?.(event);

    if (
      checkForDefaultPrevented === false ||
      !(event as unknown as Event).defaultPrevented
    ) {
      return ourEventHandler?.(event);
    }
  };
}

export const toAscii = (str: string): string => {
  return str.replace(/[^\x00-\x7F]/g, '');
};

// TODO: Make the User type consistent
export const validateUser = async (userId: string): Promise<any> => {
  const userServerData = await getUserData(userId);
  if (userServerData._id.toString() !== userId) {
    throw new Error('Invalid user');
  }
  return userServerData;
};

// Helper function to format a single result item
export function formatResult(
  result: RerankResponseResultsItem,
  index: number
): string {
  const doc = result.document as any;
  return `
  Document ${index + 1}, Filename: ${doc.filename || 'N/A'}, Filetype: ${
    doc.filetype || 'N/A'
  }, Languages: ${doc.languages || 'N/A'}, Page Number: ${
    doc.page_number || 'N/A'
  }, Relevance Score: ${result.relevanceScore.toFixed(4)}
  Content: ${doc.text || 'No content available'}
  Citation: ${doc.citation || 'N/A'}
`;
}

// Function to format all filtered results
export function formatFilteredResults(
  filteredResults: RerankResponseResultsItem[],
  topN: number,
  userMessage: string
): string {
  const formattedResults = filteredResults.map(formatResult).join('');

  return `
==============
Context: Start
==============${formattedResults}==============
Context: End
==============
Instructions: Use available context to respond to the user message.
==============
USER MESSAGE: "${userMessage}"
==============`;
}

// Function to include personalized information in the response (if applicable)
export function addPersonalizedInfo(
  message: string,
  profileSettings: ProfileSettings
): string {
  if (profileSettings.personalizedResponses) {
    const countryOfOrigin = countryOptions.find(
      (country) => country.value === profileSettings.countryOfOrigin
    )?.label;
    const preferredLanguage = languageOptions.find(
      (language) => language.value === profileSettings.preferredLanguage
    )?.label;

    const firstName = profileSettings?.firstName?.trim() || '';
    const lastName = profileSettings?.lastName?.trim() || '';
    const fullName =
      firstName === '' && lastName === '' ? 'N/A' : `${firstName} ${lastName}`;
    const email = profileSettings?.email?.trim() || 'N/A';
    const contactNumber = profileSettings?.contactNumber || 'N/A';
    const country = countryOfOrigin?.trim() || 'N/A';

    const finalMessage = `
==============
User Profile:
==============
  Name: ${fullName}
  Email: ${email}
  Contact Number: ${contactNumber}
  Country of Origin: ${country}
  Preferred Language: ${preferredLanguage}${message}`;
    // TODO: Simplify / make more readable
    return finalMessage;
  }

  return message;
}
