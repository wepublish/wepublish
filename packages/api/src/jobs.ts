import {Context} from './context'

async function dailyMembershipRenewal(context: Context): Promise<void> {
  // const {dbAdapter} = context
}

export async function runJob(command: string, context: Context): Promise<void> {
  switch (command) {
    case 'dailyMembershipRenewal':
      await dailyMembershipRenewal(context)
  }
}
