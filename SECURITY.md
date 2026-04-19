# Security policy

## Supported versions

Apollo Studio is pre-1.0 and ships from a single `main` branch. Only the
latest release (or the tip of `main` if no tag exists yet) receives
security fixes. Older commits are not patched.

## Reporting a vulnerability

**Please do not file a public GitHub issue** for suspected security
problems. Report privately instead:

- Open a GitHub **Security Advisory** through the repository's *Security*
  tab once the project goes public. This is the preferred channel —
  it lets maintainers coordinate a fix and a disclosure timeline before
  details are public.
- Alternatively, email the maintainers. The contact address will be
  published in `README.md` once the repository goes public. If you are
  looking at a pre-publication copy, you can DM the maintainers on the
  social channel where you found the project.

Please include:

- A clear description of the issue, and why you believe it is a security
  concern.
- Steps to reproduce, including the exact version or commit hash.
- Your assessment of the impact (who is affected, what an attacker can
  achieve, any known mitigations).
- Whether you want credit in the fix changelog, and what name to use.

## Response timeline

We aim for the following, acknowledging that this is a volunteer-driven
project:

- **Within 72 hours:** an acknowledgment that your report was received
  and who is handling it.
- **Within 14 days:** an initial assessment — confirmation or
  clarification questions.
- **Within 90 days:** a fix or a clear mitigation plan with a disclosure
  date.

If the issue is actively exploited in the wild we will move faster and
coordinate publication with you before patching.

## Scope

Apollo Studio is a **client-side web application**. All code runs in the
user's browser; the repository does not ship a server component. The
primary threat surfaces we care about are:

- Malicious project JSON or catalog JSON that causes unsafe runtime
  behavior when imported — for example, sandbox escape, prototype
  pollution, denial of service.
- Exploitable issues in the build or deploy pipeline (GitHub Actions
  workflows, dependencies pulled during `npm install`).
- XSS vectors in user-entered text fields (entity names, material names).

**Out of scope:**

- Self-hosted deployments where the integrator has added server
  components — those are the integrator's responsibility, but we will
  still coordinate on advisories if the root cause is in our code.
- Features not yet shipped (the AI assistant shell, WebXR pathway).
- Browser vulnerabilities themselves. Report those upstream.

## Safe-harbor

We will not pursue legal action against researchers who make a good-faith
effort to:

- Report privately and wait for a coordinated disclosure window.
- Avoid accessing data belonging to third parties.
- Avoid degrading the availability of the public demo beyond what is
  strictly necessary to demonstrate the issue.

Thanks for helping us keep Apollo Studio safe.
