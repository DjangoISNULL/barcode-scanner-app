import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
} from "react";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/browser";
import styled from "styled-components";
import FlashlightIcon from "./FlashlightIcon.js";

// Styled components for the video and overlay
const StyledVideoContainer = styled.div`
  position: relative;
  width: 100%;
  height: auto;
  border: 4px solid #00509f;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  overflow: hidden;
`;

const StyledVideo = styled.video`
  width: 100%;
  height: auto;
`;

const TorchButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: white;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;

  /* Top dimmed area */
  .dimmed-top {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 38%;
    background: rgba(0, 0, 0, 0.3);
  }

  /* Bottom dimmed area */
  .dimmed-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 38%;
    background: rgba(0, 0, 0, 0.3);
  }

  /* Left dimmed area */
  .dimmed-left {
    position: absolute;
    top: 38%;
    left: 0;
    width: 20%;
    height: 24%;
    background: rgba(0, 0, 0, 0.3);
  }

  /* Right dimmed area */
  .dimmed-right {
    position: absolute;
    top: 38%;
    right: 0;
    width: 20%;
    height: 24%;
    background: rgba(0, 0, 0, 0.3);
  }

  /* Transparent scanning area with corner markers */
  .scan-area {
    position: absolute;
    top: 38%;
    left: 20%;
    width: 60%;
    height: 24%;
    box-sizing: border-box;
    pointer-events: none;

    /* Corner markers */
    .corner {
      position: absolute;
      width: 20px;
      height: 20px;
      border: 4px solid white;
      box-sizing: border-box;
    }

    /* Top-left corner */
    .corner.top-left {
      top: -4px;
      left: -4px;
      border-bottom: none;
      border-right: none;
    }

    /* Top-right corner */
    .corner.top-right {
      top: -4px;
      right: -4px;
      border-bottom: none;
      border-left: none;
    }

    /* Bottom-left corner */
    .corner.bottom-left {
      bottom: -4px;
      left: -4px;
      border-top: none;
      border-right: none;
    }

    /* Bottom-right corner */
    .corner.bottom-right {
      bottom: -4px;
      right: -4px;
      border-top: none;
      border-left: none;
    }
  }
`;

const QRCodeScanner = forwardRef(
  ({ onScanComplete, onClose, isScannerActive }, ref) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const scannerControlsRef = useRef(null);
    const [isTorchOn, setIsTorchOn] = useState(false); // Manage torch state
    const videoTrackRef = useRef(null); // Ref for video track for torch control
    const mediaStreamRef = useRef(null); // Ref for media stream
    const requestIdRef = useRef(null);

    // Imperative handle to expose the stop function
    useImperativeHandle(ref, () => ({
      stop() {
        if (scannerControlsRef.current) {
          scannerControlsRef.current.stop();
          scannerControlsRef.current = null; // Clear reference
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        if (requestIdRef.current) {
          cancelAnimationFrame(requestIdRef.current);
          requestIdRef.current = null;
        }
        onClose();
      },
    }));

    // Torch control logic, apply constraints on the video track
    useEffect(() => {
      if (videoTrackRef.current) {
        videoTrackRef.current
          .applyConstraints({ advanced: [{ torch: isTorchOn }] })
          .catch((err) => console.error(`Torch error: ${err.message}`));
      }
    }, [isTorchOn]);

    // Toggle torch state with prevention of form submission
    const toggleTorch = useCallback(() => {
      setIsTorchOn((prevState) => !prevState); // Toggle the torch state
    }, []);

    // Handle successful scan logic
    const handleSuccessfulScan = useCallback(
      (scannedText, controls) => {
        controls.stop(); // Stop scanning

        // Turn off the torch before stopping the media stream
        if (videoTrackRef.current) {
          videoTrackRef.current
            .applyConstraints({ advanced: [{ torch: false }] })
            .catch((err) =>
              console.error(`Torch error during reset: ${err.message}`)
            );
        }

        setIsTorchOn(false); // Reset torch state to off

        if (scannerControlsRef.current) {
          scannerControlsRef.current = null;
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        onClose();
        onScanComplete(scannedText); // Trigger scan complete event
      },
      [onClose, onScanComplete]
    );

    // Start the scanner and handle media stream
    useEffect(() => {
      let autoStopTimeout;

      const startScanner = async () => {
        try {
          const constraints = {
            video: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
              advanced: [
                { focusMode: "continuous" },
                { zoom: 1.0 },
                { focusDistance: 0.1 },
              ],
            },
          };

          // Specify desired barcode formats
          const desiredFormats = [
            BarcodeFormat.CODE_128, // Common 1D barcode
            BarcodeFormat.EAN_13, // Common 1D barcode
            BarcodeFormat.DATA_MATRIX, // 2D barcode
          ];

          // Set decoding hints using string key 'possibleFormats'
          // This key corresponds to DecodeHintType.POSSIBLE_FORMATS
          const hints = new Map();
          hints.set("possibleFormats", desiredFormats);

          // Initialize codeReader with hints
          const codeReader = new BrowserMultiFormatReader(hints);

          // Start video stream
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          mediaStreamRef.current = stream;
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          // Store the video track for torch control
          const track = stream.getVideoTracks()[0];
          videoTrackRef.current = track;

          // Define scanner control object with stop() method
          const controls = {
            stop: () => {
              if (requestIdRef.current) {
                cancelAnimationFrame(requestIdRef.current);
                requestIdRef.current = null;
              }
            },
          };
          scannerControlsRef.current = controls;

          // Function to decode each frame
          const decodeFrame = async () => {
            try {
              if (
                videoRef.current.readyState ===
                videoRef.current.HAVE_ENOUGH_DATA
              ) {
                const videoWidth = videoRef.current.videoWidth;
                const videoHeight = videoRef.current.videoHeight;

                if (videoWidth && videoHeight) {
                  const overlayX = (videoWidth * 20) / 100; // Match overlay dimensions
                  const overlayY = (videoHeight * 38) / 100;
                  const overlayWidth = (videoWidth * 60) / 100;
                  const overlayHeight = (videoHeight * 24) / 100;

                  // Create canvas if not existing
                  if (!canvasRef.current) {
                    canvasRef.current = document.createElement("canvas");
                  }
                  const canvas = canvasRef.current;
                  canvas.width = overlayWidth;
                  canvas.height = overlayHeight;
                  const ctx = canvas.getContext("2d");

                  // Draw video frame to the canvas
                  ctx.drawImage(
                    videoRef.current,
                    overlayX,
                    overlayY,
                    overlayWidth,
                    overlayHeight,
                    0,
                    0,
                    overlayWidth,
                    overlayHeight
                  );

                  // Decode the image from the canvas
                  const result = await codeReader.decodeFromCanvas(canvas);

                  if (result) {
                    handleSuccessfulScan(result.text, controls);
                    return;
                  }
                }
              }
            } catch (err) {
              if (err && err.name !== "NotFoundException") {
                console.error("Scanner error:", err);
              }
            }
            requestIdRef.current = requestAnimationFrame(decodeFrame);
          };

          decodeFrame();

          // Auto-stop scanner after 20 seconds
          autoStopTimeout = setTimeout(() => {
            controls.stop();
            onClose();
          }, 20000);
        } catch (err) {
          console.error("Error initializing scanner:", err);
        }
      };

      if (isScannerActive) {
        startScanner();
      }

      return () => {
        if (scannerControlsRef.current) {
          scannerControlsRef.current.stop();
          scannerControlsRef.current = null;
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        if (autoStopTimeout) {
          clearTimeout(autoStopTimeout);
        }
      };
    }, [isScannerActive, onScanComplete, onClose, handleSuccessfulScan]);

    return (
      <>
        {isScannerActive && (
          <StyledVideoContainer>
            <StyledVideo ref={videoRef} autoPlay playsInline muted />
            <Overlay>
              <div className="dimmed-top" />
              <div className="dimmed-bottom" />
              <div className="dimmed-left" />
              <div className="dimmed-right" />
              <div className="scan-area">
                <div className="corner top-left" />
                <div className="corner top-right" />
                <div className="corner bottom-left" />
                <div className="corner bottom-right" />
              </div>
            </Overlay>

            <TorchButton type="button" onClick={toggleTorch}>
              <FlashlightIcon />
            </TorchButton>
          </StyledVideoContainer>
        )}
      </>
    );
  }
);

QRCodeScanner.displayName = "BW.QRCodeScanner";
export default QRCodeScanner;
