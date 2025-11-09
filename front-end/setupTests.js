import '@testing-library/jest-dom';

// Polyfill TextEncoder for Jest + Node < 18
import { TextEncoder, TextDecoder } from 'util';
// src/setupTests.js or your custom setup file
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
