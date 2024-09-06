import { Comment, Hourglass, MagnifyingGlass } from 'react-loader-spinner';
import { useEffect, useState } from 'react';

export const Spinner = () => {
  const [spinnerColor, setSpinnerColor] = useState('');
  const [spinnerBackgroundColor, setSpinnerBackgroundColor] = useState('');

  useEffect(() => {
    // Retrieve the root element
    const rootElement = document.documentElement;

    // Use getComputedStyle to get the actual color values of the CSS variables
    const computedStyle = getComputedStyle(rootElement);

    // Extract the CSS variables for foreground and background
    const color = computedStyle.getPropertyValue('--card-foreground').trim();
    const backgroundColor = computedStyle.getPropertyValue('--card').trim();

    // Set the state to these values
    setSpinnerColor(`hsl(${color})`);
    setSpinnerBackgroundColor(`hsl(${backgroundColor})`);
  }, []);

  return (
    <Comment
      visible={true}
      height="35"
      width="35"
      ariaLabel="comment-loading"
      wrapperStyle={{}}
      wrapperClass="comment-wrapper"
      color={spinnerColor} // Set the color using the computed value
      backgroundColor={spinnerBackgroundColor} // Set the background color using the computed value
    />
  );
};

export const Searching = () => {
  return (
    <MagnifyingGlass
      visible={true}
      height="160"
      width="160"
      ariaLabel="magnifying-glass-loading"
      wrapperStyle={{}}
      wrapperClass="magnifying-glass-wrapper"
      glassColor="#c0efff"
      color="#e15b64"
    />
  );
};

export const Working = () => {
  return (
    <Hourglass
      visible={true}
      height="80"
      width="80"
      ariaLabel="hourglass-loading"
      wrapperStyle={{}}
      wrapperClass=""
      colors={['#306cce', '#72a1ed']}
    />
  );
};
