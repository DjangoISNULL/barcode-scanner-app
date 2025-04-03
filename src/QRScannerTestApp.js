import React, { useState, useRef } from "react";
import QRCodeScanner from "./QRCodeScanner"; // Import the QRCodeScanner component
import styled from "styled-components";

// Styled components for the form and video container
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const VideoWrapper = styled.div`
  width: 100%;
  max-width: 350px; // Reduced from 400px to 200px
  margin-top: 20px;
`;

const StyledButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  background-color: #00509f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
`;

// Styled component for the result field
const ResultField = styled.input`
  margin-top: 20px;
  padding: 10px;
  width: 80%;
  font-size: 16px;
`;

const QRScannerTestApp = () => {
  const [showScanner, setShowScanner] = useState(false); // Scanner visibility state
  const [scannedValue, setScannedValue] = useState(""); // State to hold the scanned value
  const scannerRef = useRef(null); // Reference to control the scanner

  // Toggle the scanner on/off
  const toggleScanner = () => {
    if (showScanner && scannerRef.current) {
      scannerRef.current.stop(); // Stop the scanner if active
    }
    setShowScanner(!showScanner); // Toggle scanner
  };

  return (
    <FormContainer>
      <StyledButton type="button" onClick={toggleScanner}>
        {showScanner ? "Stop scanner" : "Start scanner"}
      </StyledButton>

      <VideoWrapper>
        {/* Always render the QRCodeScanner */}
        <QRCodeScanner
          ref={scannerRef}
          isScannerActive={showScanner}
          onScanComplete={(value) => {
            setScannedValue(value); // Set the scanned value to the state
            setShowScanner(false); // Close scanner after successful scan
          }}
          onClose={() => setShowScanner(false)} // Handle scanner close (timeout or manual stop)
        />
      </VideoWrapper>

      {/* Display the scanned value outside the scanner logic */}
      <ResultField
        type="text"
        value={scannedValue}
        readOnly
        placeholder="Scanned value will appear here"
      />
    </FormContainer>
  );
};

export default QRScannerTestApp;
