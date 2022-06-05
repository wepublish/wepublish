/* file for setting up the environment before any test */
import fetch from 'jest-fetch-mock'
jest.setMock('node-fetch', fetch)
process.env.TEST_MONGO_URL = 'mongodb://localhost:27017/wepublish_test'
