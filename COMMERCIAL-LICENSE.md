# Commercial License

Apollo Studio is offered under a **dual license**:

1. **Open-source:** [GNU Affero General Public License v3.0 or later](./LICENSE) (AGPL-3.0-or-later).
2. **Commercial:** the terms described in this file.

You may choose either. If AGPL-3.0 fits your deployment, you do not need a
commercial license. This document exists for teams for whom AGPL does not.

---

## When a commercial license is required

AGPL-3.0 is a strong copyleft license. Broadly, if you modify Apollo Studio
and make the result available to users **over a network** (for example, host
it on your own domain as a product or inside a SaaS), AGPL requires you to
publish your complete corresponding source code to those users, including
the modifications, under AGPL-compatible terms.

You will typically need a commercial license if any of the following apply:

- You want to embed Apollo Studio (or a derivative) in a **closed-source
  product**, desktop application, or mobile application.
- You operate a **hosted service or SaaS** built on Apollo Studio and cannot
  or do not wish to publish your source code under AGPL-3.0.
- You are an **OEM** bundling Apollo Studio with your own software.
- You integrate Apollo Studio into a codebase that is subject to license
  terms incompatible with AGPL-3.0.
- Your legal or procurement process disallows AGPL-licensed dependencies.

You do **not** need a commercial license for:

- Personal use, exploration, and learning.
- Teaching, research, and academic work that complies with AGPL.
- Internal use inside an organization where no modified version is exposed
  to outside users over a network.
- Open-source projects that are compatible with AGPL-3.0-or-later.

If you are unsure which applies to you, contact us before shipping.

---

## What a commercial license gives you

The commercial license grants a perpetual, worldwide, non-exclusive,
non-transferable license to use, modify, and distribute Apollo Studio as
part of your own products **without the source disclosure obligations of
AGPL-3.0**. In exchange, the commercial license:

- Requires attribution in a reasonable location (for example, an **About**
  screen or settings page).
- Does not transfer ownership of Apollo Studio or its trademarks.
- Does not grant the right to re-license Apollo Studio standalone.
- Comes with a warranty disclaimer comparable to open-source norms unless
  you purchase an explicit support or warranty addendum.

Specific terms — pricing tiers, named-user vs. site licenses, support SLAs,
escrow options — are negotiated per deal based on deployment scope.

---

## How to obtain a commercial license

Commercial licensing is handled through direct contact. Please reach out
with:

- A short description of the product or service you are building.
- Your expected number of end users or installations.
- Hosting model (self-hosted, multi-tenant SaaS, on-device, mixed).
- Any specific support, indemnification, or escrow requirements.

> The contact address for commercial inquiries will be published in the
> project `README.md` and in `SECURITY.md` when the repository goes public.
> If you are reviewing this file before that date, open an issue on the
> repository tagged **`licensing`** and the maintainers will respond with a
> private channel.

---

## Relationship to AGPL obligations

Choosing the commercial license means you do **not** distribute your product
under AGPL-3.0. Conversely, you cannot combine the two — every deployment
is either (a) AGPL-compliant with full source disclosure, or (b) covered by
a valid commercial license. A single installation cannot claim both.

If you accept contributions to Apollo Studio via pull request, those
contributions are licensed to the project under AGPL-3.0-or-later by
default, and the maintainers reserve the right to relicense them under the
commercial terms described above. This is a standard contributor license
model known as **inbound=AGPL, outbound=dual**. A formal CLA may be
introduced before the 1.0 release; until then, by opening a PR you agree
to these terms.

---

## Third-party components

Apollo Studio uses third-party libraries under their own licenses. See
[`NOTICE.md`](./NOTICE.md) for the canonical list and attribution text.
A commercial license for Apollo Studio does not alter or override the
license terms of those third-party libraries — you must still comply
with them independently.
