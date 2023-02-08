import React from 'react'
import {Table, TableBody, TableCell, TableHead, TableRow} from '@mui/material'
import {IconButton, SelectPicker} from 'rsuite'
import {MdDelete} from 'react-icons/all'
import SubscriptionTimeline from './subscriptionTimeline'

export default function SubscriptionFlow() {
  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            {/* filter */}
            <TableCell>
              <b>Memberplan</b>
            </TableCell>
            <TableCell>
              <b>Payment Provider</b>
            </TableCell>
            <TableCell>
              <b>Periodicity</b>
            </TableCell>
            <TableCell>
              <b>Auto Renewal?</b>
            </TableCell>

            {/* mail templates only */}
            <TableCell>InvoiceCreation</TableCell>
            <TableCell>RenewalSuccess</TableCell>
            <TableCell>DeactivationUnpaid</TableCell>
            <TableCell>DeactivationByUser</TableCell>
            <TableCell>Reactivation</TableCell>

            {/* individual flow */}
            <TableCell>Individual flow</TableCell>

            {/* actions */}
            <TableCell>Aktionen</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* EVENTS WITHOUT ANY TIME SPECIFICATION */}
          {/* SUBSCRIBE */}
          <TableRow>
            <TableCell>
              <SelectPicker data={[]} />
            </TableCell>
            <TableCell>
              <SelectPicker data={[]} />
            </TableCell>
            <TableCell>
              <SelectPicker data={[]} />
            </TableCell>
            <TableCell>
              <SelectPicker data={[]} />
            </TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>

            {/* individual flow */}
            <TableCell>
              <SubscriptionTimeline />
            </TableCell>
            <TableCell align="center">
              <IconButton color="red" circle appearance="primary" icon={<MdDelete />} />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  )
}
