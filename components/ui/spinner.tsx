import { Comment } from 'react-loader-spinner';
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
