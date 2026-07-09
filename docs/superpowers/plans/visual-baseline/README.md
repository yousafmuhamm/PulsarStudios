# Visual Baseline (pre-Phase-1)

Reference screenshots of the CURRENT site, captured before the Phase 1
performance optimization, to verify no visual regression afterward.

Captured with agent-browser (Chrome 150) against `npm run preview`
at commit before Task 1.1, desktop width (~1440px).

- home-desktop.png     — /
- about-desktop.png    — /about.html
- projects-desktop.png — /projects.html
- project-desktop.png  — /projects/nova-labs.html

Note: automated narrow-viewport (mobile) emulation was not available in
this agent-browser version, so mobile regression is verified manually.
The Phase 1 tree-shake (Task 1.1) is a pure import refactor with no
runtime logic change, so visual output is expected to be identical.
