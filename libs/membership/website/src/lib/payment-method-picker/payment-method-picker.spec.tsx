import {runStorybookTests} from '@wepublish/testing'
import * as stories from './payment-method-picker.stories'

describe('PaymentMethodPicker', () => {
  runStorybookTests(stories)
})
