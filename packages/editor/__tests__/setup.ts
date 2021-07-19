// React 16 Enzyme adapter
import Enzyme from 'enzyme'
// import Adapter from 'enzyme-adapter-react-16'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17'

Enzyme.configure({adapter: new Adapter()})
