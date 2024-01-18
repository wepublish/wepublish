import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './payment-method-picker.stories'

describe('PaymentMethodPicker', () => {
  runStorybookTests(stories)
})
