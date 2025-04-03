import React, { useState } from "react";
import styled, { keyframes } from "styled-components";

// Define keyframes for the "pulse" animation when the button is clicked
const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
`;

// Styled component for the icon with click/tap animation
const IconWrapper = styled.img`
  width: 40px;
  height: 40px;
  transition: transform 0.2s ease-in-out;

  // Apply pulse animation when clicked/tapped
  &.clicked {
    animation: ${pulse} 0.3s ease-in-out;
  }
`;

const FlashlightIcon = () => {
  const [isError, setIsError] = useState(false);
  const [isClicked, setIsClicked] = useState(false); // To trigger the click animation

  const base64Image =
    "data:image/png;base64,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"; // Paste your base64 string here

  const handleClick = () => {
    setIsClicked(true); // Trigger the pulse animation
    setTimeout(() => setIsClicked(false), 300); // Reset animation after it finishes
  };

  return (
    <>
      {!isError && (
        <IconWrapper
          src={base64Image}
          alt="Flashlight Icon"
          className={isClicked ? "clicked" : ""} // Add clicked class when icon is clicked/tapped
          onClick={handleClick} // Trigger animation on tap/click
          onError={() => setIsError(true)} // Handle error for loading issues
        />
      )}
    </>
  );
};

export default FlashlightIcon;
