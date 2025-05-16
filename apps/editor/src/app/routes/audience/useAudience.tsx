import {MdCancel, MdCreditCardOff, MdLibraryAdd, MdRefresh, MdSpaceBar} from 'react-icons/md'

import {AggregatedUsers} from './audience-dashboard'

export function useAudience() {
  function getIconByUserFilter(filterProp: AggregatedUsers) {
    switch (filterProp) {
      case 'createdSubscriptionUsers':
        return <MdLibraryAdd />
      case 'createdUnpaidSubscriptionUsers':
        return <MdCreditCardOff />
      case 'deactivatedSubscriptionUsers':
        return <MdCancel />
      case 'renewedSubscriptionUsers':
        return <MdRefresh />
      case 'replacedSubscriptionUsers':
        return <MdSpaceBar />
      default:
        break
    }
  }

  return {
    getIconByUserFilter
  }
}
