---
title: Print issues: print lists with deliveries, hand-over and supplements
lead: Under «Print issues» you create each printed issue, compute who receives a copy as of its ship day, export the list as a delivery, download its CSV and mark it as handed to the printshop. Handed-over deliveries count toward the issues each reader paid for.
actionRequired: false
---

Available for media with the print export switched on.

- **Each issue is a record**: number, ship day and a note, in a form next to the issue list. The list shows the status (Open, Exported, Closed, Historic), the deliveries, the copies and who closed the issue; «Duplicate» creates the next number with the same options. Who receives a copy is decided **as of the ship day**, not the day you export – an issue shipped in January lists the January subscribers.
- **Options instead of fixed rules**: per issue you pick the plans, whether bexio is read (institutions, gifts, bookshops, single issues – through the bexio payment provider's key under Integrations), whether «open» readers with an unpaid renewal receive a copy and whether subscriptions starting after the ship day get a gift copy. The defaults live under Settings → Plans; every delivery keeps the options it was computed with.
- **Compute, check, export**: «Compute copies» stores the list on the issue; you check its totals and every address; «Export copies» writes exactly that list as a delivery with its own CSV file. While the delivery is not handed over, computing again replaces it – or you delete it. A list older than 24 hours must be computed again.
- **Hand over**: once the file is at the printshop, mark the delivery as handed over. It is locked from then on and its copies count toward the paid issues. Corrections become a **supplement** from there: the same steps, only with the addresses in no earlier delivery – as its own delivery with its own file. The complete list of all deliveries is available at any time.
- **Close**: once every delivery is handed over, close the issue; «Unlock» undoes that at any time should a supplement still be needed.
- **Copies owed**: the setting «Issues per year (print)» and, per plan, «Printed issues per period» (e.g. 3 for a trial) say how many printed issues a paid period is worth. A reader whose paid period ended still receives copies until that number is reached. The issues shipped before the feature existed come in through the import as historic issues, so the current year counts.
