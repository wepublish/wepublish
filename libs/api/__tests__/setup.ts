/* file for setting up the environment before any test */
import fetch from 'jest-fetch-mock';
jest.setMock('node-fetch', fetch);
