---
title: Letters held at the print vendor have their own state and are not sent twice
lead: A letter the print vendor accepted but holds for someone to look at now shows as «Action required» instead of «rejected», and We.Publish no longer hands such a letter over a second time.
actionRequired: false
---

**New state «Action required».** When the print vendor takes a letter but does not print it, for example because its check of the pdf failed, the list of sent messages shows the letter as **actionRequired** with the vendor's reason in the column **Error**. The letter is at the print vendor. Open it there and fix, release or delete it; the state in We.Publish follows on its own. **rejected** now only means that a letter never reached the print vendor.

**No more duplicates at the print vendor.** Until now an invoice letter the vendor held was handed over again, up to three times, and each time became a further letter there. What the vendor already holds is no longer handed over again. Only a letter that could not be handed over at all is still tried again on the following nights.

**It depends on «Send letters automatically»** in the letter integration:

- **Off** (someone confirms every letter at the print vendor): a held letter stays where it is until someone deals with it there.
- **On**: the following night We.Publish asks the print vendor about the held invoice letter. If nobody has dealt with it, the letter is removed there and a fresh one is posted in its place, at most three letters in all. A letter somebody fixed, sent or removed at the print vendor is left alone.

**Good to know.** A letter deleted at the print vendor before it was printed shows as **canceled**, and nothing is posted in its place. Letters that were logged as rejected although the print vendor holds them are shown as **actionRequired** from this update on.
