---
title: Print issues: number them your way
lead: Under Settings › Print issues you now set how your printed issues are numbered, restarting every year («6.26») or running on («#117»), and how an issue is written.
actionRequired: false
---

Available for media with the print export switched on. Nothing changes until you change the settings.

- **Numbering**:
  - **Per year** (as before): numbers start at 1 every year, e.g. 6.26.
  - **Continuous**: numbers run on across years, e.g. #117, #118. A new issue and «Duplicate» suggest the next number after the highest one of any year. The issue form no longer asks for a year, because the year follows from the ship day.
- **How an issue is written**: a template with the placeholders `{range}` (the number, «3/4» for a double issue), `{number}` (the first number only), `{yy}` and `{yyyy}` (the year).
  - Three examples to start from: «6.26» (`{range}.{yy}`), «#117» (`#{range}`), «Nr. 6/2026» (`Nr. {range}/{yyyy}`).
  - A preview shows a single and a double issue.
  - With numbers per year, the template must contain the year.
- The template applies everywhere: the issue list, print list file names (`druckliste-117-….csv`) and single-copy orders in bexio, which must name the issue the same way (e.g. «Einzelheft #117»).
