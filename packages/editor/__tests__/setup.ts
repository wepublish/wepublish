import Enzyme from 'enzyme'
// Experimental React 17 Enzyme adapter
import Adapter from '@wojtekmaj/enzyme-adapter-react-17'

Enzyme.configure({adapter: new Adapter()})
